import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// GET /api/geo/find-church
//
// Determina a igreja mais adequada para um usuário com base em:
//   1. neighborhood_id (UUID de bairro cadastrado no banco)
//   2. Se o bairro foi digitado manualmente (ID não é UUID), tenta
//      geocodificar o texto + city_id e usa a função PostGIS.
//
// ALGORITMO GENÉRICO — funciona para qualquer cidade, qualquer
// quantidade de igrejas, sem lógica específica por nome de cidade.
//
// Prioridades (via função SQL find_church_for_neighborhood):
//   1. Regra manual (geographic_rules)
//   2. Atribuição church_neighborhoods
//   3. Proximidade via PostGIS (distância ao centróide do bairro)
//   4. Qualquer igreja ativa na cidade (último recurso)
// ============================================================

async function geocodeTextViaCity(
  text: string,
  cityName: string,
  stateUf: string
): Promise<{ latitude: number; longitude: number } | null> {
  // Tenta encontrar coordenadas para um bairro/endereço digitado livremente
  // usando Nominatim, restrito à cidade informada
  const q = `${text}, ${cityName}, ${stateUf}, Brasil`
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', q)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'br')

  try {
    const res = await fetch(url.toString(), {
      headers: { 'User-Agent': 'EvangelismoApp/1.0 (church-routing-system)' },
      next: { revalidate: 3600 }, // cacheia por 1h — bairros não mudam de posição
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data || data.length === 0) return null
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    }
  } catch {
    return null
  }
}

// Verifica se a string é um UUID válido
function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const neighborhoodId = searchParams.get('neighborhood_id')
  const cityId = searchParams.get('city_id')
  const campaignId = searchParams.get('campaign_id')
  // Texto original do bairro digitado (para geocodificação de bairros não cadastrados)
  const neighborhoodText = searchParams.get('neighborhood_text')

  if (!neighborhoodId && !cityId) {
    return NextResponse.json({ error: 'neighborhood_id or city_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  let result: any = null

  // ============================================================
  // CASO 1: neighborhood_id é um UUID válido (bairro cadastrado no banco)
  // Delega 100% ao algoritmo PostGIS — genérico para qualquer cidade
  // ============================================================
  if (neighborhoodId && isValidUUID(neighborhoodId)) {
    const { data, error } = await supabase.rpc('find_church_for_neighborhood', {
      p_neighborhood_id: neighborhoodId,
      p_campaign_id: campaignId ?? undefined,
    })

    if (!error && data?.length) {
      result = data[0]
    }
  }

  // ============================================================
  // CASO 2: Se não houver resultado, ou se o resultado foi 'fallback' genérico,
  // tenta geocodificar o texto + city_id e usa find_nearest_church_for_point
  // ============================================================
  const isFallback = result?.assignment_method === 'fallback'
  
  if ((!result || isFallback) && cityId && neighborhoodText) {
    // Busca a cidade para obter nome e estado (para geocodificação mais precisa)
    const { data: cityData } = await supabase
      .from('cities')
      .select('id, name, states(uf)')
      .eq('id', cityId)
      .single()

    if (cityData) {
      const stateUf = (cityData.states as any)?.uf || ''
      const coords = await geocodeTextViaCity(neighborhoodText, cityData.name, stateUf)

      if (coords) {
        // Busca a igreja mais próxima dessas coordenadas na cidade, usando PostGIS
        // Isso é genérico: funciona para qualquer cidade com igrejas que tenham location cadastrada
        const { data: nearestChurches } = await (supabase as any).rpc('find_nearest_church_for_point', {
          p_city_id: cityId,
          p_longitude: coords.longitude,
          p_latitude: coords.latitude,
          p_campaign_id: campaignId || null,
        })

        if (nearestChurches && Array.isArray(nearestChurches) && nearestChurches.length > 0) {
          result = { ...nearestChurches[0], assignment_method: 'proximity_custom' }
        }

      }
    }
  }

  // ============================================================
  // CASO 3: Fallback por city_id — seleciona a melhor igreja disponível
  // Usa ORDER BY: primeiro igrejas com location (PostGIS), depois sem
  // Não usa LIMIT 1 aleatório — ordena por churches com mais dados primeiro
  // ============================================================
  if (!result && cityId) {
    // Busca todas as igrejas ativas da cidade
    const { data: cityChurches } = await supabase
      .from('churches')
      .select('id, name, latitude, longitude')
      .eq('city_id', cityId)
      .eq('status', 'active')
      .order('name') // ordenação estável

    if (cityChurches && cityChurches.length > 0) {
      // Prefere igrejas com coordenadas (para que no futuro possa aplicar proximidade)
      const withCoords = cityChurches.filter((c) => c.latitude && c.longitude)
      const best = withCoords.length > 0 ? withCoords[0] : cityChurches[0]

      result = {
        church_id: best.id,
        church_name: best.name,
        assignment_method: cityChurches.length === 1 ? 'single_church' : 'fallback_city',
        distance_meters: null,
      }
    }
  }

  if (!result) {
    return NextResponse.json({ church: null, method: 'not_found' })
  }

  // ============================================================
  // Busca dados completos da igreja encontrada
  // ============================================================
  const { data: church, error: churchError } = await supabase
    .from('churches')
    .select(`
      *,
      pastors!pastors_church_id_fkey (id, full_name, photo_url)
    `)
    .eq('id', result.church_id)
    .single()

  if (churchError || !church) {
    return NextResponse.json({ church: null, method: 'error' })
  }

  // Busca pixels específicos da igreja
  const { data: trackingPixels } = await supabase
    .from('tracking_pixels')
    .select('pixel_type, pixel_id, config')
    .eq('scope', 'church')
    .eq('church_id', result.church_id)
    .eq('is_active', true)

  return NextResponse.json({
    church,
    pixels: trackingPixels || [],
    method: result.assignment_method,
    distance_meters: result.distance_meters,
  })
}
