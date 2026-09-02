import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Pastores | Admin' }

export default async function PastorsPage() {
  const supabase = await createClient()

  const { data: pastors } = await supabase
    .from('pastors')
    .select(`
      *,
      churches (name)
    `)
    .order('full_name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 
            className="text-heading-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-900)' }}
          >
            Pastores & Convidados
          </h1>
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            Gerencie os palestrantes e responsáveis pelas igrejas
          </p>
        </div>
        <button className="btn btn-primary">
          + Novo Pastor
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Função</th>
              <th>Igreja Designada</th>
              <th>Telefone</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(!pastors || pastors.length === 0) ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                  Nenhum pastor encontrado.
                </td>
              </tr>
            ) : (
              pastors.map((pastor: any) => (
                <tr key={pastor.id}>
                  <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                    {pastor.full_name}
                  </td>
                  <td style={{ color: 'var(--gray-600)' }}>Pastor(a)</td>
                  <td style={{ color: 'var(--gray-600)' }}>{pastor.churches?.name || '—'}</td>
                  <td style={{ color: 'var(--gray-600)' }}>{pastor.phone || '—'}</td>
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
