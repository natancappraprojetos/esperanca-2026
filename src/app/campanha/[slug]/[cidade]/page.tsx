import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FunnelPage } from '@/components/public/FunnelPage'
import PixelTracker from '@/components/public/PixelTracker'
import { generateSessionToken, parseUTMParams } from '@/lib/utils/whatsapp'
import { cookies } from 'next/headers'

// ISR: revalidate every 5 minutes
export const revalidate = 300

interface CampaignPageProps {
  params: Promise<{ slug: string; cidade?: string }>
  searchParams: Promise<Record<string, string>>
}

export async function generateMetadata({ params }: CampaignPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name, theme, tagline, cover_image_url')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!campaign) return {}

  return {
    title: campaign.name,
    description: campaign.tagline || `Participe da ${campaign.name}`,
    openGraph: {
      title: campaign.name,
      description: campaign.tagline || '',
      images: campaign.cover_image_url ? [campaign.cover_image_url] : [],
    },
  }
}

export default async function CampaignPage({ params, searchParams }: CampaignPageProps) {
  const { slug, cidade } = await params
  const sp = await searchParams
  const supabase = await createClient()

  // Fetch campaign
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!campaign) notFound()

  // Fetch active material for this campaign
  const { data: material } = await supabase
    .from('digital_materials')
    .select('*')
    .eq('campaign_id', campaign.id)
    .eq('status', 'active')
    .order('display_order')
    .limit(1)
    .maybeSingle()

  // If cidade param, pre-load city
  let initialCity = null
  if (cidade) {
    const { data: city } = await supabase
      .from('cities')
      .select('*')
      .eq('slug', cidade)
      .eq('status', 'active')
      .single()
    initialCity = city
  }

  // Session token (could also be stored in cookie for persistence)
  const cookieStore = await cookies()
  const existingToken = cookieStore.get('session_token')?.value
  const sessionToken = existingToken || generateSessionToken()

  // Parse UTMs
  const utmParams = {
    utm_source: sp.utm_source || null,
    utm_medium: sp.utm_medium || null,
    utm_campaign: sp.utm_campaign || null,
    utm_content: sp.utm_content || null,
    utm_term: sp.utm_term || null,
  }

  let pixelId = null
  if (initialCity) {
    const { data: pixelData } = await supabase
      .from('tracking_pixels')
      .select('pixel_id')
      .eq('city_id', initialCity.id)
      .eq('scope', 'city')
      .eq('is_active', true)
      .single()
    if (pixelData) pixelId = pixelData.pixel_id
  }

  return (
    <>
      {pixelId && <PixelTracker pixelId={pixelId} />}
      <FunnelPage
        campaign={campaign}
        material={material}
        initialCity={initialCity}
        utmParams={utmParams}
        sessionToken={sessionToken}
      />
    </>
  )
}
