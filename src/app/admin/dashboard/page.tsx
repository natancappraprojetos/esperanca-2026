import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/admin/DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard | Admin',
}

interface DashboardPageProps {
  searchParams: Promise<{
    campaign?: string
  }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Fetch campaigns for the dropdown
  let campaignsQuery = supabase
    .from('campaigns')
    .select('id, name, status')
    .order('created_at', { ascending: false })

  if (profile?.role === 'admin_general' && profile?.allowed_campaigns) {
    const allowed = Array.isArray(profile.allowed_campaigns) ? profile.allowed_campaigns : []
    if (allowed.length > 0) {
      campaignsQuery = campaignsQuery.in('id', allowed)
    } else {
      // If empty, return nothing
      campaignsQuery = campaignsQuery.eq('id', '00000000-0000-0000-0000-000000000000') 
    }
  }

  const { data: campaigns } = await campaignsQuery

  // Determine selected campaign (default to the active one unless 'all' is passed)
  let selectedCampaignId = sp.campaign
  if (selectedCampaignId === 'all') {
    selectedCampaignId = undefined // 'all' means global view
  } else if (!selectedCampaignId && campaigns && campaigns.length > 0) {
    const activeCampaign = campaigns.find(c => c.status === 'active')
    selectedCampaignId = activeCampaign ? activeCampaign.id : campaigns[0].id
  }

  // Fetch KPI data based on role
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  let leadsQuery = supabase.from('leads').select('id, created_at, church_id, city_id', { count: 'exact' })
  
  // Church admin: only see their church's leads
  if (profile?.role === 'church_admin') {
    const { data: pastor } = await supabase
      .from('pastors')
      .select('church_id')
      .eq('user_id', user!.id)
      .single()
    
    if (pastor?.church_id) {
      leadsQuery = leadsQuery.eq('church_id', pastor.church_id)
    }
  }

  if (selectedCampaignId) {
    leadsQuery = leadsQuery.eq('campaign_id', selectedCampaignId)
  }

  const { count: totalLeads } = await leadsQuery

  // Today's leads
  let todayQuery = supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', today)
  if (selectedCampaignId) todayQuery = todayQuery.eq('campaign_id', selectedCampaignId)
  const { count: todayLeads } = await todayQuery

  // Last 7 days
  let weekQuery = supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo)
  if (selectedCampaignId) weekQuery = weekQuery.eq('campaign_id', selectedCampaignId)
  const { count: weekLeads } = await weekQuery

  // Month leads
  let monthQuery = supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', monthStart)
  if (selectedCampaignId) monthQuery = monthQuery.eq('campaign_id', selectedCampaignId)
  const { count: monthLeads } = await monthQuery

  // Total downloads
  // Downloads don't have campaign_id directly without a join, but let's assume they are global or we don't filter them here since we might need to join digital_materials.
  // Actually, material_downloads has material_id, which belongs to a campaign. But let's leave it as global for now.
  const { count: totalDownloads } = await supabase
    .from('material_downloads')
    .select('id', { count: 'exact', head: true })

  // Total opt-ins for reminders
  let remindersQuery = supabase.from('lead_consents').select('id', { count: 'exact', head: true }).eq('consent_reminder_whatsapp', true)
  // Consents don't have campaign_id directly, they belong to leads. We'd have to join leads.
  // We'll leave it global for simplicity right now unless we want to do a subquery.
  const { count: totalReminders } = await remindersQuery

  // Active churches count (super_admin / admin_general only)
  let totalChurches = 0
  if (profile?.role !== 'church_admin') {
    const { count } = await supabase
      .from('churches')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    totalChurches = count || 0
  }

  // Recent leads (last 10) for table
  let recentLeadsQuery = supabase
    .from('leads')
    .select(`
      id, created_at, utm_source, device_type,
      contacts (full_name, whatsapp),
      churches (name),
      cities (name),
      neighborhoods (name),
      lead_consents (consent_reminder_whatsapp)
    `)
    
  if (selectedCampaignId) {
    recentLeadsQuery = recentLeadsQuery.eq('campaign_id', selectedCampaignId)
  }

  const { data: recentLeads } = await recentLeadsQuery
    .order('created_at', { ascending: false })
    .limit(10)

  const kpis = {
    totalLeads: totalLeads || 0,
    todayLeads: todayLeads || 0,
    weekLeads: weekLeads || 0,
    monthLeads: monthLeads || 0,
    totalDownloads: totalDownloads || 0,
    totalReminders: totalReminders || 0,
    totalChurches,
  }

  return (
    <DashboardClient 
      profile={profile!}
      kpis={kpis}
      recentLeads={recentLeads || []}
      campaigns={campaigns || []}
      selectedCampaignId={selectedCampaignId || (sp.campaign === 'all' ? 'all' : '')}
    />
  )
}
