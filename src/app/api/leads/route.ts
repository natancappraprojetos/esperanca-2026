import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { normalizeWhatsapp, detectDeviceType } from '@/lib/utils/whatsapp'
import { z } from 'zod'

const leadSchema = z.object({
  name: z.string().min(2).max(100),
  whatsapp: z.string().min(10).max(15),
  whatsapp_raw: z.string().optional(),
  campaign_id: z.string().uuid(),
  church_id: z.string().uuid().optional().nullable(),
  city_id: z.string().uuid().optional().nullable(),
  neighborhood_id: z.string().uuid().optional().nullable(),
  material_id: z.string().uuid().optional().nullable(),
  church_assignment_method: z.string().optional().nullable(),
  consent_data: z.boolean(),
  consent_reminder_whatsapp: z.boolean().default(false),
  utm_source: z.string().optional().nullable(),
  utm_medium: z.string().optional().nullable(),
  utm_campaign: z.string().optional().nullable(),
  utm_content: z.string().optional().nullable(),
  utm_term: z.string().optional().nullable(),
  session_token: z.string().optional().nullable(),
})

// Simple in-memory rate limiting (use Upstash Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 5

  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= maxRequests) return false
  entry.count++
  return true
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Aguarde alguns minutos.' },
      { status: 429 }
    )
  }

  // Validate input
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = leadSchema.safeParse(body)
  if (!parsed.success) {
    const issues = parsed.error?.issues || parsed.error?.errors || []
    const errorMessages = issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    return NextResponse.json(
      { error: `Dados inválidos: ${errorMessages}`, details: issues },
      { status: 400 }
    )
  }

  const data = parsed.data
  
  // Must have data consent
  if (!data.consent_data) {
    return NextResponse.json(
      { error: 'Consentimento obrigatório' },
      { status: 400 }
    )
  }

  try {
    const supabase = await createAdminClient()
    const userAgent = headersList.get('user-agent') || undefined
    const deviceType = detectDeviceType(userAgent)
    const normalizedWa = normalizeWhatsapp(data.whatsapp)

    // 1. Upsert contact (deduplication by normalized WhatsApp)
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .upsert(
        {
          whatsapp: normalizedWa,
          whatsapp_raw: data.whatsapp_raw || data.whatsapp,
          full_name: data.name,
        },
        { onConflict: 'whatsapp', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (contactError || !contact) {
      console.error('Contact upsert error:', contactError)
      return NextResponse.json({ error: `Erro ao salvar contato: ${contactError?.message}` }, { status: 500 })
    }

    // 2. Create or update lead (unique per contact + campaign)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .upsert(
        {
          contact_id: contact.id,
          campaign_id: data.campaign_id,
          church_id: data.church_id || null,
          city_id: data.city_id || null,
          neighborhood_id: data.neighborhood_id || null,
          material_id: data.material_id || null,
          church_assignment_method: data.church_assignment_method || null,
          ip_address: ip !== 'unknown' ? ip : null,
          user_agent: userAgent || null,
          device_type: deviceType,
          utm_source: data.utm_source || null,
          utm_medium: data.utm_medium || null,
          utm_campaign: data.utm_campaign || null,
          utm_content: data.utm_content || null,
          utm_term: data.utm_term || null,
          landing_page: request.headers.get('referer') || null,
          status: 'active',
        },
        { onConflict: 'contact_id,campaign_id', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (leadError || !lead) {
      console.error('Lead upsert error:', leadError)
      return NextResponse.json({ error: `Erro ao registrar lead: ${leadError?.message}` }, { status: 500 })
    }

    // 3. Register LGPD consents
    const now = new Date().toISOString()
    await supabase
      .from('lead_consents')
      .upsert(
        {
          lead_id: lead.id,
          contact_id: contact.id,
          consent_data: data.consent_data,
          consent_data_at: data.consent_data ? now : null,
          policy_version: '1.0',
          consent_reminder_whatsapp: data.consent_reminder_whatsapp,
          consent_reminder_at: data.consent_reminder_whatsapp ? now : null,
          consent_ip: ip !== 'unknown' ? ip : null,
          consent_user_agent: userAgent || null,
        },
        { onConflict: 'lead_id', ignoreDuplicates: false }
      )

    // 4. Log download if material_id provided
    if (data.material_id) {
      await supabase.from('material_downloads').insert({
        material_id: data.material_id,
        lead_id: lead.id,
        campaign_id: data.campaign_id,
        church_id: data.church_id || null,
        city_id: data.city_id || null,
        session_token: data.session_token || null,
        ip_address: ip !== 'unknown' ? ip : null,
        user_agent: userAgent || null,
        device_type: deviceType,
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_content: data.utm_content || null,
        utm_term: data.utm_term || null,
      })
    }

    // 5. Log funnel event
    await supabase.from('funnel_events').insert({
      session_token: data.session_token || null,
      lead_id: lead.id,
      campaign_id: data.campaign_id,
      city_id: data.city_id || null,
      church_id: data.church_id || null,
      neighborhood_id: data.neighborhood_id || null,
      event_name: 'LeadCompleted',
      event_properties: {
        has_reminder: data.consent_reminder_whatsapp,
        has_material: !!data.material_id,
        assignment_method: data.church_assignment_method,
      },
      utm_source: data.utm_source || null,
      utm_medium: data.utm_medium || null,
      utm_campaign: data.utm_campaign || null,
      ip_address: ip !== 'unknown' ? ip : null,
      user_agent: userAgent || null,
      device_type: deviceType,
    })

    return NextResponse.json({ 
      success: true,
      leadId: lead.id,
      contactId: contact.id,
    })
  } catch (err) {
    console.error('Lead creation error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro interno. Tente novamente em alguns instantes.' },
      { status: 500 }
    )
  }
}
