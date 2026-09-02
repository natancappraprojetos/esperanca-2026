'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface ChurchesClientProps {
  churches: any[]
}

export default function ChurchesClient({ churches }: ChurchesClientProps) {
  const [search, setSearch] = useState('')

  const filtered = churches.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.cities?.name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 
            className="text-heading-2"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-900)' }}
          >
            Igrejas
          </h1>
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            Gerencie as igrejas participantes e seus pastores
          </p>
        </div>
        <button className="btn btn-primary">
          + Nova Igreja
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3"
      >
        <input
          type="text"
          placeholder="Buscar por nome ou cidade..."
          className="form-input max-w-md"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Igreja</th>
                <th>Cidade</th>
                <th>Região</th>
                <th>Pregador</th>
                <th>Pr. Distrital</th>
                <th>Campanha Atual</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                    Nenhuma igreja encontrada.
                  </td>
                </tr>
              ) : (
                filtered.map((church: any) => {
                  const pastor = church.pastors?.[0]
                  const activeCampaign = church.campaign_churches?.find((cc: any) => cc.campaigns.status === 'active')?.campaigns

                  return (
                    <tr key={church.id}>
                      <td>
                        {church.status === 'active' ? (
                          <span className="badge badge-green">Ativa</span>
                        ) : (
                          <span className="badge badge-gray">Inativa</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                        {church.name}
                        <div className="text-caption mt-1" style={{ color: 'var(--gray-500)', fontWeight: 400 }}>
                          {church.address_street}, {church.address_neighborhood}
                        </div>
                      </td>
                      <td style={{ color: 'var(--gray-600)' }}>
                        {church.cities?.name} / {church.cities?.states?.uf}
                      </td>
                      <td style={{ color: 'var(--gray-600)' }}>
                        {church.region ? `Região ${church.region}` : <span style={{ color: 'var(--gray-400)' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--gray-600)' }}>
                        {pastor ? (
                          <>
                            <div>{pastor.full_name}</div>

                          </>
                        ) : (
                          <span style={{ color: 'var(--gray-400)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--gray-600)' }}>
                        {church.district_pastor || <span style={{ color: 'var(--gray-400)' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--gray-600)' }}>
                        {activeCampaign ? activeCampaign.name : <span style={{ color: 'var(--gray-400)' }}>—</span>}
                      </td>
                      <td>
                        <button className="text-small" style={{ color: 'var(--red)' }}>
                          Editar
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
