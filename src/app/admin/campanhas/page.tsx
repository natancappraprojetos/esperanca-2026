import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CampaignsClient from '@/components/admin/CampaignsClient'

export const metadata: Metadata = { title: 'Campanhas | Admin' }

export default async function CampaignsPage() {
  const supabase = await createClient()

  const { data: campaigns } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_churches (count),
      campaign_cities (count),
      leads (count)
    `)
    .order('starts_at', { ascending: false })

  return <CampaignsClient campaigns={campaigns || []} />
}
