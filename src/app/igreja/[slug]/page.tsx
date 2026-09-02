import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FunnelPage } from '@/components/public/FunnelPage'
import { generateSessionToken } from '@/lib/utils/whatsapp'

export const revalidate = 300

interface ChurchPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string>>
}

export async function generateMetadata({ params }: ChurchPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: church } = await supabase
    .from('churches')
    .select('name, address_neighborhood')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!church) return {}

  return {
    title: `${church.name} — Semana da Esperança 2026`,
    description: `Venha participar da Semana da Esperança na ${church.name}${church.address_neighborhood ? ` — ${church.address_neighborhood}` : ''}.`,
  }
}

export default async function ChurchPage({ params, searchParams }: ChurchPageProps) {
  const { slug } = await params
  const sp = await searchParams
  const supabase = await createClient()

  // Fetch church with all details
  const { data: church } = await supabase
    .from('churches')
    .select(`
      *,
      pastors (id, full_name, photo_url),
      cities (*)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!church) notFound()

  // Find the active campaign for this church
  const { data: campaignChurch } = await supabase
    .from('campaign_churches')
    .select(`
      campaigns (*)
    `)
    .eq('church_id', church.id)
    .limit(1)
    .maybeSingle()

  const campaign = (campaignChurch?.campaigns as any) || null

  if (!campaign) {
    // No active campaign — show a simple page
    return (
      <div className="min-h-svh flex flex-col items-center justify-center container-narrow text-center py-16">
        <h1 className="text-heading-2" style={{ color: 'var(--gray-900)' }}>
          {church.name}
        </h1>
        <p className="text-body" style={{ color: 'var(--gray-500)' }}>
          Nenhuma campanha ativa no momento.
        </p>
      </div>
    )
  }

  // Fetch material
  const { data: material } = await supabase
    .from('digital_materials')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('status', 'active')
    .order('display_order')
    .limit(1)
    .maybeSingle()

  const sessionToken = generateSessionToken()
  const utmParams = {
    utm_source: sp.utm_source || null,
    utm_medium: sp.utm_medium || null,
    utm_campaign: sp.utm_campaign || null,
    utm_content: sp.utm_content || null,
    utm_term: sp.utm_term || null,
  }

  return (
    <FunnelPage
      campaign={campaign}
      material={material}
      initialCity={church.cities as any}
      initialChurch={church}
      utmParams={utmParams}
      sessionToken={sessionToken}
    />
  )
}
