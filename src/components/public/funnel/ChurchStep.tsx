'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { trackEvent } from '@/lib/tracking/events'
import type { Church, Campaign, Banner } from '@/types/database'
import type { FunnelData } from '../FunnelPage'

interface ChurchStepProps {
  church: Church | null
  campaign: Campaign
  onContinue: () => void
  data: FunnelData
}

export default function ChurchStep({ church, campaign, onContinue, data }: ChurchStepProps) {
  const [banner, setBanner] = useState<Banner | null>(null)
  const [sharing, setSharing] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!church) return
    trackEvent('ChurchViewed', {
      campaign_id: campaign.id,
      church_id: church.id,
      city_id: church.city_id,
      session_token: data.sessionToken,
    })
    // Load banner
    fetch(`/api/banners?church_id=${church.id}&campaign_id=${campaign.id}`)
      .then(r => r.json())
      .then(j => setBanner(j.banner || null))
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!church) {
    return (
      <div className="min-h-svh flex flex-col" style={{ paddingTop: '4rem' }}>
        <div className="container-narrow flex flex-col gap-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
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
          </motion.div>
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

    // Try Web Share API first, then download
    if (navigator.share) {
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
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${church.name} — Semana da Esperança 2026`,
          text: `Venha participar da Semana da Esperança! Eu vou estar na ${church.name}.`,
          url,
        })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      // Could show a toast here
    }
    setSharing(false)
  }

    <div className="min-h-svh flex flex-col" style={{ paddingTop: '4rem' }}>
      <div className="container-narrow flex flex-col gap-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <span className="text-overline" style={{ color: 'var(--green)' }}>
            ✓ Encontramos uma programação perto de você
          </span>
          <h2 className="text-heading-2" style={{ color: 'var(--gray-900)' }}>
            {church.name}
          </h2>
          {church.is_demo && (
            <span className="badge badge-champagne text-xs">
              Dados de demonstração
            </span>
          )}
        </motion.div>

        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="church-banner"
          style={{ 
            background: 'var(--gray-100)',
            minHeight: 240,
            borderRadius: 'var(--radius-xl)',
          }}
        >
          {banner ? (
            <div className="relative">
              <picture>
                {banner.image_mobile_url && (
                  <source media="(max-width: 768px)" srcSet={banner.image_mobile_url} />
                )}
                <img
                  src={banner.image_desktop_url || banner.image_mobile_url || ''}
                  alt={`Banner da ${church.name}`}
                  className="w-full object-cover"
                  style={{ maxHeight: 400, borderRadius: 'var(--radius-xl)' }}
                />
              </picture>
            </div>
          ) : (
            /* Fallback visual when no banner */
            <div 
              className="flex flex-col items-center justify-center py-16 px-6 text-center"
              style={{ 
                background: 'linear-gradient(135deg, #1a1a17 0%, #3d3d38 100%)',
                borderRadius: 'var(--radius-xl)',
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
        </motion.div>

        {/* Church details */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5 flex flex-col gap-4"
        >
          {/* Schedule */}
          {schedules.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-overline" style={{ color: 'var(--gray-500)' }}>
                Programação
              </p>
              <div className="flex flex-col gap-2">
                {schedules.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div 
                      className="flex-shrink-0 w-1 h-1 rounded-full"
                      style={{ backgroundColor: 'var(--red)', width: 6, height: 6 }}
                    />
                    <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                      {s.day}
                    </span>
                    <span style={{ color: 'var(--gray-500)' }}>
                      {s.time}
                    </span>
                    {s.description && (
                      <span className="text-small" style={{ color: 'var(--gray-400)' }}>
                        — {s.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Address */}
          {(church.address_street || church.address_neighborhood) && (
            <div className="flex flex-col gap-1">
              <p className="text-overline" style={{ color: 'var(--gray-500)' }}>
                Endereço
              </p>
              <p style={{ color: 'var(--gray-700)' }}>
                {[
                  church.address_street,
                  church.address_number,
                  church.address_complement,
                  church.address_neighborhood,
                ].filter(Boolean).join(', ')}
              </p>
            </div>
          )}

          {/* How to get there */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ alignSelf: 'flex-start' }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="2" fill="none"/>
            </svg>
            Como Chegar
          </a>
        </motion.div>

        {/* Save / Share invite */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card-soft p-5 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <p style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
              Gostou da programação?
            </p>
            <p className="text-small" style={{ color: 'var(--gray-500)' }}>
              Salve o convite para não esquecer.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleSave}
              className="btn btn-secondary flex items-center gap-2"
              disabled={saved}
            >
              {saved ? (
                <>✓ Salvo!</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                    <path d="M10 14l-5-5 1.4-1.4L9 11.2V2h2v9.2l2.6-2.6L15 9l-5 5z" fill="currentColor"/>
                    <path d="M3 16h14v2H3z" fill="currentColor"/>
                  </svg>
                  Salvar Convite
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="btn btn-secondary flex items-center gap-2"
              disabled={sharing}
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M15 8a3 3 0 100-6 3 3 0 000 6zm-10 4a3 3 0 100-6 3 3 0 000 6zm10 4a3 3 0 100-6 3 3 0 000 6zm-10-9l10 4m-10 1l10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Compartilhar
            </button>
          </div>
        </motion.div>

        {/* Continue CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <button
            onClick={onContinue}
            className="btn btn-primary btn-lg btn-full"
          >
            Continuar
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10H16M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </motion.div>
      </div>
    </div>
  )
}
