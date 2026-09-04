import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PastorsClient from '@/components/admin/PastorsClient'

export const metadata: Metadata = { title: 'Pastores | Admin' }

export default async function PastorsPage() {
  const supabase = await createClient()

  const { data: pastors } = await supabase
    .from('pastors')
    .select(`
      *,
      churches!pastors_church_id_fkey (id, name)
    `)
    .order('full_name')

  return <PastorsClient initialPastors={pastors || []} />
}
