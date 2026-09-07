import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// GET /api/geo/find-church
//
// Determina a igreja mais proxima do usuario com base em:
//   1. Coordenadas do bairro (se esta no banco com lat/lon)
//   2. Geocodificacao via Nominatim do texto do bairro + cidade
//      (com fallback para centroide da cidade se bairro nao encontrado)
//   3. Fallback: qualquer igreja ativa na cidade
//
// ALGORITMO GENERICO - sem logica especifica por cidade.
// Usa PostGIS (find_nearest_church_for_point) para calculo real de distancia.
// ============================================================

async function geocodeNeighborhood(
  neighborhoodText: string,
  cityName: string,
  stateUf: string
): Promise<{ latitude: number; longitude: number } | null> {
  const queries = [
    `${neighborhoodText}, ${cityName}, ${stateUf}, Brasil`,
    `${cityName}, ${stateUf}, Brasil`,
  ]

  for (const q of queries) {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', q)
    url.searchParams.set('format', 'json')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'br')

    try {
      const res = await fetch(url.toString(), {
        headers: {
          'User-Agent': 'EvangelismoApp/1.0 (church-routing-system)',
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
        next: { revalidate: 3600 },
      })
      if (!res.ok) continue
      const data = await res.json()
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        }
      }
    } catch {
      continue
    }
  }
  return null
}

function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

async function findNearestChurch(
  supabase: ReturnType<typeof createClient> extends Promise<infer T> ? T : never,
  cityId: string,
  latitude: number,
  longitude: number,
  campaignId: string | null
): Promise<any | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any).rpc('find_nearest_church_for_point', {
    p_city_id: cityId,
    p_longitude: longitude,
    p_latitude: latitude,
    p_campaign_id: campaignId || null,
  })
  return data && Array.isArray(data) && data.length > 0 ? data[0] : null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const neighborhoodId   = searchParams.get('neighborhood_id')
  const cityId           = searchParams.get('city_id')
  const campaignId       = searchParams.get('campaign_id')
  const neighborhoodText = searchParams.get('neighborhood_text')

  if (!cityId) {
    return NextResponse.json({ error: 'city_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let result: any = null

  // ============================================================
  // ESTRATEGIA 1: Bairro cadastrado no banco com coordenadas
  // Usa as coordenadas do bairro -> find_nearest_church_for_point
  // ============================================================
  if (neighborhoodId && isValidUUID(neighborhoodId)) {
    const { data: neighborhood } = await supabase
      .from('neighborhoods')
      .select('id, name, latitude, longitude')
      .eq('id', neighborhoodId)
      .single()

    if (neighborhood?.latitude && neighborhood?.longitude) {
      const nearest = await findNearestChurch(
        supabase, cityId,
        neighborhood.latitude, neighborhood.longitude,
        campaignId
      )
      if (nearest) result = nearest
    }
  }

  // ============================================================
  // ESTRATEGIA 2: Geocodificar texto via Nominatim
  // Tenta bairro+cidade; se falhar, usa centroide da cidade
  // Assim SEMPRE encontra alguma coordenada para calcular distancia
  // ============================================================
  if (!result && cityId) {
    const { data: cityData } = await supabase
      .from('cities')
      .select('id, name, states(uf)')
      .eq('id', cityId)
      .single()

    if (cityData) {
      const stateUf = (cityData.states as { uf: string } | null)?.uf || 'RS'
      const searchText = neighborhoodText || cityData.name
      const coords = await geocodeNeighborhood(searchText, cityData.name, stateUf)

      if (coords) {
        const nearest = await findNearestChurch(
          supabase, cityId,
          coords.latitude, coords.longitude,
          campaignId
        )
        if (nearest) result = nearest
      }
    }
  }

  // ============================================================
  // ESTRATEGIA 3: Fallback - qualquer igreja ativa na cidade
  // Ordena pelo nome para resultado estavel, prefere igrejas com coords
  // ============================================================
  if (!result) {
    const { data: cityChurches } = await supabase
      .from('churches')
      .select('id, name, latitude, longitude')
      .eq('city_id', cityId)
      .eq('status', 'active')
      .order('name')

    if (cityChurches && cityChurches.length > 0) {
      const withCoords = cityChurches.filter((c: { latitude: number | null; longitude: number | null }) => c.latitude && c.longitude)
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

  // Busca pixels especificos da igreja
  const { data: trackingPixels } = await supabase
    .from('tracking_pixels')
    .select('pixel_type, pixel_id, config')
    .eq('scope', 'church')
    .eq('church_id', result.church_id)
    .eq('is_active', true)

  return NextResponse.json({
    church,
    pixels: trackingPixels || [],
    method: result.assignment_method || 'proximity',
    distance_meters: result.distance_meters,
  })
}
