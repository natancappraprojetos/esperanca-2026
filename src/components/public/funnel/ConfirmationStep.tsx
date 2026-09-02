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
    <div className="min-h-svh flex flex-col" style={{ background: 'var(--cream)' }}>
      <div className="container-narrow py-12 flex flex-col gap-8">

        {/* Success header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center gap-4 pt-4"
        >
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
        </motion.div>

        {/* Download CTA */}
        {data.material && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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
          </motion.div>
        )}

        {/* Reminder confirmation */}
        {data.consentReminder && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
          </motion.div>
        )}

        {/* Church info */}
        {church && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="card p-5 flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-1 h-8 rounded-full flex-shrink-0"
                style={{ backgroundColor: 'var(--red)' }}
              />
              <div>
                <p className="text-overline" style={{ color: 'var(--gray-500)' }}>
                  Programação
                </p>
                <p style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{church.name}</p>
              </div>
            </div>

            {schedules.length > 0 && (
              <div className="flex flex-col gap-2">
                {schedules.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-small" style={{ color: 'var(--gray-600)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--gray-800)' }}>{s.day}</span>
                    <span>às {s.time}</span>
                    {s.description && <span style={{ color: 'var(--gray-400)' }}>— {s.description}</span>}
                  </div>
                ))}
              </div>
            )}

            {church.address_street && (
              <p className="text-small" style={{ color: 'var(--gray-500)' }}>
                📍 {[church.address_street, church.address_number, church.address_neighborhood].filter(Boolean).join(', ')}
              </p>
            )}
          </motion.div>
        )}

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="flex flex-col gap-3"
        >
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-full flex items-center justify-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C7.24 2 5 4.24 5 7c0 4.25 5 11 5 11s5-6.75 5-11c0-2.76-2.24-5-5-5z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Como Chegar
            </a>
          )}
          <button
            onClick={handleShare}
            className="btn btn-secondary btn-full flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M15 8a3 3 0 100-6 3 3 0 000 6zm-10 4a3 3 0 100-6 3 3 0 000 6zm10 4a3 3 0 100-6 3 3 0 000 6zm-10-9l10 4m-10 1l10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Compartilhar com Amigos
          </button>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-full flex items-center justify-center gap-2"
              style={{ 
                background: '#25D366', 
                color: 'white',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                padding: '0.875rem 1.75rem',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.062.522 4.004 1.438 5.701L.02 23.98l6.432-1.387A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.797 9.797 0 01-5.028-1.385l-.361-.215-3.735.805.828-3.631-.235-.374A9.789 9.789 0 012.182 12c0-5.418 4.4-9.818 9.818-9.818 5.417 0 9.818 4.4 9.818 9.818 0 5.417-4.401 9.818-9.818 9.818z"/>
              </svg>
              Falar com a Igreja
            </a>
          )}
        </motion.div>

        {/* Footer message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-small"
          style={{ color: 'var(--gray-400)' }}
        >
          Será uma alegria receber você. ✨
        </motion.p>
      </div>
    </div>
  )
}
