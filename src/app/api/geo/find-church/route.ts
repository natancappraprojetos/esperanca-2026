import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const neighborhoodId = searchParams.get('neighborhood_id')
  const campaignId = searchParams.get('campaign_id')

  if (!neighborhoodId) {
    return NextResponse.json({ error: 'neighborhood_id required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Use the PostGIS-powered RPC function with priority logic
  const { data, error } = await supabase.rpc('find_church_for_neighborhood', {
    p_neighborhood_id: neighborhoodId,
    p_campaign_id: campaignId || null,
  })

  if (error || !data?.length) {
    return NextResponse.json({ church: null, method: 'not_found' })
  }

  const result = data[0]

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
