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

  // campaign_id filter removed so global search works
  const { data: cities, error } = await query

  if (error) {
    console.error('City search error:', error)
    return NextResponse.json({ cities: [], error: 'Search failed' }, { status: 500 })
  }

  return NextResponse.json({ cities: cities || [] })
}
