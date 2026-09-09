'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { trackEvent } from '@/lib/tracking/events'
import { toast } from 'react-hot-toast'
import { MapPin, Loader } from 'lucide-react'
import type { Campaign, Church } from '@/types/database'
import type { FunnelData } from '../FunnelPage'

interface ConfirmationStepProps {
  data: FunnelData
  campaign: Campaign
  onContinue?: () => void
  onChangeChurch?: (church: Church) => void
}

export default function ConfirmationStep({ data, campaign, onContinue, onChangeChurch }: ConfirmationStepProps) {
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)
  
  // States para igrejas alternativas
  const [otherChurches, setOtherChurches] = useState<Church[]>([])
  const [loadingChurches, setLoadingChurches] = useState(false)
  const [changingChurch, setChangingChurch] = useState<string | null>(null)

  const church = data.church
  const schedules = Array.isArray(church?.schedules) 
    ? church.schedules as Array<{day: string, time: string, description?: string}> 
    : []

  const mapsUrl = church?.latitude && church?.longitude
    ? `https://maps.google.com/?q=${church.latitude},${church.longitude}`
    : church?.address_street 
      ? `https://maps.google.com/?q=${encodeURIComponent([church.address_street, church.address_number, 'RS'].filter(Boolean).join(', '))}`
      : null

  const whatsappUrl = church?.whatsapp
    ? `https://wa.me/55${church.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Vi a programação da Semana da Esperança e gostaria de saber mais.')}`
    : null

  useEffect(() => {
    trackEvent('LeadSubmitted', {
      campaign_id: campaign.id,
      church_id: church?.id,
      session_token: data.sessionToken,
    })

    // Auto-download material on confirmation page load
    const timer = setTimeout(() => {
      handleDownload()
    }, 1000)

    // Load other churches in the same city
    if (data.city?.id && church?.id) {
      loadOtherChurches()
    }

    return () => clearTimeout(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadOtherChurches() {
    try {
      setLoadingChurches(true)
      const res = await fetch(`/api/churches/city?city_id=${data.city?.id}&campaign_id=${campaign.id}`)
      if (res.ok) {
        const json = await res.json()
        const others = (json.churches || [])
          .filter((c: any) => c.id !== church?.id)
        setOtherChurches(others)
      }
    } catch (err) {
      console.error('Error fetching other churches', err)
    } finally {
      setLoadingChurches(false)
    }
  }

  async function handleChurchChange(newChurch: Church) {
    const confirmChange = window.confirm(`Deseja alterar o local do seu evento para ${newChurch.name}?`)
    if (!confirmChange) return

    setChangingChurch(newChurch.id)
    try {
      const res = await fetch('/api/leads/update-church', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: data.leadId,
          church_id: newChurch.id,
          session_token: data.sessionToken
        })
      })

      if (!res.ok) {
        throw new Error('Falha ao atualizar a igreja')
      }

      toast.success('Local alterado com sucesso!')
      
      // Update URL para conversões personalizadas
      if (newChurch.slug) {
        const newUrl = `/igreja/${newChurch.slug}`
        if (window.location.pathname !== newUrl) {
          window.history.pushState(null, '', newUrl)
        }
      }

      // Update local state and trigger re-render of confirmation with new church
      if (onChangeChurch) {
        onChangeChurch(newChurch)
      }
    } catch (err) {
      toast.error('Erro ao alterar local. Tente novamente.')
    } finally {
      setChangingChurch(null)
    }
  }

  async function handleDownload() {
    if (!data.material?.file_url) return
    setDownloading(true)

    try {
      // Get signed download URL
      const res = await fetch(`/api/materials/download?lead_id=${data.leadId}&material_id=${data.material.id}`, {
        method: 'POST',
      })
      const json = await res.json()

      if (json.url) {
        trackEvent('DownloadCompleted', {
          campaign_id: campaign.id,
          material_id: data.material.id,
          church_id: church?.id,
          session_token: data.sessionToken,
        })
        
        const link = document.createElement('a')
        link.href = json.url
        link.download = `${data.material.name}.pdf`
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setDownloaded(true)
      }
    } catch {
      // fallback: open direct
      if (data.material?.file_url) window.open(data.material.file_url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  async function handleShare() {
    const url = church ? `${window.location.origin}/igreja/${church.slug}` : window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Semana da Esperança 2026`,
          text: `Vou participar da Semana da Esperança! Venha também! ${church ? `📍 ${church.name}` : ''}`,
          url,
        })
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  const firstName = data.leadName?.split(' ')[0] || 'você'

  return (
    <div className="flex-1 min-h-svh flex flex-col items-center justify-center w-full" style={{ background: 'var(--cream)' }}>
      <div className="w-full max-w-lg mx-auto px-6 py-12 flex flex-col items-center text-center gap-8">

        <div className="flex flex-col items-center text-center gap-4 pt-4">
          <div className="success-checkmark" role="img" aria-label="Sucesso">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h2 
              className="text-heading-1"
              style={{ fontFamily: 'var(--font-serif)', color: 'var(--gray-900)' }}
            >
              Pronto, {firstName}!
            </h2>
            <p className="text-body" style={{ color: 'var(--gray-500)' }}>
              Estamos felizes por você ter dado esse passo.
            </p>
            <p className="text-small" style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>
              Estamos orando por você. 🙏
            </p>
          </div>
        </div>

        {/* Download CTA */}
        {data.material && (
          <div
            className="material-offer"
          >
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '1.5rem' }}>📖</span>
                <div className="flex flex-col">
                  <p className="text-overline" style={{ color: 'var(--green)' }}>
                    Seu livro digital está disponível
                  </p>
                  <p style={{ fontWeight: 600, color: 'var(--gray-900)' }}>
                    {data.material.name}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="btn btn-download btn-full"
              >
                {downloading ? (
                  <div className="flex items-center gap-2">
                    <div className="spinner" style={{ borderTopColor: 'white' }} />
                    <span>Preparando download...</span>
                  </div>
                ) : downloaded ? (
                  <>✓ Baixado! Obrigado</>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 14l-5-5 1.4-1.4L9 11.2V2h2v9.2l2.6-2.6L15 9l-5 5z" fill="currentColor"/>
                      <path d="M3 16h14v2H3z" fill="currentColor"/>
                    </svg>
                    Baixar {data.material.name}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Reminder confirmation */}
        {data.consentReminder && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ 
              background: 'rgba(26, 122, 74, 0.06)', 
              border: '1px solid rgba(26, 122, 74, 0.15)' 
            }}
          >
            <span style={{ fontSize: '1.25rem' }}>🔔</span>
            <p className="text-small" style={{ color: 'var(--green)' }}>
              <strong>Ótimo!</strong> Vamos te lembrar da programação pelo WhatsApp. 
              Fique de olho nas próximas mensagens!
            </p>
          </div>
        )}


        {/* Footer message */}
        <motion.p
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0 }}
          className="text-center text-small"
          style={{ color: 'var(--gray-400)' }}
        >
          Será uma alegria receber você. ✨
        </motion.p>
        
        {onContinue && (
          <button 
            onClick={onContinue}
            className="btn btn-primary w-full mt-4"
          >
            Encontrar a igreja mais próxima
          </button>
        )}
      </div>

      {/* Igrejas Alternativas */}
      {otherChurches.length > 0 && (
        <div className="w-full mt-12 pt-8 border-t border-gray-100">
          <h3 className="text-xl md:text-2xl text-center text-gray-900 mb-6 font-serif tracking-tight">
            Nós também temos culto nestes locais em {data.city?.name}
          </h3>
          <div className="w-full flex flex-col gap-6">
            {otherChurches.map((otherChurch: any) => {
              const bannerUrl = otherChurch.banner?.image_desktop_url || otherChurch.banner?.image_mobile_url
              return (
                <button
                  key={otherChurch.id}
                  onClick={() => handleChurchChange(otherChurch)}
                  disabled={changingChurch !== null}
                  className="relative w-full rounded-[var(--radius-xl)] overflow-hidden shadow-md hover:shadow-xl transition-all group text-left border-2 border-transparent hover:border-red-500 bg-gray-100"
                >
                  {bannerUrl ? (
                    <img 
                      src={bannerUrl} 
                      alt={otherChurch.name}
                      className="w-full h-auto object-contain transition-opacity group-hover:opacity-90"
                    />
                  ) : (
                    <div className="w-full py-16 bg-gray-900 flex flex-col items-center justify-center text-center px-4">
                      <p className="text-overline text-champagne mb-2">Semana da Esperança 2026</p>
                      <h4 className="font-serif text-2xl text-white mb-2">{otherChurch.name}</h4>
                      <p className="text-sm text-gray-400">
                        {otherChurch.address_street}{otherChurch.address_number ? `, ${otherChurch.address_number}` : ''}
                      </p>
                    </div>
                  )}
                  {changingChurch === otherChurch.id && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col gap-3 items-center justify-center z-10">
                      <Loader className="animate-spin text-red-600 w-8 h-8" />
                      <span className="font-medium text-gray-900">Trocando local...</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
