'use client'

import { motion } from 'framer-motion'
import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Save, X, Plus, MapPin, RefreshCw, CheckCircle, AlertCircle, Loader, Copy, Image as ImageIcon, Upload, Trash2, Eye } from 'lucide-react'

interface City {
  id: string
  name: string
  state_id: string
  states: { id: string; name: string; uf: string } | null
}

interface ChurchesClientProps {
  churches: any[]
  pixels?: any[]
  globalPixels?: any[]
  activeCampaign?: any
  cities: City[]
}

type GeocodeStatus = 'idle' | 'loading' | 'ok' | 'failed'

type ModalMode = 'edit' | 'create'

const EMPTY_FORM = {
  name: '',
  city_id: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_cep: '',
  district_pastor: '',
  pixel_id: '',
}

export default function ChurchesClient({ churches: initialChurches, pixels = [], globalPixels = [], activeCampaign, cities }: ChurchesClientProps) {
  const [churches, setChurches] = useState(initialChurches)
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  const [modalMode, setModalMode] = useState<ModalMode>('edit')
  const [editingChurch, setEditingChurch] = useState<any | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>('idle')
  const [geocodeAddress, setGeocodeAddress] = useState<string | null>(null)
  const [geocodeCoords, setGeocodeCoords] = useState<{ lat: number; lng: number } | null>(null)

  // Estado local de pixels (mutável para feedback imediato)
  const [localPixels, setLocalPixels] = useState(pixels)
  
  // Estado para os inputs de pixel diretamente na tabela
  const [pixelData, setPixelData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    pixels.forEach((p: any) => {
      if (p.church_id && p.pixel_id) {
        initial[p.church_id] = p.pixel_id
      }
    })
    return initial
  })
  const [savingPixel, setSavingPixel] = useState<string | null>(null)

  // Pixel global
  const [globalPixelData, setGlobalPixelData] = useState<string>(
    globalPixels.find(p => p.pixel_type === 'meta')?.pixel_id || ''
  )
  const [savingGlobalPixel, setSavingGlobalPixel] = useState(false)

  // Funnel Model
  const [funnelModel, setFunnelModel] = useState<'model-1' | 'model-2' | 'model-3'>(
    (activeCampaign?.settings as any)?.funnel_model || 'model-1'
  )
  const [savingModel, setSavingModel] = useState(false)

  // Banner state
  const [churchBanner, setChurchBanner] = useState<any | null>(null)
  const [bannerLoading, setBannerLoading] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  const supabase = createClient()

  // ------------------------------------
  // Filtragem e ordenação
  // ------------------------------------
  const uniqueCityIds = Array.from(new Set(churches.map((c) => c.city_id).filter(Boolean)))
  const cityOptions = cities.filter((c) => uniqueCityIds.includes(c.id))

  const filtered = churches
    .filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.cities?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.address_neighborhood?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((c) => (cityFilter ? c.city_id === cityFilter : true))
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
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

  function requestSort(key: string) {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc'
    setSortConfig({ key, direction })
  }

  function getSortIndicator(key: string) {
    if (!sortConfig || sortConfig.key !== key) return null
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓'
  }

  // ------------------------------------
  // Abertura do modal
  // ------------------------------------
  function openEditModal(church: any) {
    setModalMode('edit')
    setEditingChurch(church)
    const existingPixel = localPixels.find((p) => p.church_id === church.id)
    setForm({
      name: church.name || '',
      city_id: church.city_id || '',
      address_street: church.address_street || '',
      address_number: church.address_number || '',
      address_complement: church.address_complement || '',
      address_neighborhood: church.address_neighborhood || '',
      address_cep: church.address_cep || '',
      district_pastor: church.district_pastor || '',
      pixel_id: existingPixel?.pixel_id || '',
    })
    setGeocodeStatus(church.geocode_status === 'ok' ? 'ok' : 'idle')
    setGeocodeAddress(church.geocode_formatted_address || null)
    setGeocodeCoords(
      church.latitude && church.longitude
        ? { lat: church.latitude, lng: church.longitude }
        : null
    )
    // Fetch banner for this church
    fetchBanner(church.id)
  }

  async function fetchBanner(churchId: string) {
    setBannerLoading(true)
    setChurchBanner(null)
    try {
      const { data: banners } = await supabase
        .from('banners')
        .select('*')
        .eq('church_id', churchId)
        .eq('status', 'active')
        .order('display_order')
        .limit(1)
      setChurchBanner(banners && banners.length > 0 ? banners[0] : null)
    } catch {
      setChurchBanner(null)
    } finally {
      setBannerLoading(false)
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editingChurch) return

    const campaignId = activeCampaign?.id
    if (!campaignId) {
      toast.error('Nenhuma campanha ativa encontrada')
      return
    }

    setUploadingBanner(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('church_id', editingChurch.id)
      formData.append('campaign_id', campaignId)
      formData.append('church_name', editingChurch.name || '')
      if (churchBanner?.id) {
        formData.append('existing_banner_id', churchBanner.id)
      }

      const res = await fetch('/api/admin/banners/upload', {
        method: 'POST',
        body: formData,
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || 'Erro ao enviar banner')
        return
      }

      toast.success('Banner enviado com sucesso!')
      fetchBanner(editingChurch.id)
    } catch (err: any) {
      toast.error('Erro ao enviar banner: ' + err.message)
    } finally {
      setUploadingBanner(false)
    }
  }

  async function handleDeleteBanner() {
    if (!churchBanner || churchBanner.id === 'fallback') return
    try {
      await supabase.from('banners').delete().eq('id', churchBanner.id)
      setChurchBanner(null)
      toast.success('Banner removido!')
    } catch {
      toast.error('Erro ao remover banner')
    }
  }

  function openCreateModal() {
    setModalMode('create')
    setEditingChurch(null)
    setForm({ ...EMPTY_FORM })
    setGeocodeStatus('idle')
    setGeocodeAddress(null)
    setGeocodeCoords(null)
  }

  function closeModal() {
    setEditingChurch(null)
    setModalMode('edit')
    setGeocodeStatus('idle')
    setGeocodeAddress(null)
    setGeocodeCoords(null)
  }

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Se o campo de endereço mudou, reseta status de geocodificação
    if (['address_street', 'address_number', 'address_neighborhood', 'address_cep', 'city_id'].includes(field)) {
      setGeocodeStatus('idle')
      setGeocodeAddress(null)
    }
  }

  // ------------------------------------
  // Geocodificação manual (botão)
  // ------------------------------------
  const handleGeocode = useCallback(
    async (churchId?: string) => {
      // Para criação, precisamos salvar primeiro para ter um ID
      // Para edição, usa o ID existente
      const id = churchId || editingChurch?.id
      if (!id) return

      setGeocodeStatus('loading')
      try {
        const res = await fetch('/api/admin/geocode-church', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ church_id: id }),
        })
        const json = await res.json()

        if (!res.ok || !json.success) {
          setGeocodeStatus('failed')
          toast.error('Não foi possível geocodificar o endereço. Verifique os dados e tente novamente.')
          return
        }

        setGeocodeStatus('ok')
        setGeocodeAddress(json.formatted_address)
        setGeocodeCoords({ lat: json.latitude, lng: json.longitude })
        toast.success(`Localização encontrada via ${json.provider}`)

        // Atualiza estado local
        setChurches((prev) =>
          prev.map((c) =>
            c.id === id
              ? { ...c, latitude: json.latitude, longitude: json.longitude, geocode_status: 'ok' }
              : c
          )
        )
      } catch {
        setGeocodeStatus('failed')
        toast.error('Erro ao geocodificar. Tente novamente.')
      }
    },
    [editingChurch]
  )

  // ------------------------------------
  // Salvar (edição)
  // ------------------------------------
  async function handleSave() {
    if (!editingChurch) return
    setIsSaving(true)

    const addressChanged =
      form.address_street !== (editingChurch.address_street || '') ||
      form.address_number !== (editingChurch.address_number || '') ||
      form.address_neighborhood !== (editingChurch.address_neighborhood || '') ||
      form.address_cep !== (editingChurch.address_cep || '') ||
      form.city_id !== (editingChurch.city_id || '')

    try {
      const updatePayload: any = {
        name: form.name,
        city_id: form.city_id || editingChurch.city_id,
        address_street: form.address_street || null,
        address_number: form.address_number || null,
        address_complement: form.address_complement || null,
        address_neighborhood: form.address_neighborhood || null,
        address_cep: form.address_cep.replace(/\D/g, '') || null,
        district_pastor: form.district_pastor || null,
        updated_at: new Date().toISOString(),
      }

      const { error: churchError } = await supabase
        .from('churches')
        .update(updatePayload)
        .eq('id', editingChurch.id)

      if (churchError) throw churchError

      // Atualiza pixel
      const existingPixel = localPixels.find((p) => p.church_id === editingChurch.id)
      if (!form.pixel_id && existingPixel) {
        await supabase.from('tracking_pixels').delete().eq('id', existingPixel.id)
        setLocalPixels((prev) => prev.filter((p) => p.id !== existingPixel.id))
      } else if (form.pixel_id && existingPixel) {
        await supabase.from('tracking_pixels').update({ pixel_id: form.pixel_id }).eq('id', existingPixel.id)
        setLocalPixels((prev) => prev.map((p) => (p.id === existingPixel.id ? { ...p, pixel_id: form.pixel_id } : p)))
      } else if (form.pixel_id && !existingPixel) {
        const { data: newPixel } = await supabase
          .from('tracking_pixels')
          .insert({ scope: 'church', church_id: editingChurch.id, pixel_type: 'meta', pixel_id: form.pixel_id, is_active: true })
          .select()
          .single()
        if (newPixel) setLocalPixels((prev) => [...prev, newPixel])
      }

      // Se o endereço mudou, geocodifica automaticamente
      if (addressChanged) {
        toast.loading('Atualizando localização...', { id: 'geocode' })
        setGeocodeStatus('loading')

        const geoRes = await fetch('/api/admin/geocode-church', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ church_id: editingChurch.id }),
        })
        const geoJson = await geoRes.json()

        if (geoJson.success) {
          setGeocodeStatus('ok')
          setGeocodeAddress(geoJson.formatted_address)
          setGeocodeCoords({ lat: geoJson.latitude, lng: geoJson.longitude })
          toast.success('Localização atualizada!', { id: 'geocode' })
        } else {
          setGeocodeStatus('failed')
          toast.error('Igreja salva, mas não foi possível geocodificar o endereço.', { id: 'geocode' })
        }
      }

      // Atualiza estado local com os novos dados
      const updatedCity = cities.find((c) => c.id === (form.city_id || editingChurch.city_id))
      setChurches((prev) =>
        prev.map((c) =>
          c.id === editingChurch.id
            ? {
                ...c,
                ...updatePayload,
                cities: updatedCity
                  ? { name: updatedCity.name, states: updatedCity.states }
                  : c.cities,
              }
            : c
        )
      )

      toast.success('Igreja atualizada com sucesso!')
      closeModal()
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ------------------------------------
  // Criar nova igreja
  // ------------------------------------
  async function handleCreate() {
    if (!form.name || !form.city_id) {
      toast.error('Nome e cidade são obrigatórios.')
      return
    }
    setIsSaving(true)

    try {
      // Gera slug único a partir do nome
      const slugBase = form.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      // Busca a organização
      const { data: orgData } = await supabase.from('organizations').select('id').limit(1).single()
      if (!orgData) throw new Error('Organização não encontrada')

      const newChurch: any = {
        organization_id: orgData.id,
        name: form.name,
        city_id: form.city_id,
        slug: `${slugBase}-${Date.now()}`,
        address_street: form.address_street || null,
        address_number: form.address_number || null,
        address_complement: form.address_complement || null,
        address_neighborhood: form.address_neighborhood || null,
        address_cep: form.address_cep.replace(/\D/g, '') || null,
        district_pastor: form.district_pastor || null,
        status: 'active',
        needs_geocode: true,
        geocode_status: 'pending',
      }

      const { data: created, error: createError } = await supabase
        .from('churches')
        .insert(newChurch)
        .select('id, name, city_id, slug')
        .single()

      if (createError) throw createError

      toast.loading('Geocodificando endereço...', { id: 'geocode-create' })
      setGeocodeStatus('loading')

      const geoRes = await fetch('/api/admin/geocode-church', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ church_id: created.id }),
      })
      const geoJson = await geoRes.json()

      if (geoJson.success) {
        setGeocodeStatus('ok')
        setGeocodeAddress(geoJson.formatted_address)
        setGeocodeCoords({ lat: geoJson.latitude, lng: geoJson.longitude })
        toast.success('Igreja criada com localização!', { id: 'geocode-create' })
      } else {
        setGeocodeStatus('failed')
        toast('Igreja criada, mas sem localização. Verifique o endereço.', { id: 'geocode-create', icon: '⚠️' })
      }

      // Adiciona pixel se informado
      if (form.pixel_id) {
        await supabase.from('tracking_pixels').insert({
          scope: 'church',
          church_id: created.id,
          pixel_type: 'meta',
          pixel_id: form.pixel_id,
          is_active: true,
        })
      }

      // Adiciona na lista local (recarrega com dados completos)
      const updatedCity = cities.find((c) => c.id === form.city_id)
      setChurches((prev) => [
        ...prev,
        {
          ...newChurch,
          id: created.id,
          slug: created.slug,
          latitude: geoJson.latitude || null,
          longitude: geoJson.longitude || null,
          geocode_status: geoJson.success ? 'ok' : 'failed',
          cities: updatedCity
            ? { name: updatedCity.name, states: updatedCity.states }
            : null,
          pastors: [],
          campaign_churches: [],
        },
      ])

      closeModal()
    } catch (err: any) {
      toast.error('Erro ao criar igreja: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // ------------------------------------
  // Render
  // ------------------------------------
  const isEditing = modalMode === 'edit' && editingChurch !== null
  const isCreating = modalMode === 'create'
  const showModal = isEditing || isCreating

  // Agrupar cidades por estado para o select
  const citiesByState = cities.reduce<Record<string, City[]>>((acc, city) => {
    const stateLabel = city.states ? `${city.states.name} (${city.states.uf})` : 'Sem estado'
    if (!acc[stateLabel]) acc[stateLabel] = []
    acc[stateLabel].push(city)
    return acc
  }, {})

  const geocodeIcon = {
    idle: null,
    loading: <Loader size={14} className="animate-spin text-blue-500" />,
    ok: <CheckCircle size={14} className="text-green-500" />,
    failed: <AlertCircle size={14} className="text-amber-500" />,
  }[geocodeStatus]

  async function handleSaveModel(model: 'model-1' | 'model-2' | 'model-3') {
    if (!activeCampaign) return
    setSavingModel(true)
    setFunnelModel(model)
    try {
      const currentSettings = activeCampaign.settings || {}
      const newSettings = { ...currentSettings, funnel_model: model }
      
      const { error } = await supabase
        .from('campaigns')
        .update({ settings: newSettings })
        .eq('id', activeCampaign.id)
        
      if (error) throw error
      toast.success('Modelo de funil atualizado com sucesso!')
    } catch (err: any) {
      toast.error('Erro ao atualizar modelo: ' + err.message)
    } finally {
      setSavingModel(false)
    }
  }

  // ------------------------------------
  // Salvar Pixel Global
  // ------------------------------------
  async function handleSaveGlobalPixel() {
    setSavingGlobalPixel(true)
    
    try {
      if (!globalPixelData) {
        // Se o input estiver vazio, deletamos o pixel global se existir
        const { error } = await supabase
          .from('tracking_pixels')
          .delete()
          .eq('scope', 'global')
        if (error) throw error
        toast.success('Pixel Global removido')
      } else {
        const existing = globalPixels?.find(p => p.pixel_type === 'meta')
        if (existing) {
          const { error } = await supabase
            .from('tracking_pixels')
            .update({ pixel_id: globalPixelData })
            .eq('id', existing.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('tracking_pixels')
            .insert({
              pixel_type: 'meta',
              pixel_id: globalPixelData,
              scope: 'global',
              is_active: true
            })
          if (error) throw error
        }
        toast.success('Pixel Global salvo com sucesso!')
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Erro ao salvar pixel global: ' + err.message)
    } finally {
      setSavingGlobalPixel(false)
    }
  }

  // ------------------------------------
  // Salvar Pixel Direto da Tabela
  // ------------------------------------
  async function handleSavePixel(churchId: string) {
    const pixelId = pixelData[churchId]
    setSavingPixel(churchId)
    
    try {
      if (!pixelId) {
        const { error } = await supabase
          .from('tracking_pixels')
          .delete()
          .eq('church_id', churchId)
          .eq('scope', 'church')
        if (error) throw error
        toast.success('Pixel removido da igreja')
      } else {
        const existing = localPixels.find(p => p.church_id === churchId)
        if (existing) {
          const { error } = await supabase
            .from('tracking_pixels')
            .update({ pixel_id: pixelId })
            .eq('id', existing.id)
          if (error) throw error
          setLocalPixels(prev => prev.map(p => p.id === existing.id ? { ...p, pixel_id: pixelId } : p))
        } else {
          const { data, error } = await supabase
            .from('tracking_pixels')
            .insert({ scope: 'church', church_id: churchId, pixel_type: 'meta', pixel_id: pixelId, is_active: true })
            .select()
            .single()
          if (error) throw error
          if (data) setLocalPixels(prev => [...prev, data])
        }
        toast.success('Pixel salvo com sucesso')
      }
    } catch (err: any) {
      toast.error('Erro ao salvar pixel')
      console.error(err)
    } finally {
      setSavingPixel(null)
    }
  }

  // ------------------------------------
  // Copiar link da igreja
  // ------------------------------------
  function handleCopyLink(churchSlug: string) {
    const url = `${window.location.origin}/igreja/${churchSlug}`
    navigator.clipboard.writeText(url)
    toast.success('Link copiado!')
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
            Gerencie as igrejas participantes — {churches.length} cadastradas
          </p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={openCreateModal}>
          <Plus size={16} /> Nova Igreja
        </button>
      </motion.div>

      {/* Configurações Globais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pixel Global */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-soft p-5 flex flex-col justify-between gap-4 bg-gray-50/50 h-full"
        >
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              Pixel Global (Link Geral)
            </h3>
            <p className="text-small text-gray-500 mt-1">
              Este pixel será disparado na página inicial quando as pessoas entrarem no link principal (sem ser link direto de igreja).
            </p>
          </div>
          <div className="flex items-center gap-2 mt-auto w-full">
            <input
              type="text"
              className="form-input flex-1"
              placeholder="ID do Pixel (Meta)"
              value={globalPixelData}
              onChange={(e) => setGlobalPixelData(e.target.value)}
            />
            <button
              onClick={handleSaveGlobalPixel}
              disabled={savingGlobalPixel}
              className="btn btn-primary py-2 px-4 flex items-center justify-center gap-2 flex-shrink-0"
            >
              <Save size={16} />
            </button>
          </div>
        </motion.div>

        {/* Modelo de Funil */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="card-soft p-5 flex flex-col gap-4 bg-gray-50/50 h-full"
        >
          <div>
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              Modelo de Funil (Link Geral)
            </h3>
            <p className="text-small text-gray-500 mt-1 mb-3">
              Escolha a ordem das páginas da sua campanha atual.
            </p>
          </div>
          
          <div className="flex flex-col gap-2 mt-auto">
            {[
              { id: 'model-1', label: '1. Padrão (Igreja antes do Formulário)' },
              { id: 'model-2', label: '2. Invertido (Formulário antes da Igreja)' },
              { id: 'model-3', label: '3. Enxuto (Sem seleção de igreja)' }
            ].map(m => (
              <label key={m.id} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-white transition-colors bg-white/50">
                <input 
                  type="radio" 
                  name="funnel_model"
                  className="w-4 h-4 accent-gray-900"
                  checked={funnelModel === m.id}
                  onChange={() => handleSaveModel(m.id as any)}
                  disabled={savingModel}
                />
                <span className="text-sm font-medium text-gray-800">{m.label}</span>
              </label>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <input
          type="text"
          placeholder="Buscar por nome, cidade ou bairro..."
          className="form-input max-w-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="form-input max-w-[220px]"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">Todas as cidades</option>
          {cityOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} / {c.states?.uf}
            </option>
          ))}
        </select>
        {(search || cityFilter) && (
          <button
            className="text-small text-gray-500 hover:text-gray-800 underline"
            onClick={() => { setSearch(''); setCityFilter('') }}
          >
            Limpar filtros
          </button>
        )}
      </motion.div>

      {/* Tabela */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th onClick={() => requestSort('status')} className="cursor-pointer hover:bg-gray-50 select-none">
                  Status{getSortIndicator('status')}
                </th>
                <th onClick={() => requestSort('name')} className="cursor-pointer hover:bg-gray-50 select-none">
                  Igreja{getSortIndicator('name')}
                </th>
                <th onClick={() => requestSort('city')} className="cursor-pointer hover:bg-gray-50 select-none">
                  Cidade{getSortIndicator('city')}
                </th>
                <th>Localização</th>
                <th onClick={() => requestSort('pastor')} className="cursor-pointer hover:bg-gray-50 select-none">
                  Pregador{getSortIndicator('pastor')}
                </th>
                <th>Link Direto</th>
                <th>Pixel do Facebook (Meta)</th>
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
                  const activeCampaign = church.campaign_churches?.find(
                    (cc: any) => cc.campaigns.status === 'active'
                  )?.campaigns
                  const hasCoords = church.latitude && church.longitude
                  const geocodePending = church.geocode_status === 'pending' || church.needs_geocode

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
                          {[church.address_street, church.address_number, church.address_neighborhood]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      </td>
                      <td style={{ color: 'var(--gray-600)' }}>
                        {church.cities?.name} / {church.cities?.states?.uf}
                      </td>
                      <td>
                        {hasCoords ? (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                            <span className="text-caption" style={{ color: 'var(--gray-500)' }}>
                              {church.latitude?.toFixed(4)}, {church.longitude?.toFixed(4)}
                            </span>
                          </div>
                        ) : geocodePending ? (
                          <div className="flex items-center gap-1.5">
                            <AlertCircle size={14} className="text-amber-500 flex-shrink-0" />
                            <span className="text-caption" style={{ color: 'var(--amber-600)' }}>
                              Pendente
                            </span>
                          </div>
                        ) : (
                          <span className="text-caption" style={{ color: 'var(--gray-400)' }}>—</span>
                        )}
                      </td>
                      <td style={{ color: 'var(--gray-600)' }}>
                        {pastor ? pastor.full_name : <span style={{ color: 'var(--gray-400)' }}>—</span>}
                      </td>
                      <td>
                        {church.slug ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 truncate max-w-[120px]" title={`/igreja/${church.slug}`}>
                              /igreja/{church.slug}
                            </span>
                            <button 
                              onClick={() => handleCopyLink(church.slug)}
                              className="text-gray-400 hover:text-gray-900"
                              title="Copiar Link"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--gray-400)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            className="form-input text-sm py-1.5 px-3 h-auto min-w-[150px]"
                            placeholder="ID do Pixel"
                            value={pixelData[church.id] || ''}
                            onChange={(e) => setPixelData({ ...pixelData, [church.id]: e.target.value })}
                          />
                          <button
                            onClick={() => handleSavePixel(church.id)}
                            disabled={savingPixel === church.id}
                            className="btn btn-primary py-1.5 px-3 text-sm flex items-center gap-2 flex-shrink-0"
                          >
                            <Save size={14} />
                            {savingPixel === church.id ? '...' : 'Salvar'}
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            className="text-small font-medium flex items-center gap-1 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded"
                            style={{ color: 'var(--gray-800)' }}
                            onClick={() => openEditModal(church)}
                          >
                            Editar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ============================================================
          MODAL DE EDIÇÃO / CRIAÇÃO
          ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden my-4"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-lg text-gray-900">
                {isCreating ? '+ Nova Igreja' : 'Editar Igreja'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* ---- Informações básicas ---- */}
              <section className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Informações Básicas
                </h4>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome da Igreja <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input w-full"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Ex: IASD Vila Nova"
                  />
                </div>

                {/* Cidade — select dinâmico do banco, sem hardcode */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cidade <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="form-input w-full"
                    value={form.city_id}
                    onChange={(e) => updateField('city_id', e.target.value)}
                  >
                    <option value="">Selecione a cidade...</option>
                    {Object.entries(citiesByState)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([stateLabel, stateCities]) => (
                        <optgroup key={stateLabel} label={stateLabel}>
                          {stateCities
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map((city) => (
                              <option key={city.id} value={city.id}>
                                {city.name}
                              </option>
                            ))}
                        </optgroup>
                      ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Não encontrou a cidade?{' '}
                    <a href="/admin/cidades" className="text-blue-500 underline" target="_blank">
                      Cadastre em Cidades
                    </a>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pastor Distrital</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={form.district_pastor}
                      onChange={(e) => updateField('district_pastor', e.target.value)}
                      placeholder="Nome do pastor"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meta Pixel ID</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={form.pixel_id}
                      onChange={(e) => updateField('pixel_id', e.target.value)}
                      placeholder="1234567890123"
                    />
                  </div>
                </div>
              </section>

              {/* ---- Endereço ---- */}
              <section className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                    Endereço
                  </h4>
                  <p className="text-xs text-gray-400">
                    A geolocalização é calculada automaticamente ao salvar
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rua / Logradouro</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={form.address_street}
                      onChange={(e) => updateField('address_street', e.target.value)}
                      placeholder="Ex: Rua das Flores"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={form.address_number}
                      onChange={(e) => updateField('address_number', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={form.address_neighborhood}
                      onChange={(e) => updateField('address_neighborhood', e.target.value)}
                      placeholder="Ex: Centro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input
                      type="text"
                      className="form-input w-full"
                      value={form.address_cep}
                      onChange={(e) => updateField('address_cep', e.target.value)}
                      placeholder="00000-000"
                      maxLength={9}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input
                    type="text"
                    className="form-input w-full"
                    value={form.address_complement}
                    onChange={(e) => updateField('address_complement', e.target.value)}
                    placeholder="Sala 2, Bloco B, etc."
                  />
                </div>

                {/* Status de geocodificação */}
                <div
                  className="flex items-start gap-3 p-3 rounded-lg border"
                  style={{
                    borderColor:
                      geocodeStatus === 'ok'
                        ? 'var(--green-200, #bbf7d0)'
                        : geocodeStatus === 'failed'
                        ? 'var(--amber-200, #fde68a)'
                        : 'var(--gray-200)',
                    backgroundColor:
                      geocodeStatus === 'ok'
                        ? 'rgba(187,247,208,0.2)'
                        : geocodeStatus === 'failed'
                        ? 'rgba(253,230,138,0.2)'
                        : 'var(--gray-50)',
                  }}
                >
                  <MapPin
                    size={16}
                    className="flex-shrink-0 mt-0.5"
                    style={{
                      color:
                        geocodeStatus === 'ok'
                          ? 'var(--green)'
                          : geocodeStatus === 'failed'
                          ? '#d97706'
                          : 'var(--gray-400)',
                    }}
                  />
                  <div className="flex-1">
                    {geocodeStatus === 'idle' && (
                      <p className="text-xs text-gray-500">
                        {isEditing && editingChurch?.latitude
                          ? `Localização atual: ${editingChurch.latitude.toFixed(5)}, ${editingChurch.longitude.toFixed(5)}`
                          : 'Localização será calculada ao salvar.'}
                      </p>
                    )}
                    {geocodeStatus === 'loading' && (
                      <p className="text-xs text-blue-600 flex items-center gap-1.5">
                        <Loader size={12} className="animate-spin" /> Geocodificando...
                      </p>
                    )}
                    {geocodeStatus === 'ok' && (
                      <div>
                        <p className="text-xs font-medium text-green-700">✓ Localização encontrada</p>
                        {geocodeAddress && (
                          <p className="text-xs text-gray-500 mt-0.5">{geocodeAddress}</p>
                        )}
                        {geocodeCoords && (
                          <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-xs text-gray-400">
                              {geocodeCoords.lat.toFixed(6)}, {geocodeCoords.lng.toFixed(6)}
                            </p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${geocodeCoords.lat},${geocodeCoords.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            >
                              Ver no Mapa
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {geocodeStatus === 'failed' && (
                      <div>
                        <p className="text-xs font-medium text-amber-700">
                          ⚠ Não foi possível geocodificar este endereço
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Verifique os dados e tente novamente, ou insira as coordenadas manualmente.
                        </p>
                      </div>
                    )}
                  </div>
                  {/* Botão de re-geocodificação (apenas em edição, quando a church já existe) */}
                  {isEditing && (geocodeStatus === 'failed' || geocodeStatus === 'idle') && (
                    <button
                      onClick={() => handleGeocode()}
                      disabled={!editingChurch}
                      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                      style={{ color: 'var(--gray-700)' }}
                    >
                      <RefreshCw size={12} /> Geocodificar
                    </button>
                  )}

                </div>
              </section>

              {/* === BANNER SECTION === */}
              {isEditing && (
                <section className="flex flex-col gap-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--gray-700)' }}>
                    <ImageIcon size={16} /> Banner da Igreja
                  </h3>
                  
                  {bannerLoading ? (
                    <div className="flex items-center gap-2 p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                      <Loader size={16} className="animate-spin text-gray-400" />
                      <span className="text-sm text-gray-500">Carregando banner...</span>
                    </div>
                  ) : churchBanner ? (
                    <div className="flex flex-col gap-3">
                      {/* Preview */}
                      <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        <img 
                          src={churchBanner.image_desktop_url || churchBanner.image_mobile_url}
                          alt={`Banner de ${editingChurch?.name}`}
                          className="w-full h-auto max-h-[200px] object-contain"
                        />
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          <a
                            href={churchBanner.image_desktop_url || churchBanner.image_mobile_url}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white/90 backdrop-blur rounded-lg p-1.5 hover:bg-white shadow-sm border border-gray-100"
                            title="Ver em tela cheia"
                          >
                            <Eye size={14} className="text-gray-600" />
                          </a>
                          <button
                            onClick={handleDeleteBanner}
                            className="bg-white/90 backdrop-blur rounded-lg p-1.5 hover:bg-red-50 shadow-sm border border-gray-100"
                            title="Remover banner"
                          >
                            <Trash2 size={14} className="text-red-500" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Arquivo: {churchBanner.image_desktop_url}
                      </p>
                      {/* Replace button */}
                      <label className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer w-fit transition-colors">
                        <Upload size={14} />
                        Trocar Banner
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerUpload}
                          disabled={uploadingBanner}
                        />
                      </label>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-6 rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                        <ImageIcon size={24} className="text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500 text-center">
                        Nenhum banner cadastrado para esta igreja.
                      </p>
                      <label className="btn btn-primary text-sm py-2 px-4 flex items-center gap-2 cursor-pointer">
                        {uploadingBanner ? (
                          <><Loader size={14} className="animate-spin" /> Enviando...</>
                        ) : (
                          <><Upload size={14} /> Enviar Banner</>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleBannerUpload}
                          disabled={uploadingBanner}
                        />
                      </label>
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={isCreating ? handleCreate : handleSave}
                disabled={isSaving || geocodeStatus === 'loading'}
                className="btn btn-primary flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    {isCreating ? 'Criando...' : 'Salvando...'}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {isCreating ? 'Criar Igreja' : 'Salvar Alterações'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
