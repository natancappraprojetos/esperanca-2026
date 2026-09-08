'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { Plus, X } from 'lucide-react'

interface CampaignsClientProps {
  campaigns: any[]
}

export default function CampaignsClient({ campaigns: initialCampaigns }: CampaignsClientProps) {
  const [campaigns, setCampaigns] = useState(initialCampaigns)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [form, setForm] = useState({
    id: '',
    name: '',
    tagline: '',
    description: '',
    starts_at: '',
    ends_at: '',
    status: 'active'
  })

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setIsSaving(true)

    try {
      const isEdit = !!form.id
      const url = isEdit ? `/api/admin/campaigns/${form.id}` : '/api/admin/campaigns'
      
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar campanha')

      toast.success(isEdit ? 'Campanha atualizada!' : 'Campanha criada!')
      
      if (isEdit) {
        setCampaigns(campaigns.map(c => c.id === form.id ? { ...c, ...data.campaign } : c))
      } else {
        setCampaigns([data.campaign, ...campaigns])
      }
      
      setIsModalOpen(false)
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(camp: any) {
    setForm({
      id: camp.id,
      name: camp.name,
      tagline: camp.tagline || '',
      description: camp.description || '',
      starts_at: camp.starts_at ? new Date(camp.starts_at).toISOString().split('T')[0] : '',
      ends_at: camp.ends_at ? new Date(camp.ends_at).toISOString().split('T')[0] : '',
      status: camp.status || 'active'
    })
    setIsModalOpen(true)
  }

  function handleNew() {
    setForm({
      id: '',
      name: '',
      tagline: '',
      description: '',
      starts_at: '',
      ends_at: '',
      status: 'active'
    })
    setIsModalOpen(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta campanha?')) return

    try {
      const res = await fetch(`/api/admin/campaigns/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao excluir campanha')

      toast.success('Campanha excluída com sucesso!')
      setCampaigns(campaigns.filter(c => c.id !== id))
    } catch (error: any) {
      toast.error(error.message)
    }
  }

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
          onClick={handleNew}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Nova Campanha
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
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleEdit(camp)}
                          className="text-small" 
                          style={{ color: 'var(--gray-600)' }}
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(camp.id)}
                          className="text-small" 
                          style={{ color: 'var(--red)' }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal Nova/Editar Campanha */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-lg w-full relative"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-heading-3 mb-6" style={{ fontFamily: 'var(--font-serif)' }}>
              {form.id ? 'Editar Campanha' : 'Nova Campanha'}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              <div>
                <label className="form-label">Nome da Campanha</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Semana da Esperança 2026"
                />
              </div>

              <div>
                <label className="form-label">Subtítulo (Tagline)</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.tagline}
                  onChange={e => setForm({ ...form, tagline: e.target.value })}
                  placeholder="Ex: O Amanhecer de um Novo Tempo"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Data de Início</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={form.starts_at}
                    onChange={e => setForm({ ...form, starts_at: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Data de Término</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={form.ends_at}
                    onChange={e => setForm({ ...form, ends_at: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                  <option value="suspended">Suspensa</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : (form.id ? 'Salvar Alterações' : 'Criar Campanha')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
