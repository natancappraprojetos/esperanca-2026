'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Save, X } from 'lucide-react'

interface ChurchesClientProps {
  churches: any[]
  pixels?: any[]
}

export default function ChurchesClient({ churches: initialChurches, pixels = [] }: ChurchesClientProps) {
  const [churches, setChurches] = useState(initialChurches)
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  
  const [editingChurch, setEditingChurch] = useState<any | null>(null)
  const [editName, setEditName] = useState('')
  const [editDistrictPastor, setEditDistrictPastor] = useState('')
  const [editPixelId, setEditPixelId] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const regions = Array.from(new Set(churches.map(c => c.region).filter(Boolean))).sort()

  const filtered = churches
    .filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cities?.name?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(c => (regionFilter ? String(c.region) === regionFilter : true))
    .sort((a, b) => {
      if (!sortConfig) return a.name.localeCompare(b.name)
      
      let aValue: any = a[sortConfig.key]
      let bValue: any = b[sortConfig.key]
      
      if (sortConfig.key === 'city') {
        aValue = a.cities?.name || ''
        bValue = b.cities?.name || ''
      } else if (sortConfig.key === 'pastor') {
        aValue = a.pastors?.[0]?.full_name || ''
        bValue = b.pastors?.[0]?.full_name || ''
      } else if (sortConfig.key === 'campaign') {
        aValue = a.campaign_churches?.find((cc: any) => cc.campaigns.status === 'active')?.campaigns?.name || ''
        bValue = b.campaign_churches?.find((cc: any) => cc.campaigns.status === 'active')?.campaigns?.name || ''
      } else if (sortConfig.key === 'region') {
        aValue = a.region || 0
        bValue = b.region || 0
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

  function handleEditClick(church: any) {
    setEditingChurch(church)
    setEditName(church.name || '')
    setEditDistrictPastor(church.district_pastor || '')
    
    const existingPixel = pixels.find(p => p.church_id === church.id)
    setEditPixelId(existingPixel?.pixel_id || '')
  }

  async function handleSave() {
    if (!editingChurch) return
    setIsSaving(true)

    try {
      // Update church
      const { error: churchError } = await supabase
        .from('churches')
        .update({
          name: editName,
          district_pastor: editDistrictPastor
        })
        .eq('id', editingChurch.id)

      if (churchError) throw churchError

      // Update pixel
      const existingPixel = pixels.find(p => p.church_id === editingChurch.id)
      
      if (!editPixelId) {
        if (existingPixel) {
          const { error: pixelError } = await supabase
            .from('tracking_pixels')
            .delete()
            .eq('id', existingPixel.id)
          if (pixelError) throw pixelError
        }
      } else {
        if (existingPixel) {
          const { error: pixelError } = await supabase
            .from('tracking_pixels')
            .update({ pixel_id: editPixelId })
            .eq('id', existingPixel.id)
          if (pixelError) throw pixelError
        } else {
          const { error: pixelError } = await supabase
            .from('tracking_pixels')
            .insert({
              scope: 'church',
              church_id: editingChurch.id,
              pixel_type: 'meta',
              pixel_id: editPixelId,
              is_active: true
            })
          if (pixelError) throw pixelError
        }
      }

      // Update local state
      setChurches(prev => prev.map(c => {
        if (c.id === editingChurch.id) {
          return { ...c, name: editName, district_pastor: editDistrictPastor }
        }
        return c
      }))

      // Update local pixels state mutating the passed prop is anti-pattern but works for quick UI feedback
      if (existingPixel) {
        existingPixel.pixel_id = editPixelId
      } else if (editPixelId) {
        pixels.push({ church_id: editingChurch.id, pixel_id: editPixelId })
      }

      toast.success('Igreja atualizada com sucesso!')
      setEditingChurch(null)
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 relative">
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
        <select
          className="form-input max-w-[150px]"
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
        >
          <option value="">Todas Regiões</option>
          {regions.map((r: any) => (
            <option key={r} value={String(r)}>Região {r}</option>
          ))}
        </select>
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
                <th onClick={() => requestSort('status')} className="cursor-pointer hover:bg-gray-50 select-none">Status{getSortIndicator('status')}</th>
                <th onClick={() => requestSort('name')} className="cursor-pointer hover:bg-gray-50 select-none">Igreja{getSortIndicator('name')}</th>
                <th onClick={() => requestSort('city')} className="cursor-pointer hover:bg-gray-50 select-none">Cidade{getSortIndicator('city')}</th>
                <th onClick={() => requestSort('region')} className="cursor-pointer hover:bg-gray-50 select-none">Região{getSortIndicator('region')}</th>
                <th onClick={() => requestSort('pastor')} className="cursor-pointer hover:bg-gray-50 select-none">Pregador{getSortIndicator('pastor')}</th>
                <th onClick={() => requestSort('district_pastor')} className="cursor-pointer hover:bg-gray-50 select-none">Pr. Distrital{getSortIndicator('district_pastor')}</th>
                <th onClick={() => requestSort('campaign')} className="cursor-pointer hover:bg-gray-50 select-none">Campanha Atual{getSortIndicator('campaign')}</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
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
                          <div>{pastor.full_name}</div>
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
                        <button 
                          className="text-small font-medium flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded"
                          style={{ color: 'var(--gray-800)' }}
                          onClick={() => handleEditClick(church)}
                        >
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

      {/* Edit Modal */}
      {editingChurch && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-lg text-gray-900">Editar Igreja</h3>
              <button 
                onClick={() => setEditingChurch(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Igreja</label>
                <input 
                  type="text" 
                  className="form-input w-full" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pastor Distrital</label>
                <input 
                  type="text" 
                  className="form-input w-full" 
                  value={editDistrictPastor}
                  onChange={e => setEditDistrictPastor(e.target.value)}
                  placeholder="Nome do pastor do distrito..."
                />
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                <label className="block text-sm font-medium text-gray-900 mb-1">ID do Meta Pixel (Específico da Igreja)</label>
                <p className="text-xs text-gray-500 mb-2">
                  Se preenchido, os leads desta igreja serão marcados com este Pixel além do pixel da campanha/cidade.
                </p>
                <input 
                  type="text" 
                  className="form-input w-full bg-white" 
                  value={editPixelId}
                  onChange={e => setEditPixelId(e.target.value)}
                  placeholder="Ex: 1234567890123"
                />
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button 
                onClick={() => setEditingChurch(null)}
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
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
