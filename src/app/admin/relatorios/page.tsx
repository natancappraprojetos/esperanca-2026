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

  // Determine start date from period
  const period = sp.period || '30d'
  let startDate = ''
  const now = new Date()
  
  if (period === 'today') {
    startDate = format(now, 'yyyy-MM-dd') + 'T00:00:00.000Z'
  } else if (period === 'yesterday') {
    startDate = format(subDays(now, 1), 'yyyy-MM-dd') + 'T00:00:00.000Z'
  } else if (period === '7d') {
    startDate = subDays(now, 7).toISOString()
  } else if (period === '30d') {
    startDate = subDays(now, 30).toISOString()
  }

  // 1. Leads Over Time (Last 30 days) - Keep this chart fixed to 30 days for visual consistency
  const thirtyDaysAgo = subDays(new Date(), 30).toISOString()
  let leadsQuery = supabase
    .from('leads')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo)

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
  // We approximate the funnel by checking total events vs leads
  let eventsQuery = supabase.from('funnel_events').select('event_name')
  if (startDate && period !== 'all') {
    if (period === 'yesterday') {
      const endOfYesterday = format(subDays(now, 1), 'yyyy-MM-dd') + 'T23:59:59.999Z'
      eventsQuery = eventsQuery.gte('created_at', startDate).lte('created_at', endOfYesterday)
    } else {
      eventsQuery = eventsQuery.gte('created_at', startDate)
    }
  }
  if (myChurchId) {
    eventsQuery = eventsQuery.eq('church_id', myChurchId)
  }
  
  const { data: events } = await eventsQuery
  const eventCounts = (events || []).reduce((acc: any, event) => {
    acc[event.event_name] = (acc[event.event_name] || 0) + 1
    return acc
  }, {})

  // 3. Churches (Only for super_admin/admin)
  let allChurchesData: any[] = []
  if (!isChurchAdmin) {
    let churchesLeadsQuery = supabase.from('leads').select('church_id, churches(name)')
    
    if (startDate && period !== 'all') {
      if (period === 'yesterday') {
        const endOfYesterday = format(subDays(now, 1), 'yyyy-MM-dd') + 'T23:59:59.999Z'
        churchesLeadsQuery = churchesLeadsQuery.gte('created_at', startDate).lte('created_at', endOfYesterday)
      } else {
        churchesLeadsQuery = churchesLeadsQuery.gte('created_at', startDate)
      }
    }

    const { data: churchesLeads } = await churchesLeadsQuery
      
    const churchCounts = (churchesLeads || []).reduce((acc: any, item) => {
      const name = item.churches?.name || 'Desconhecida'
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})

    allChurchesData = Object.entries(churchCounts)
      .map(([name, leads]) => ({ name, leads }))
      .sort((a: any, b: any) => b.leads - a.leads)
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
