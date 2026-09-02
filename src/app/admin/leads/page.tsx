import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import LeadsClient from '@/components/admin/LeadsClient'

export const metadata: Metadata = { title: 'Leads | Admin' }

interface LeadsPageProps {
  searchParams: Promise<{
    page?: string
    church?: string
    city?: string
    reminder?: string
    q?: string
    campaign?: string
  }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const sp = await searchParams
  const page = parseInt(sp.page || '1')
  const limit = 25
  const offset = (page - 1) * limit

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  // Build query
  let query = supabase
    .from('leads')
    .select(`
      id, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      device_type, church_assignment_method, status,
      contacts (id, full_name, whatsapp, whatsapp_raw),
      churches (id, name),
      cities (id, name),
      neighborhoods (id, name),
      campaigns (id, name),
      lead_consents (consent_data, consent_reminder_whatsapp, consent_data_at)
    `, { count: 'exact' })

  // Role filtering — church_admin sees only their leads
  if (profile?.role === 'church_admin') {
    const { data: pastor } = await supabase
      .from('pastors')
      .select('church_id')
      .eq('user_id', user!.id)
      .single()
    if (pastor?.church_id) {
      query = query.eq('church_id', pastor.church_id)
    }
  }

  // Filter params
  if (sp.church) query = query.eq('church_id', sp.church)
  if (sp.city) query = query.eq('city_id', sp.city)
  if (sp.campaign) query = query.eq('campaign_id', sp.campaign)
  if (sp.reminder === 'true') {
    // Filter by reminder via consent — use a different approach
    const { data: consentLeadIds } = await supabase
      .from('lead_consents')
      .select('lead_id')
      .eq('consent_reminder_whatsapp', true)
    if (consentLeadIds) {
      query = query.in('id', consentLeadIds.map(c => c.lead_id))
    }
  }

  const { data: leads, count, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Fetch filter options
  const { data: churches } = await supabase
    .from('churches')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  const { data: cities } = await supabase
    .from('cities')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('id, name')
    .order('created_at', { ascending: false })

  return (
    <LeadsClient
      leads={leads || []}
      total={count || 0}
      page={page}
      limit={limit}
      profile={profile!}
      filters={{ church: sp.church, city: sp.city, campaign: sp.campaign, reminder: sp.reminder }}
      filterOptions={{ churches: churches || [], cities: cities || [], campaigns: campaigns || [] }}
    />
  )
}
