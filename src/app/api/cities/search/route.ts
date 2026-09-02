import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() || ''
  const campaignId = searchParams.get('campaign_id')

  if (q.length < 2) {
    return NextResponse.json({ cities: [] })
  }

  const supabase = await createClient()

  let query = supabase
    .from('cities')
    .select('id, name, slug, state_id, latitude, longitude')
    .eq('status', 'active')
    .ilike('name', `%${q}%`)
    .order('name')
    .limit(8)

  // If campaign_id provided, only return cities linked to this campaign
  if (campaignId) {
    const { data: campaignCities } = await supabase
      .from('campaign_cities')
      .select('city_id')
      .eq('campaign_id', campaignId)

    const cityIds = campaignCities?.map(c => c.city_id) || []
    if (cityIds.length > 0) {
      query = query.in('id', cityIds)
    }
  }

  const { data: cities, error } = await query

  if (error) {
    console.error('City search error:', error)
    return NextResponse.json({ cities: [], error: 'Search failed' }, { status: 500 })
  }

  return NextResponse.json({ cities: cities || [] })
}
