'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Save, X } from 'lucide-react'

export default function PastorsClient({ initialPastors }: { initialPastors: any[] }) {
  const [pastors, setPastors] = useState(initialPastors)
  const [search, setSearch] = useState('')
  const [churchFilter, setChurchFilter] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const [editingPastor, setEditingPastor] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  // Get unique churches
  const churches = Array.from(
    new Map(
      initialPastors
        .map(p => p.churches)
        .filter(Boolean)
        .map(c => [c.id, c.name])
    ).entries()
  )

  const filteredPastors = pastors
    .filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()))
    .filter(p => (churchFilter ? p.church_id === churchFilter : true))
    .sort((a, b) => {
      if (!sortConfig) return a.full_name.localeCompare(b.full_name)
      
      let aValue: any = a[sortConfig.key] || ''
      let bValue: any = b[sortConfig.key] || ''
      
      if (sortConfig.key === 'church') {
        aValue = a.churches?.name || ''
        bValue = b.churches?.name || ''
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  function handleEditClick(pastor: any) {
    setEditingPastor(pastor)
    setEditName(pastor.full_name || '')
    setEditPhone(pastor.phone || '')
  }

  async function handleSave() {
    if (!editingPastor) return
    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('pastors')
        .update({
          full_name: editName,
          phone: editPhone
        })
        .eq('id', editingPastor.id)

      if (error) throw error

      setPastors(prev => prev.map(p => {
        if (p.id === editingPastor.id) {
          return { ...p, full_name: editName, phone: editPhone }
        }
        return p
      }))

      toast.success('Pastor atualizado com sucesso!')
      setEditingPastor(null)
    } catch (err: any) {
      toast.error('Erro ao atualizar: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 relative">
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

      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar pastor..."
          className="form-input max-w-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-input max-w-[200px]"
          value={churchFilter}
          onChange={e => setChurchFilter(e.target.value)}
        >
          <option value="">Todas Igrejas</option>
          {churches.map(([id, name]) => (
            <option key={id} value={id}>{name as string}</option>
          ))}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => requestSort('full_name')} className="cursor-pointer hover:bg-gray-50 select-none">Nome{getSortIndicator('full_name')}</th>
              <th>Função</th>
              <th onClick={() => requestSort('church')} className="cursor-pointer hover:bg-gray-50 select-none">Igreja Designada{getSortIndicator('church')}</th>
              <th onClick={() => requestSort('phone')} className="cursor-pointer hover:bg-gray-50 select-none">Telefone{getSortIndicator('phone')}</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {(!filteredPastors || filteredPastors.length === 0) ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                  Nenhum pastor encontrado.
                </td>
              </tr>
            ) : (
              filteredPastors.map((pastor: any) => (
                <tr key={pastor.id}>
                  <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                    {pastor.full_name}
                  </td>
                  <td style={{ color: 'var(--gray-600)' }}>Pastor(a)</td>
                  <td style={{ color: 'var(--gray-600)' }}>{pastor.churches?.name || '—'}</td>
                  <td style={{ color: 'var(--gray-600)' }}>{pastor.phone || '—'}</td>
                  <td>
                    <button 
                      className="text-small font-medium flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded"
                      style={{ color: 'var(--gray-800)' }}
                      onClick={() => handleEditClick(pastor)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingPastor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-lg text-gray-900">Editar Pastor</h3>
              <button 
                onClick={() => setEditingPastor(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  type="text" 
                  className="form-input w-full" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
                <input 
                  type="text" 
                  className="form-input w-full" 
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="Ex: (51) 99999-9999"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingPastor(null)}
                className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="btn btn-primary flex items-center gap-2"
              >
                <Save size={16} />
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
