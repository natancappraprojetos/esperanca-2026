import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { formatWhatsappDisplay } from '@/lib/utils/whatsapp'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'xlsx'
  
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Build query with permissions
  let query = supabase
    .from('leads')
    .select(`
      id, created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term, device_type,
      contacts (full_name, whatsapp),
      churches (name),
      cities (name),
      neighborhoods (name),
      campaigns (name),
      lead_consents (consent_reminder_whatsapp, consent_data_at)
    `)
    .order('created_at', { ascending: false })
    .limit(5000) // Max export size

  // Role restriction
  if (profile?.role === 'church_admin') {
    const { data: pastor } = await supabase
      .from('pastors')
      .select('church_id')
      .eq('user_id', user.id)
      .single()
    if (pastor?.church_id) {
      query = query.eq('church_id', pastor.church_id)
    }
  }

  // Apply filters from query params
  if (searchParams.get('church')) query = query.eq('church_id', searchParams.get('church')!)
  if (searchParams.get('city')) query = query.eq('city_id', searchParams.get('city')!)
  if (searchParams.get('campaign')) query = query.eq('campaign_id', searchParams.get('campaign')!)

  const { data: leads, error } = await query

  if (error || !leads) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }

  // Prepare rows
  const rows = leads.map((lead: any) => ({
    'Nome': lead.contacts?.full_name || '',
    'WhatsApp': lead.contacts?.whatsapp ? formatWhatsappDisplay(lead.contacts.whatsapp) : '',
    'Igreja': lead.churches?.name || '',
    'Cidade': lead.cities?.name || '',
    'Bairro': lead.neighborhoods?.name || '',
    'Campanha': lead.campaigns?.name || '',
    'Lembrete WhatsApp': lead.lead_consents?.[0]?.consent_reminder_whatsapp ? 'Sim' : 'Não',
    'Origem (UTM Source)': lead.utm_source || '',
    'Mídia (UTM Medium)': lead.utm_medium || '',
    'Campanha UTM': lead.utm_campaign || '',
    'Conteúdo UTM': lead.utm_content || '',
    'Dispositivo': lead.device_type || '',
    'Data': new Date(lead.created_at).toLocaleDateString('pt-BR'),
    'Hora': new Date(lead.created_at).toLocaleTimeString('pt-BR'),
  }))

  if (format === 'csv') {
    // CSV export
    const ws = XLSX.utils.json_to_sheet(rows)
    const csv = XLSX.utils.sheet_to_csv(ws)
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  }

  // XLSX export
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  
  // Column widths
  ws['!cols'] = [
    { wch: 30 }, // Nome
    { wch: 18 }, // WhatsApp
    { wch: 40 }, // Igreja
    { wch: 20 }, // Cidade
    { wch: 25 }, // Bairro
    { wch: 30 }, // Campanha
    { wch: 20 }, // Lembrete
    { wch: 20 }, // UTM Source
    { wch: 20 }, // UTM Medium
    { wch: 25 }, // UTM Campaign
    { wch: 20 }, // UTM Content
    { wch: 15 }, // Dispositivo
    { wch: 12 }, // Data
    { wch: 10 }, // Hora
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Leads')
  
  // Summary sheet
  const summaryData = [
    { 'Informação': 'Total de Leads', 'Valor': leads.length },
    { 'Informação': 'Exportado em', 'Valor': new Date().toLocaleString('pt-BR') },
    { 'Informação': 'Exportado por', 'Valor': user.email || '' },
    { 'Informação': 'Lembretes WhatsApp', 'Valor': leads.filter((l: any) => l.lead_consents?.[0]?.consent_reminder_whatsapp).length },
  ]
  const wsSummary = XLSX.utils.json_to_sheet(summaryData)
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumo')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}
