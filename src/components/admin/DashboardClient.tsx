'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import type { UserProfile } from '@/types/database'
import { formatWhatsappDisplay } from '@/lib/utils/whatsapp'

interface DashboardClientProps {
  profile: UserProfile
  kpis: {
    totalLeads: number
    todayLeads: number
    weekLeads: number
    monthLeads: number
    totalDownloads: number
    totalReminders: number
    totalChurches: number
  }
  recentLeads: any[]
}

const kpiConfig = [
  { key: 'totalLeads', label: 'Total de Leads', color: 'var(--red)', emoji: '👥' },
  { key: 'todayLeads', label: 'Hoje', color: 'var(--green)', emoji: '📅' },
  { key: 'weekLeads', label: 'Últimos 7 dias', color: 'var(--gray-700)', emoji: '📆' },
  { key: 'monthLeads', label: 'Este mês', color: 'var(--gray-700)', emoji: '🗓️' },
  { key: 'totalDownloads', label: 'Downloads', color: 'var(--green)', emoji: '📥' },
  { key: 'totalReminders', label: 'Lembretes WhatsApp', color: '#25D366', emoji: '🔔' },
]

export default function DashboardClient({ profile, kpis, recentLeads }: DashboardClientProps) {
  const firstName = profile.full_name?.split(' ')[0] || 'Admin'
  const isChurchAdmin = profile.role === 'church_admin'
  const isSuperAdmin = profile.role === 'super_admin'

  const visibleKpis = isSuperAdmin
    ? [...kpiConfig, { key: 'totalChurches', label: 'Igrejas ativas', color: 'var(--gray-700)', emoji: '🏛️' }]
    : kpiConfig

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-1"
      >
        <h1 
          className="text-heading-2"
          style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-900)' }}
        >
          {isChurchAdmin ? `Olá, Pastor ${firstName}.` : `Bem-vindo, ${firstName}.`}
        </h1>
        {isChurchAdmin ? (
          <p className="text-body" style={{ color: 'var(--gray-500)' }}>
            Pessoas que demonstraram interesse na campanha.
          </p>
        ) : (
          <p className="text-body" style={{ color: 'var(--gray-500)' }}>
            Acompanhe o progresso da Semana da Esperança 2026.
          </p>
        )}
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {visibleKpis.map((kpi, i) => (
          <motion.div
            key={kpi.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="kpi-card"
          >
            <div className="flex items-start justify-between mb-3">
              <span style={{ fontSize: '1.5rem' }}>{kpi.emoji}</span>
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: kpi.color, marginTop: 4 }}
              />
            </div>
            <div 
              className="kpi-value"
              style={{ color: kpi.color === 'var(--red)' ? 'var(--red)' : 'var(--gray-900)' }}
            >
              {(kpis[kpi.key as keyof typeof kpis] || 0).toLocaleString('pt-BR')}
            </div>
            <div className="kpi-label">{kpi.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Quick actions */}
      {!isChurchAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-3"
        >
          <Link href="/admin/leads" className="btn btn-primary">
            📋 Ver todos os leads
          </Link>
          <Link href="/admin/relatorios" className="btn btn-secondary">
            📈 Relatórios
          </Link>
          {isSuperAdmin && (
            <Link href="/admin/campanhas" className="btn btn-secondary">
              🎯 Campanhas
            </Link>
          )}
        </motion.div>
      )}

      {/* Recent Leads Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h2 
            className="text-heading-3"
            style={{ color: 'var(--gray-900)' }}
          >
            Leads Recentes
          </h2>
          <Link 
            href="/admin/leads"
            className="text-small"
            style={{ color: 'var(--red)' }}
          >
            Ver todos →
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>WhatsApp</th>
                {!isChurchAdmin && <th>Igreja</th>}
                <th>Bairro</th>
                <th>Lembrete</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={isChurchAdmin ? 5 : 6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-400)' }}>
                    Nenhum lead ainda.
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead: any) => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 500 }}>
                      {lead.contacts?.full_name || '—'}
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {lead.contacts?.whatsapp ? formatWhatsappDisplay(lead.contacts.whatsapp) : '—'}
                    </td>
                    {!isChurchAdmin && (
                      <td style={{ color: 'var(--gray-600)' }}>
                        {lead.churches?.name || '—'}
                      </td>
                    )}
                    <td style={{ color: 'var(--gray-600)' }}>
                      {lead.neighborhoods?.name || '—'}
                    </td>
                    <td>
                      {lead.lead_consents?.[0]?.consent_reminder_whatsapp ? (
                        <span className="badge badge-green">🔔 Sim</span>
                      ) : (
                        <span className="badge badge-gray">Não</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                      {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
