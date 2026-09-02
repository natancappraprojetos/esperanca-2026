import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { FunnelPage } from '@/components/public/FunnelPage'
import { generateSessionToken } from '@/lib/utils/whatsapp'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Semana da Esperança 2026 | Jesus, Nossa Esperança',
  description: 'Uma semana para reencontrar a esperança. Encontre uma igreja perto de você e participe da Semana da Esperança 2026.',
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const supabase = await createClient()

  // Fetch the default active campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .order('starts_at', { ascending: false })
    .limit(1)
    .single()

  if (!campaign) {
    return (
      <div 
        className="min-h-svh flex flex-col items-center justify-center"
        style={{ background: 'var(--cream)' }}
      >
        <div className="container-narrow text-center py-16">
          <h1 
            className="text-heading-1"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-900)' }}
          >
            Em breve
          </h1>
          <p className="text-body mt-4" style={{ color: 'var(--gray-500)' }}>
            Uma campanha especial está se preparando.
          </p>
        </div>
      </div>
    )
  }

  // Fetch active material
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
      utmParams={utmParams}
      sessionToken={sessionToken}
    />
  )
}
