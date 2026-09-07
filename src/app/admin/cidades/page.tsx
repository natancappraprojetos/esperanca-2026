import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import CitiesClient from '@/components/admin/CitiesClient'

export const metadata: Metadata = { title: 'Cidades | Admin' }

export default async function CitiesPage() {
  const supabase = await createClient()

  // Fetch all cities and their state
  const { data: cities } = await supabase
    .from('cities')
    .select(`
      *,
      states (uf)
    `)
    .order('name')

  // Fetch all tracking pixels for these cities
  const { data: pixels } = await supabase
    .from('tracking_pixels')
    .select('*')
    .eq('scope', 'city')
    .eq('pixel_type', 'meta')

  const { data: activeCampaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--gray-900)' }}>Cidades</h1>
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            Gerencie as cidades participantes — {cities?.length || 0} cadastradas
          </p>
        </div>
      </div>
      
      <CitiesClient initialCities={cities || []} pixels={pixels || []} activeCampaign={activeCampaign} />
    </div>
  )
}
