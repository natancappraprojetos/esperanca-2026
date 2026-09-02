import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ReportsClient from '@/components/admin/ReportsClient'
import { subDays, format } from 'date-fns'

export const metadata: Metadata = { title: 'Relatórios | Admin' }

export default async function ReportsPage() {
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

  // 1. Leads Over Time (Last 30 days)
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
  if (myChurchId) {
    eventsQuery = eventsQuery.eq('church_id', myChurchId)
  }
  
  const { data: events } = await eventsQuery
  const eventCounts = (events || []).reduce((acc: any, event) => {
    acc[event.event_name] = (acc[event.event_name] || 0) + 1
    return acc
  }, {})

  // 3. Top Churches (Only for super_admin/admin)
  let topChurchesData: any[] = []
  if (!isChurchAdmin) {
    const { data: churchesLeads } = await supabase
      .from('leads')
      .select('church_id, churches(name)')
      
    const churchCounts = (churchesLeads || []).reduce((acc: any, item) => {
      const name = item.churches?.name || 'Desconhecida'
      acc[name] = (acc[name] || 0) + 1
      return acc
    }, {})

    topChurchesData = Object.entries(churchCounts)
      .map(([name, leads]) => ({ name, leads }))
      .sort((a: any, b: any) => b.leads - a.leads)
      .slice(0, 5)
  }

  return (
    <ReportsClient 
      leadsChartData={leadsChartData}
      eventCounts={eventCounts}
      topChurchesData={topChurchesData}
      isChurchAdmin={isChurchAdmin}
    />
  )
}
