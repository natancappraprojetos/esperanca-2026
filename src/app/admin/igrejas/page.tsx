import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ChurchesClient from '@/components/admin/ChurchesClient'

export const metadata: Metadata = { title: 'Igrejas | Admin' }

export default async function ChurchesPage() {
  const supabase = await createClient()

  // Busca igrejas com cidades, estados, pastores e campanhas
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

  // Pixels específicos por igreja
  const { data: pixels } = await supabase
    .from('tracking_pixels')
    .select('*')
    .eq('scope', 'church')

  // Pixel Global (link geral)
  const { data: globalPixels } = await supabase
    .from('tracking_pixels')
    .select('*')
    .eq('scope', 'global')

  // Busca todas as cidades ativas com seus estados — passadas ao client para o select dinâmico
  // Genérico: retorna todas as cidades cadastradas, sem filtro por estado/nome
  const { data: cities } = await supabase
    .from('cities')
    .select(`
      id,
      name,
      state_id,
      states (id, name, uf)
    `)
    .eq('status', 'active')
    .order('name')

  return (
    <ChurchesClient
      churches={churches || []}
      pixels={pixels || []}
      globalPixels={globalPixels || []}
      cities={(cities || []) as any[]}
    />
  )
}
