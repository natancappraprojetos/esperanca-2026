'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { toast } from 'react-hot-toast'
import { trackEvent } from '@/lib/tracking/events'
import type { Church, Campaign, Banner } from '@/types/database'
import type { FunnelData } from '../FunnelPage'

interface ChurchStepProps {
  church: Church | null
  campaign: Campaign
  onContinue: () => void
  onChangeChurch?: (church: Church) => void
  data: FunnelData
}

export default function ChurchStep({ church, campaign, onContinue, onChangeChurch, data }: ChurchStepProps) {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [sharing, setSharing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bannerLoading, setBannerLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [otherChurches, setOtherChurches] = useState<Church[]>([])

  useEffect(() => {
    if (!church) return
    trackEvent('ChurchViewed', {
      campaign_id: campaign.id,
      church_id: church.id,
      city_id: church.city_id,
      session_token: data.sessionToken,
    })

    // Se o Lead já existe (foi criado no passo de form antes de chegar na igreja), atualiza a igreja
    if (data.leadId && data.sessionToken) {
      fetch('/api/leads/assign-church', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: data.leadId,
          church_id: church.id,
          session_token: data.sessionToken
        })
      }).catch(err => console.error('Failed to update church', err))
    }

    // Load banner
    fetch(`/api/banners?church_id=${church.id}&campaign_id=${campaign.id}`)
      .then(r => r.json())
      .then(j => {
        setBanner(j.banner || null)
        setBannerLoading(false)
      })
      .catch(() => {
        setBannerLoading(false)
      })

    // Load other churches in the city
    fetch(`/api/churches/city?city_id=${church.city_id}&campaign_id=${campaign.id}`)
      .then(r => r.json())
      .then(j => {
        if (j.churches) {
          setOtherChurches(j.churches.filter((c: any) => c.id !== church.id))
        }
      })
      .catch(() => {})
  }, [church.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!church) {
    return (
      <div className="min-h-svh flex flex-col" style={{ paddingTop: '4rem' }}>
        <div className="container-narrow flex flex-col gap-6 py-10">
          <div
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-lg mx-auto bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center"
          >
            <div className="w-16 h-16 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-2">
              Igreja não encontrada
            </h2>
            <p className="text-gray-600 mb-8">
              Ainda não temos uma igreja mapeada exatamente neste bairro para esta campanha. Mas não se preocupe, você ainda pode baixar o material digital!
            </p>
            <button
              onClick={onContinue}
              className="w-full h-14 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors"
            >
              Baixar Material Digital
            </button>
          </div>
        </div>
      </div>
    )
  }

  const schedules = Array.isArray(church.schedules) ? church.schedules as Array<{day: string, time: string, description?: string}> : []
  
  const mapsUrl = church.latitude && church.longitude
    ? `https://maps.google.com/?q=${church.latitude},${church.longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent([church.address_street, church.address_number, church.address_neighborhood, 'RS'].filter(Boolean).join(', '))}`

  async function handleSave() {
    const bannerUrl = banner?.image_mobile_url || banner?.image_desktop_url
    if (!bannerUrl) return

    trackEvent('InviteSaved', {
      campaign_id: campaign.id,
      church_id: church.id,
      session_token: data.sessionToken,
    })

    // Try Web Share API first on mobile, then fallback to download
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile && navigator.share) {
      try {
        const res = await fetch(bannerUrl)
        const blob = await res.blob()
        const file = new File([blob], 'convite-semana-esperanca.jpg', { type: blob.type })
        await navigator.share({ files: [file], title: `Convite — ${church.name}` })
        setSaved(true)
        return
      } catch { /* fall through */ }
    }
    
    // Fallback: direct download
    const link = document.createElement('a')
    link.href = bannerUrl
    link.download = 'convite-semana-esperanca.jpg'
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setSaved(true)
  }

  async function handleShare() {
    const url = `${window.location.origin}/igreja/${church.slug}`
    
    trackEvent('InviteShared', {
      campaign_id: campaign.id,
      church_id: church.id,
      session_token: data.sessionToken,
    })

    setSharing(true)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: `${church.name} — Semana da Esperança 2026`,
          text: `Venha participar da Semana da Esperança! Eu vou estar na ${church.name}.`,
          url,
        })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copiado!')
    }
    setSharing(false)
  }


  return (
    <div className="min-h-svh flex flex-col" style={{ paddingTop: '4rem' }}>
      <div className="container-narrow flex flex-col gap-6 py-10">
        <div
          className="flex flex-col gap-2"
        >
          <span className="text-overline" style={{ color: 'var(--green)' }}>
            ✓ Encontramos uma programação perto de você
          </span>
        </div>

        {/* Banner */}
        <div
          className="church-banner"
          style={{ 
            background: 'var(--gray-100)',
            minHeight: 240,
            borderRadius: 'var(--radius-xl)',
          }}
        >
          {bannerLoading ? (
            <div className="flex items-center justify-center min-h-[300px] w-full bg-gray-100 animate-pulse rounded-[var(--radius-xl)]">
              <div className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--red)', width: 32, height: 32, borderWidth: 3 }} />
            </div>
          ) : banner ? (
            <div className="relative min-h-[300px] w-full bg-gray-100 rounded-[var(--radius-xl)] overflow-hidden flex items-center justify-center">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 backdrop-blur-sm z-10">
                   <div className="spinner" style={{ borderColor: 'var(--gray-300)', borderTopColor: 'var(--red)', width: 32, height: 32, borderWidth: 3 }} />
                </div>
              )}
              <picture>
                {banner.image_mobile_url && (
                  <source media="(max-width: 768px)" srcSet={banner.image_mobile_url} />
                )}
                <img
                  src={banner.image_desktop_url || banner.image_mobile_url || ''}
                  alt={`Banner da ${church.name}`}
                  className={`w-full h-auto object-contain mx-auto max-h-[65vh] transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                  style={{ borderRadius: 'var(--radius-xl)' }}
                  onLoad={() => setImageLoaded(true)}
                />
              </picture>
              
              {/* Overlay Download Button */}
              {imageLoaded && (
                <button
                  onClick={handleSave}
                  className="absolute top-4 right-4 bg-white/95 backdrop-blur shadow-xl px-4 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all text-gray-900 flex items-center gap-2 text-sm font-semibold border border-gray-100 z-20"
                  aria-label="Baixar convite"
                  title="Baixar convite"
                >
                  {saved ? (
                    <>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M16 5L7 14l-4-4" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>Salvo!</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                        <path d="M10 14l-5-5 1.4-1.4L9 11.2V2h2v9.2l2.6-2.6L15 9l-5 5z" fill="currentColor"/>
                        <path d="M3 16h14v2H3z" fill="currentColor"/>
                      </svg>
                      <span>Baixe seu convite</span>
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            /* Fallback visual when no banner */
            <div 
              className="flex flex-col items-center justify-center py-16 px-6 text-center"
              style={{ 
                background: 'linear-gradient(135deg, #1a1a17 0%, #3d3d38 100%)',
                borderRadius: 'var(--radius-xl)',
                minHeight: '300px'
              }}
            >
              <p 
                className="text-overline mb-3"
                style={{ color: 'var(--champagne)' }}
              >
                Semana da Esperança 2026
              </p>
              <h3 
                className="text-heading-2 mb-2"
                style={{ color: 'var(--white)', fontFamily: 'var(--font-serif)' }}
              >
                Jesus, Nossa Esperança
              </h3>
              <p style={{ color: 'var(--gray-400)' }}>{church.name}</p>
            </div>
          )}
        </div>

        {/* Other Options */}
        {otherChurches.length > 0 && (
          <div className="flex flex-col gap-3 mt-4">
            <p className="text-small" style={{ color: 'var(--gray-500)', textAlign: 'center' }}>
              Nós também temos culto nestes locais em {church.city_id ? 'sua cidade' : 'sua região'}:
            </p>
            <div className="grid gap-3">
              {otherChurches.map(other => (
                <button
                  key={other.id}
                  onClick={() => onChangeChurch?.(other)}
                  className="card-soft p-4 flex items-center justify-between text-left hover:border-red-200 hover:bg-red-50/50 transition-all border border-transparent"
                >
                  <div className="flex flex-col">
                    <span style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{other.name}</span>
                    {other.address_neighborhood && (
                      <span className="text-caption" style={{ color: 'var(--gray-500)' }}>Bairro {other.address_neighborhood}</span>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0 text-red-500">
                    →
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Continue CTA */}
        <div
        >
          <button
            onClick={onContinue}
            className="btn btn-download w-full"
            style={{ borderRadius: 'var(--radius-xl)' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: '0.5rem' }}>
              <path d="M12 16L7 11L8.4 9.55L11 12.15V4H13V12.15L15.6 9.55L17 11L12 16ZM6 20C5.45 20 4.97917 19.8042 4.5875 19.4125C4.19583 19.0208 4 18.55 4 18V15H6V18H18V15H20V18C20 18.55 19.8042 19.0208 19.4125 19.4125C19.0208 19.8042 18.55 20 18 20H6Z" fill="currentColor"/>
            </svg>
            Baixar Livro Digital
          </button>
        </div>
      </div>
    </div>
  )
}
