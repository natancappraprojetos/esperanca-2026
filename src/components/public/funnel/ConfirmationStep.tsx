'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { trackEvent } from '@/lib/tracking/events'
import type { Campaign } from '@/types/database'
import type { FunnelData } from '../FunnelPage'

interface ConfirmationStepProps {
  data: FunnelData
  campaign: Campaign
}

export default function ConfirmationStep({ data, campaign }: ConfirmationStepProps) {
  const [downloading, setDownloading] = useState(false)
  const [downloaded, setDownloaded] = useState(false)

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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="min-h-svh flex flex-col items-center justify-center w-full" style={{ background: 'var(--cream)' }}>
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
      </div>
    </div>
  )
}
