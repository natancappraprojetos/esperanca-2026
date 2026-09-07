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
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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
      pastors!pastors_church_id_fkey (id, full_name, photo_url),
      cities (*)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!church) notFound()

  // Find the active campaign directly
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

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

  // Fetch specific church pixels
  const { data: churchPixels } = await supabase
    .from('tracking_pixels')
    .select('*')
    .eq('church_id', church.id)
    .eq('scope', 'church')

  // Fetch global pixels
  const { data: globalPixels } = await supabase
    .from('tracking_pixels')
    .select('*')
    .eq('scope', 'global')
    .eq('is_active', true)

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
      globalPixels={globalPixels || []}
      churchPixels={churchPixels || []}
    />
  )
}
