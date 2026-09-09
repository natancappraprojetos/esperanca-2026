import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get('city_id')
  const campaignId = searchParams.get('campaign_id')

  if (!cityId) {
    return NextResponse.json({ churches: [] })
  }

  const supabase = await createClient()

  let query = supabase
    .from('churches')
    .select('id, name, slug, address_street, address_neighborhood, city_id, latitude, longitude')
    .eq('city_id', cityId)
    .eq('status', 'active')
    .order('name')

  if (campaignId) {
    // If a campaign is provided, we should ideally only return churches that belong to this campaign
    const { data: campaignChurches } = await supabase
      .from('campaign_churches')
      .select('church_id')
      .eq('campaign_id', campaignId)
    
    if (campaignChurches && campaignChurches.length > 0) {
      query = query.in('id', campaignChurches.map(c => c.church_id))
    } else {
      // If no churches in this campaign for this city, return empty
      return NextResponse.json({ churches: [] })
    }
  }

  const { data: churches, error } = await query

  if (error) {
    console.error('Error fetching churches by city:', error)
    return NextResponse.json({ churches: [] })
  }

  return NextResponse.json({ churches: churches || [] })
}
