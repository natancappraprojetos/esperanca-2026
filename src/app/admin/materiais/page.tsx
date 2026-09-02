import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Materiais Digitais | Admin' }

export default async function MaterialsPage() {
  const supabase = await createClient()

  const { data: materials } = await supabase
    .from('digital_materials')
    .select(`
      *,
      campaigns (name),
      material_downloads (count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 
            className="text-heading-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-900)' }}
          >
            Materiais Digitais
          </h1>
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            Gerencie os iscas digitais, e-books e recursos
          </p>
        </div>
        <button className="btn btn-primary">
          + Novo Material
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>Campanha</th>
              <th>Downloads</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(!materials || materials.length === 0) ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                  Nenhum material cadastrado.
                </td>
              </tr>
            ) : (
              materials.map((mat: any) => (
                <tr key={mat.id}>
                  <td>
                    {mat.status === 'active' ? (
                      <span className="badge badge-green">Ativo</span>
                    ) : (
                      <span className="badge badge-gray">Inativo</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                    {mat.name}
                  </td>
                  <td style={{ color: 'var(--gray-600)', textTransform: 'capitalize' }}>
                    {mat.type}
                  </td>
                  <td style={{ color: 'var(--gray-600)' }}>
                    {mat.campaigns?.name || '—'}
                  </td>
                  <td style={{ color: 'var(--gray-900)', fontWeight: 500 }}>
                    {mat.material_downloads?.[0]?.count || 0}
                  </td>
                  <td>
                    <button className="text-small" style={{ color: 'var(--red)' }}>Editar</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
