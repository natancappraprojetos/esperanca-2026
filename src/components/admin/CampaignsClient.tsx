'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface CampaignsClientProps {
  campaigns: any[]
}

export default function CampaignsClient({ campaigns }: CampaignsClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

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
            Campanhas
          </h1>
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            Gerencie os eventos e captações da organização
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          + Nova Campanha
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Nome</th>
                <th>Período</th>
                <th>Igrejas</th>
                <th>Cidades</th>
                <th>Leads Gerados</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                    Nenhuma campanha cadastrada.
                  </td>
                </tr>
              ) : (
                campaigns.map((camp: any) => (
                  <tr key={camp.id}>
                    <td>
                      {camp.status === 'active' ? (
                        <span className="badge badge-green">Ativa</span>
                      ) : (
                        <span className="badge badge-gray">Inativa</span>
                      )}
                    </td>
                    <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                      {camp.name}
                      {camp.tagline && (
                        <div className="text-caption" style={{ color: 'var(--gray-500)', fontWeight: 400 }}>
                          {camp.tagline}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--gray-600)' }}>
                      {new Date(camp.starts_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} até{' '}
                      {new Date(camp.ends_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </td>
                    <td style={{ color: 'var(--gray-600)' }}>
                      {camp.campaign_churches[0]?.count || 0}
                    </td>
                    <td style={{ color: 'var(--gray-600)' }}>
                      {camp.campaign_cities[0]?.count || 0}
                    </td>
                    <td style={{ color: 'var(--gray-900)', fontWeight: 500 }}>
                      {camp.leads[0]?.count || 0}
                    </td>
                    <td>
                      <button className="text-small" style={{ color: 'var(--red)' }}>
                        Editar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
