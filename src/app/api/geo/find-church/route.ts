import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const neighborhoodId = searchParams.get('neighborhood_id')
  const cityId = searchParams.get('city_id')
  const campaignId = searchParams.get('campaign_id')

  if (!neighborhoodId && !cityId) {
    return NextResponse.json({ error: 'neighborhood_id or city_id required' }, { status: 400 })
  }

  const supabase = await createClient()
  let result: any = null

  // Check if it's a valid UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(neighborhoodId || '')

  if (neighborhoodId && isUuid) {
    // Use the PostGIS-powered RPC function with priority logic
    const { data, error } = await supabase.rpc('find_church_for_neighborhood', {
      p_neighborhood_id: neighborhoodId,
      p_campaign_id: campaignId || null,
    })
    
    if (!error && data?.length) {
      result = data[0]
    }
  }

  // Fallback to city_id if neighborhood was custom or RPC failed
  if (!result && cityId) {
    const { data: fallbackChurches } = await supabase
      .from('churches')
      .select('id, name')
      .eq('city_id', cityId)
      .eq('status', 'active')
      .limit(1)

    if (fallbackChurches && fallbackChurches.length > 0) {
      result = {
        church_id: fallbackChurches[0].id,
        assignment_method: 'fallback_city',
        distance_meters: null,
      }
    }
  }

  if (!result) {
    return NextResponse.json({ church: null, method: 'not_found' })
  }

  // Fetch full church data
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

  return NextResponse.json({ 
    church, 
    method: result.assignment_method,
    distance_meters: result.distance_meters,
  })
}
