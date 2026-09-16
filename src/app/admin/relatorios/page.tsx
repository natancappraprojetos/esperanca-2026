import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ReportsClient from '@/components/admin/ReportsClient'
import { subDays, format } from 'date-fns'

export const metadata: Metadata = { title: 'Relatórios | Admin' }

export default async function ReportsPage({
  searchParams
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const isChurchAdmin = profile?.role === 'church_admin'

  // If church admin, get their church ID
  let myChurchId = null
  if (isChurchAdmin) {
    const { data: pastor } = await supabase
      .from('pastors')
      .select('church_id')
      .eq('user_id', user!.id)
      .single()
    myChurchId = pastor?.church_id
  }

  // The launch date to ignore test leads before this date
  const LAUNCH_DATE = '2026-09-09T00:00:00-03:00'

  // Determine start date from period
  const period = sp.period || '30d'
  let startDate = ''
  const now = new Date()
  now.setHours(now.getHours() - 3) // Adjust to UTC-3 (Brazil)
  
  if (period === 'today') {
    startDate = format(now, 'yyyy-MM-dd') + 'T00:00:00.000Z'
  } else if (period === 'yesterday') {
    startDate = format(subDays(now, 1), 'yyyy-MM-dd') + 'T00:00:00.000Z'
  } else if (period === '7d') {
    startDate = subDays(now, 7).toISOString()
  } else if (period === '30d') {
    startDate = subDays(now, 30).toISOString()
  }

  const effectiveStartDate = (!startDate || new Date(startDate) < new Date(LAUNCH_DATE)) 
    ? LAUNCH_DATE 
    : startDate

  // 1. Leads Over Time (Last 30 days) - Keep this chart fixed to 30 days for visual consistency
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
  const effectiveThirtyDaysAgo = thirtyDaysAgo > LAUNCH_DATE ? thirtyDaysAgo : LAUNCH_DATE

  let leadsQuery = supabase
    .from('leads')
    .select('created_at')
    .gte('created_at', effectiveThirtyDaysAgo)

  if (myChurchId) {
    leadsQuery = leadsQuery.eq('church_id', myChurchId)
  }

  const { data: rawLeads } = await leadsQuery

  // Group leads by date
  const leadsByDate = (rawLeads || []).reduce((acc: any, lead) => {
    const date = format(new Date(lead.created_at), 'yyyy-MM-dd')
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})

  // Fill in empty days
  const leadsChartData = Array.from({ length: 30 }).map((_, i) => {
    const d = subDays(new Date(), 29 - i)
    const dateStr = format(d, 'yyyy-MM-dd')
    return {
      date: format(d, 'dd/MM'),
      leads: leadsByDate[dateStr] || 0
    }
  })

  // 2. Funnel Conversion Data
  // Fetch exact counts for each event type to bypass the 1000 rows limit
  const fetchEventCount = async (eventName: string) => {
    let q = supabase.from('funnel_events').select('id', { count: 'exact', head: true }).eq('event_name', eventName)
    
    if (period === 'yesterday') {
      const endOfYesterday = format(subDays(now, 1), 'yyyy-MM-dd') + 'T23:59:59.999Z'
      q = q.gte('occurred_at', effectiveStartDate).lte('occurred_at', endOfYesterday)
    } else {
      q = q.gte('occurred_at', effectiveStartDate)
    }

    if (myChurchId) {
      q = q.eq('church_id', myChurchId)
    }
    const { count } = await q
    return count || 0
  }

  // Use actual leads table for 'Leads Gerados' to perfectly match the dashboard
  let actualLeadsCountQuery = supabase.from('leads').select('id', { count: 'exact', head: true })
  if (period === 'yesterday') {
    const endOfYesterday = format(subDays(now, 1), 'yyyy-MM-dd') + 'T23:59:59.999Z'
    actualLeadsCountQuery = actualLeadsCountQuery.gte('created_at', effectiveStartDate).lte('created_at', endOfYesterday)
  } else {
    actualLeadsCountQuery = actualLeadsCountQuery.gte('created_at', effectiveStartDate)
  }
  if (myChurchId) {
    actualLeadsCountQuery = actualLeadsCountQuery.eq('church_id', myChurchId)
  }

  // Fetch PDF downloads from material_downloads to match dashboard accuracy
  let pdfDownloadsQuery = supabase.from('material_downloads').select('id', { count: 'exact', head: true })
  if (period === 'yesterday') {
    const endOfYesterday = format(subDays(now, 1), 'yyyy-MM-dd') + 'T23:59:59.999Z'
    pdfDownloadsQuery = pdfDownloadsQuery.gte('downloaded_at', effectiveStartDate).lte('downloaded_at', endOfYesterday)
  } else {
    pdfDownloadsQuery = pdfDownloadsQuery.gte('downloaded_at', effectiveStartDate)
  }
  if (myChurchId) {
    pdfDownloadsQuery = pdfDownloadsQuery.eq('church_id', myChurchId)
  }

  const [pageViews, actualLeadsRes, bannerDownloads, pdfDownloadsRes] = await Promise.all([
    fetchEventCount('PageView'),
    actualLeadsCountQuery,
    fetchEventCount('InviteSaved'),
    pdfDownloadsQuery
  ])

  const eventCounts = {
    'PageView': pageViews,
    'LeadCompleted': actualLeadsRes.count || 0,
    'InviteSaved': bannerDownloads,
    'DownloadCompleted': pdfDownloadsRes.count || 0
  }

  // 3. Churches (Only for super_admin/admin)
  let allChurchesData: any[] = []
  if (!isChurchAdmin) {
    let churchesLeadsQuery = supabase.from('leads').select('church_id, churches(name)')
    let pageViewsQuery = supabase.from('funnel_events').select('church_id, churches(name)').eq('event_name', 'PageView').not('church_id', 'is', null)
    
    if (period === 'yesterday') {
      const endOfYesterday = format(subDays(now, 1), 'yyyy-MM-dd') + 'T23:59:59.999Z'
      churchesLeadsQuery = churchesLeadsQuery.gte('created_at', effectiveStartDate).lte('created_at', endOfYesterday)
      pageViewsQuery = pageViewsQuery.gte('occurred_at', effectiveStartDate).lte('occurred_at', endOfYesterday)
    } else {
      churchesLeadsQuery = churchesLeadsQuery.gte('created_at', effectiveStartDate)
      pageViewsQuery = pageViewsQuery.gte('occurred_at', effectiveStartDate)
    }

    const [{ data: churchesLeads }, { data: pageViewsData }] = await Promise.all([
      churchesLeadsQuery,
      pageViewsQuery
    ])
      
    // Count leads
    const churchCounts = (churchesLeads || []).reduce((acc: any, item) => {
      const name = item.churches?.name || 'Desconhecida'
      if (!acc[name]) acc[name] = { name, leads: 0, pageViews: 0 }
      acc[name].leads += 1
      return acc
    }, {})

    // Count page views
    ;(pageViewsData || []).reduce((acc: any, item) => {
      const name = item.churches?.name || 'Desconhecida'
      if (!acc[name]) acc[name] = { name, leads: 0, pageViews: 0 }
      acc[name].pageViews += 1
      return acc
    }, churchCounts)

    allChurchesData = Object.values(churchCounts)
      .sort((a: any, b: any) => b.leads - a.leads || b.pageViews - a.pageViews)
  }

  return (
    <ReportsClient 
      leadsChartData={leadsChartData}
      eventCounts={eventCounts}
      allChurchesData={allChurchesData}
      isChurchAdmin={isChurchAdmin}
      period={period}
    />
  )
}
