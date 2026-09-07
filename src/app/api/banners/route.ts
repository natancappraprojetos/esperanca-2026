import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const churchId = searchParams.get('church_id')
  const campaignId = searchParams.get('campaign_id')
  const limit = parseInt(searchParams.get('limit') || '3')

  if (!churchId && !campaignId) {
    return NextResponse.json({ banner: null, banners: [] })
  }

  const supabase = await createClient()

  // First, try to find banners for this specific church (any campaign)
  // This ensures banners uploaded for any campaign are found
  let banners: any[] = []

  if (churchId) {
    // Try with specific campaign first
    if (campaignId) {
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('church_id', churchId)
        .eq('campaign_id', campaignId)
        .eq('status', 'active')
        .order('display_order')
        .limit(limit)
      if (data && data.length > 0) banners = data
    }

    // If no banners found for specific campaign, try any campaign for this church
    if (banners.length === 0) {
      const { data } = await supabase
        .from('banners')
        .select('*')
        .eq('church_id', churchId)
        .eq('status', 'active')
        .order('display_order')
        .limit(limit)
      if (data && data.length > 0) banners = data
    }
  } else if (campaignId) {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
      .order('display_order')
      .limit(limit)
    if (data && data.length > 0) banners = data
  }

  const bannerToReturn = banners.length > 0 ? banners[0] : null

  return NextResponse.json({ 
    banner: bannerToReturn,
    banners,
  })
}
