import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get('city_id')
  const q = searchParams.get('q')?.trim() || ''
  const suggest = searchParams.get('suggest') === '1'
  const limit = Math.min(parseInt(searchParams.get('limit') || '8'), 20)

  if (!cityId) {
    return NextResponse.json({ results: [], error: 'city_id required' }, { status: 400 })
  }

  if (q.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = await createClient()

  // Use the pg_trgm-powered RPC function
  const { data, error } = await supabase.rpc('search_neighborhoods', {
    p_city_id: cityId,
    p_query: q,
    p_limit: suggest ? limit + 5 : limit,
    p_threshold: suggest ? 0.05 : 0.1,
  })

  if (error) {
    console.error('Neighborhood search error:', error)
    // Fallback: simple ILIKE search
    const { data: fallback } = await supabase
      .from('neighborhoods')
      .select('id, name, name_normalized, latitude, longitude')
      .eq('city_id', cityId)
      .eq('status', 'active')
      .ilike('name', `%${q}%`)
      .limit(limit)

    const results = (fallback || []).map(n => ({
      neighborhood: n,
      score: 0.5,
    }))
    return NextResponse.json({ results })
  }

  const results = (data || []).map((item: {
    id: string
    name: string
    name_normalized: string
    score: number
    latitude: number | null
    longitude: number | null
  }) => ({
    neighborhood: {
      id: item.id,
      name: item.name,
      name_normalized: item.name_normalized,
      latitude: item.latitude,
      longitude: item.longitude,
    },
    score: item.score,
  }))

  // For suggestions mode, lower the threshold to catch more typos
  return NextResponse.json({ results })
}
