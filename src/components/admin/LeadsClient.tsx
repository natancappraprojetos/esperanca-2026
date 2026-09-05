'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { formatWhatsappDisplay } from '@/lib/utils/whatsapp'
import type { UserProfile } from '@/types/database'

interface LeadsClientProps {
  leads: any[]
  total: number
  page: number
  limit: number
  profile: UserProfile
  filters: Record<string, string | undefined>
  filterOptions: {
    churches: Array<{ id: string; name: string }>
    cities: Array<{ id: string; name: string }>
    campaigns: Array<{ id: string; name: string }>
  }
}

export default function LeadsClient({ 
  leads, total, page, limit, profile, filters, filterOptions 
}: LeadsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [exporting, setExporting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const totalPages = Math.ceil(total / limit)
  const isChurchAdmin = profile.role === 'church_admin'

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('page')
    router.push(`/admin/leads?${params.toString()}`)
  }

  async function handleExportExcel() {
    setExporting(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      params.set('format', 'xlsx')
      const res = await fetch(`/api/admin/leads/export?${params.toString()}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `leads-${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Erro ao exportar. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      const params = new URLSearchParams(searchParams.toString())
      params.set('format', 'pdf')
      window.open(`/api/admin/leads/export?${params.toString()}`, '_blank')
    } catch { } finally {
      setExporting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Tem certeza que deseja excluir este lead? Essa ação não pode ser desfeita.')) return
    
    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/leads/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Erro ao excluir')
      }
      router.refresh()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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
            Leads
          </h1>
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            {total.toLocaleString('pt-BR')} pessoas no total
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            disabled={exporting}
            className="btn btn-secondary"
          >
            📊 Exportar Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="btn btn-secondary"
          >
            📄 Gerar PDF
          </button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-soft p-4 flex flex-wrap gap-3"
      >
        {!isChurchAdmin && (
          <select
            value={filters.church || ''}
            onChange={e => setFilter('church', e.target.value)}
            className="form-input"
            style={{ maxWidth: 220, padding: '0.5rem 0.75rem' }}
            aria-label="Filtrar por igreja"
          >
            <option value="">Todas as igrejas</option>
            {filterOptions.churches.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        {!isChurchAdmin && (
          <select
            value={filters.city || ''}
            onChange={e => setFilter('city', e.target.value)}
            className="form-input"
            style={{ maxWidth: 180, padding: '0.5rem 0.75rem' }}
            aria-label="Filtrar por cidade"
          >
            <option value="">Todas as cidades</option>
            {filterOptions.cities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}

        <select
          value={filters.campaign || ''}
          onChange={e => setFilter('campaign', e.target.value)}
          className="form-input"
          style={{ maxWidth: 260, padding: '0.5rem 0.75rem' }}
          aria-label="Filtrar por campanha"
        >
          <option value="">Todas as campanhas</option>
          {filterOptions.campaigns.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={filters.reminder || ''}
          onChange={e => setFilter('reminder', e.target.value)}
          className="form-input"
          style={{ maxWidth: 200, padding: '0.5rem 0.75rem' }}
          aria-label="Filtrar por lembrete"
        >
          <option value="">Todos</option>
          <option value="true">🔔 Querem lembrete</option>
          <option value="false">Não querem lembrete</option>
        </select>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                {!isChurchAdmin && <th>Igreja</th>}
                <th>Bairro</th>
                <th>Cidade</th>
                <th>Lembrete</th>
                <th>Origem</th>
                <th>Data</th>
                {!isChurchAdmin && <th style={{ textAlign: 'right' }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr>
                  <td 
                    colSpan={isChurchAdmin ? 7 : 9} 
                    style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}
                  >
                    Nenhum lead encontrado com esses filtros.
                  </td>
                </tr>
              ) : (
                leads.map((lead: any) => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lead.contacts?.full_name || '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                      {lead.contacts?.whatsapp ? formatWhatsappDisplay(lead.contacts.whatsapp) : '—'}
                    </td>
                    {!isChurchAdmin && (
                      <td style={{ color: 'var(--gray-600)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {lead.churches?.name || '—'}
                      </td>
                    )}
                    <td style={{ color: 'var(--gray-600)' }}>
                      {lead.neighborhoods?.name || '—'}
                    </td>
                    <td style={{ color: 'var(--gray-600)' }}>
                      {lead.cities?.name || '—'}
                    </td>
                    <td>
                      {lead.lead_consents?.[0]?.consent_reminder_whatsapp ? (
                        <span className="badge badge-green">🔔 Sim</span>
                      ) : (
                        <span className="badge badge-gray">Não</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.8rem' }}>
                      {lead.utm_source || '—'}
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    {!isChurchAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(lead.id)}
                          disabled={deletingId === lead.id}
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', color: 'var(--red)', border: 'none', background: 'transparent' }}
                          title="Excluir lead"
                        >
                          {deletingId === lead.id ? '⏳' : '🗑️'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-small" style={{ color: 'var(--gray-500)' }}>
            Mostrando {((page - 1) * limit) + 1}–{Math.min(page * limit, total)} de {total.toLocaleString('pt-BR')}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <button
                onClick={() => setFilter('page', String(page - 1))}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                ← Anterior
              </button>
            )}
            {page < totalPages && (
              <button
                onClick={() => setFilter('page', String(page + 1))}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                Próxima →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
