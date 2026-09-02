import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ChurchesClient from '@/components/admin/ChurchesClient'

export const metadata: Metadata = { title: 'Igrejas | Admin' }

export default async function ChurchesPage() {
  const supabase = await createClient()

  // Fetch all churches, their cities, and assigned pastors
  const { data: churches } = await supabase
    .from('churches')
    .select(`
      *,
      cities (name, states(uf)),
      pastors!pastors_church_id_fkey (full_name),
      campaign_churches (
        campaigns (name, status)
      )
    `)
    .order('name')

  return <ChurchesClient churches={churches || []} />
}
