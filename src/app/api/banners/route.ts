import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const churchId = searchParams.get('church_id')
  const campaignId = searchParams.get('campaign_id')
  const limit = parseInt(searchParams.get('limit') || '3')

  if (!churchId && !campaignId) {
    return NextResponse.json({ banner: null })
  }

  const supabase = await createClient()

  let query = supabase
    .from('banners')
    .select('*')
    .eq('status', 'active')
    .order('display_order')
    .limit(limit)

  if (churchId) {
    query = query.eq('church_id', churchId)
  } else if (campaignId) {
    query = query.eq('campaign_id', campaignId)
  }

  const { data: banners } = await query

  return NextResponse.json({ 
    banner: banners?.[0] || null,
    banners: banners || [],
  })
}
