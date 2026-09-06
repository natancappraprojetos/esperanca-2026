import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ============================================================
// POST /api/admin/geocode-church
// 
// Geocodifica o endereço de uma igreja e salva lat/lng + PostGIS.
// Usa Nominatim (OpenStreetMap) como primário — gratuito, sem chave.
// Usa Google Geocoding API como fallback se GOOGLE_MAPS_API_KEY estiver configurada.
//
// Genérico: funciona para qualquer cidade, estado ou país.
// ============================================================

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
  importance: number
}

interface GeocodeResult {
  latitude: number
  longitude: number
  formatted_address: string
  provider: 'nominatim' | 'google' | 'viaCEP'
}

// ------------------------------------
// Geocodifica via Nominatim (OSM) — genérico para qualquer endereço
// ------------------------------------
async function geocodeViaNominatim(
  street: string | null,
  number: string | null,
  neighborhood: string | null,
  city: string,
  state_uf: string,
  cep: string | null,
  country = 'Brasil'
): Promise<GeocodeResult | null> {
  
  // Tenta 3 níveis de especificidade:
  // 1. Rua + Número + Bairro + Cidade
  // 2. Rua + Bairro + Cidade (se falhar com número)
  // 3. Bairro + Cidade (se falhar rua)
  const attempts: string[] = []
  
  if (street) {
    if (number) attempts.push(`${street}, ${number}, ${neighborhood ? neighborhood + ', ' : ''}${city}, ${state_uf}, ${country}`)
    attempts.push(`${street}, ${neighborhood ? neighborhood + ', ' : ''}${city}, ${state_uf}, ${country}`)
  }
  if (neighborhood) {
    attempts.push(`${neighborhood}, ${city}, ${state_uf}, ${country}`)
  }
  // Remove duplicatas caso falte algum dado
  const uniqueAttempts = [...new Set(attempts)]

  for (const q of uniqueAttempts) {
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
        next: { revalidate: 0 },
      })

      if (res.ok) {
        const data: NominatimResult[] = await res.json()
        if (data && data.length > 0) {
          const best = data[0]
          return {
            latitude: parseFloat(best.lat),
            longitude: parseFloat(best.lon),
            formatted_address: best.display_name,
            provider: 'nominatim',
          }
        }
      }
    } catch {
      // continua para a próxima tentativa
    }
  }

  // Se todas falharem, retorna null em vez de usar o centro da cidade (o que estragaria o roteamento matemático)
  return null
}

// ------------------------------------
// Geocodifica via Google Maps (fallback se chave configurada)
// ------------------------------------
async function geocodeViaGoogle(
  street: string | null,
  number: string | null,
  neighborhood: string | null,
  city: string,
  state_uf: string,
  cep: string | null
): Promise<GeocodeResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  const parts: string[] = []
  if (street) parts.push(number ? `${street} ${number}` : street)
  if (neighborhood) parts.push(neighborhood)
  parts.push(city)
  parts.push(state_uf)
  if (cep) parts.push(cep)
  parts.push('BR')

  const address = parts.join(', ')
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=pt-BR&region=br`

  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    const data = await res.json()

    if (data.status !== 'OK' || !data.results?.length) return null

    const result = data.results[0]
    const loc = result.geometry.location

    return {
      latitude: loc.lat,
      longitude: loc.lng,
      formatted_address: result.formatted_address,
      provider: 'google',
    }
  } catch {
    return null
  }
}

// ------------------------------------
// Handler principal
// ------------------------------------
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { church_id } = body

  if (!church_id) {
    return NextResponse.json({ error: 'church_id is required' }, { status: 400 })
  }

  // Busca a church com dados de cidade e estado
  const { data: church, error: churchError } = await supabase
    .from('churches')
    .select(`
      id,
      name,
      address_street,
      address_number,
      address_neighborhood,
      address_cep,
      city_id,
      cities (
        id,
        name,
        states (
          id,
          name,
          uf
        )
      )
    `)
    .eq('id', church_id)
    .single()

  if (churchError || !church) {
    return NextResponse.json({ error: 'Church not found' }, { status: 404 })
  }

  const cityData = church.cities as any
  const stateData = cityData?.states as any

  if (!cityData?.name) {
    return NextResponse.json({ error: 'Church has no associated city' }, { status: 422 })
  }

  // Tenta geocodificar — Nominatim primeiro, Google como fallback
  let geocoded: GeocodeResult | null = null

  geocoded = await geocodeViaNominatim(
    church.address_street,
    church.address_number,
    church.address_neighborhood,
    cityData.name,
    stateData?.uf || '',
    church.address_cep
  )

  if (!geocoded) {
    geocoded = await geocodeViaGoogle(
      church.address_street,
      church.address_number,
      church.address_neighborhood,
      cityData.name,
      stateData?.uf || '',
      church.address_cep
    )
  }

  if (!geocoded) {
    // Salva o estado de falha no banco
    // Usamos 'as any' pois as colunas needs_geocode/geocode_status são novas (migration 015)
    await (supabase as any)
      .from('churches')
      .update({
        needs_geocode: false,
        geocode_status: 'failed',
        geocode_provider: null,
      })
      .eq('id', church_id)

    return NextResponse.json(
      { error: 'Could not geocode address', church_id },
      { status: 422 }
    )
  }

  // Salva as coordenadas no banco
  // Usamos 'as any' pois as colunas geocode_* são novas (migration 015)
  const { error: updateError } = await (supabase as any)
    .from('churches')
    .update({
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      needs_geocode: false,
      geocode_status: 'ok',
      geocode_provider: geocoded.provider,
      geocode_formatted_address: geocoded.formatted_address,
      geocoded_at: new Date().toISOString(),
    })
    .eq('id', church_id)

  if (updateError) {
    return NextResponse.json({ error: (updateError as any).message }, { status: 500 })
  }

  // Atualiza a coluna PostGIS location via RPC (já que o SDK não suporta tipos geography diretamente)
  await (supabase as any).rpc('update_church_location', {
    p_church_id: church_id,
    p_longitude: geocoded.longitude,
    p_latitude: geocoded.latitude,
  })

  return NextResponse.json({
    success: true,
    church_id,
    latitude: geocoded.latitude,
    longitude: geocoded.longitude,
    formatted_address: geocoded.formatted_address,
    provider: geocoded.provider,
  })
}

// ------------------------------------
// GET /api/admin/geocode-church?pending=true
// Lista igrejas pendentes de geocodificação
// ------------------------------------
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const pendingOnly = searchParams.get('pending') === 'true'

  let query = supabase
    .from('churches')
    .select(`
      id,
      name,
      geocode_status,
      needs_geocode,
      latitude,
      longitude,
      address_street,
      address_neighborhood,
      address_cep,
      cities ( name, states ( uf ) )
    `)
    .eq('status', 'active')
    .order('name')

  if (pendingOnly) {
    query = (query as any).eq('needs_geocode', true)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ churches: data || [] })
}
