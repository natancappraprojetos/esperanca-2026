import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const userAgent = headersList.get('user-agent') || undefined

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false })
  }

  const { 
    event_name, 
    session_token, 
    lead_id, 
    campaign_id,
    city_id,
    church_id,
    neighborhood_id,
    utm_source,
    utm_medium,
    utm_campaign,
    ...rest 
  } = body as any

  if (!event_name) {
    return NextResponse.json({ ok: false })
  }

  const supabase = await createAdminClient()

  try {
    await supabase.from('funnel_events').insert({
      session_token: session_token || null,
      lead_id: lead_id || null,
      campaign_id: campaign_id || null,
      city_id: city_id || null,
      church_id: church_id || null,
      neighborhood_id: neighborhood_id || null,
      event_name,
      event_properties: rest,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      ip_address: ip !== 'unknown' ? ip : null,
      user_agent: userAgent || null,
      device_type: getDeviceType(userAgent),
    })
  } catch { /* fire and forget */ }

  return NextResponse.json({ ok: true })
}

function getDeviceType(ua?: string) {
  if (!ua) return 'unknown'
  const lower = ua.toLowerCase()
  if (/mobile|android|iphone/.test(lower)) return 'mobile'
  if (/tablet|ipad/.test(lower)) return 'tablet'
  return 'desktop'
}
