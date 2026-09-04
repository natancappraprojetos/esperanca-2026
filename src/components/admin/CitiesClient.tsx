'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Copy, Save } from 'lucide-react'

export default function CitiesClient({ initialCities, pixels }: { initialCities: any[], pixels: any[] }) {
  const [search, setSearch] = useState('')
  const [ufFilter, setUfFilter] = useState('')
  const [cities, setCities] = useState(initialCities)
  const [pixelData, setPixelData] = useState<Record<string, string>>(
    pixels.reduce((acc, p) => ({ ...acc, [p.city_id]: p.pixel_id }), {})
  )
  const [saving, setSaving] = useState<string | null>(null)
  
  const supabase = createClient()

  async function handleSavePixel(cityId: string) {
    const pixelId = pixelData[cityId]
    setSaving(cityId)
    
    try {
      if (!pixelId) {
        // Delete pixel if empty
        const { error } = await supabase
          .from('tracking_pixels')
          .delete()
          .eq('city_id', cityId)
          .eq('scope', 'city')
        if (error) throw error
        toast.success('Pixel removido')
      } else {
        // Upsert pixel
        const existing = pixels.find(p => p.city_id === cityId)
        
        if (existing) {
          const { error } = await supabase
            .from('tracking_pixels')
            .update({ pixel_id: pixelId })
            .eq('id', existing.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('tracking_pixels')
            .insert({
              scope: 'city',
              city_id: cityId,
              pixel_type: 'meta',
              pixel_id: pixelId,
              is_active: true
            })
          if (error) throw error
        }
        toast.success('Pixel salvo com sucesso!')
      }
    } catch (err: any) {
      toast.error('Erro ao salvar pixel: ' + err.message)
    } finally {
      setSaving(null)
    }
  }

  function handleCopyLink(slug: string, uf: string) {
    const url = `${window.location.origin}/${uf.toLowerCase()}/${slug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
  }

  // Obter UFs únicos para o filtro
  const ufs = Array.from(new Set(initialCities.map((c: any) => c.states?.uf).filter(Boolean))).sort()

  const filteredCities = cities
    .filter((c: any) => c.name.toLowerCase().includes(search.toLowerCase()))
    .filter((c: any) => (ufFilter ? c.states?.uf === ufFilter : true))
    .sort((a: any, b: any) => a.name.localeCompare(b.name))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <input
          type="text"
          placeholder="Buscar cidade..."
          className="form-input max-w-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="form-input max-w-[150px]"
          value={ufFilter}
          onChange={e => setUfFilter(e.target.value)}
        >
          <option value="">Todas UFs</option>
          {ufs.map((uf: any) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden p-0">
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Cidade</th>
              <th>Link Direto</th>
              <th>Pixel do Facebook (Meta)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredCities.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                  Nenhuma cidade encontrada.
                </td>
              </tr>
            ) : (
              filteredCities.map((city: any) => (
                <tr key={city.id}>
                <td>
                  {city.status === 'active' ? (
                    <span className="badge badge-green">Ativa</span>
                  ) : (
                    <span className="badge badge-gray">Inativa</span>
                  )}
                </td>
                <td style={{ fontWeight: 500, color: 'var(--gray-900)' }}>
                  {city.name} / {city.states?.uf}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 truncate max-w-[200px]">
                      /{city.states?.uf.toLowerCase()}/{city.slug}
                    </span>
                    <button 
                      onClick={() => handleCopyLink(city.slug, city.states?.uf)}
                      className="text-gray-400 hover:text-gray-900"
                      title="Copiar Link"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </td>
                <td>
                  <input
                    type="text"
                    className="form-input text-sm py-1.5 px-3 h-auto"
                    placeholder="ID do Pixel (Ex: 123456789)"
                    value={pixelData[city.id] || ''}
                    onChange={e => setPixelData({ ...pixelData, [city.id]: e.target.value })}
                  />
                </td>
                <td>
                  <button
                    onClick={() => handleSavePixel(city.id)}
                    disabled={saving === city.id}
                    className="btn btn-primary py-1.5 px-3 text-sm flex items-center gap-2"
                  >
                    <Save size={14} />
                    {saving === city.id ? 'Salvando...' : 'Salvar Pixel'}
                  </button>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
}
