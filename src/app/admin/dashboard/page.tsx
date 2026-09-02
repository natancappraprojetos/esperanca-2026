import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from '@/components/admin/DashboardClient'

export const metadata: Metadata = {
  title: 'Dashboard | Admin',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

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

  const { count: totalLeads } = await leadsQuery

  // Today's leads
  const { count: todayLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', today)

  // Last 7 days
  const { count: weekLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekAgo)

  // Month leads
  const { count: monthLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', monthStart)

  // Total downloads
  const { count: totalDownloads } = await supabase
    .from('material_downloads')
    .select('id', { count: 'exact', head: true })

  // Total opt-ins for reminders
  const { count: totalReminders } = await supabase
    .from('lead_consents')
    .select('id', { count: 'exact', head: true })
    .eq('consent_reminder_whatsapp', true)

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
  const { data: recentLeads } = await supabase
    .from('leads')
    .select(`
      id, created_at, utm_source, device_type,
      contacts (full_name, whatsapp),
      churches (name),
      cities (name),
      neighborhoods (name),
      lead_consents (consent_reminder_whatsapp)
    `)
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
    />
  )
}
