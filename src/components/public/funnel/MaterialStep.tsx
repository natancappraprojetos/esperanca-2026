'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { trackEvent } from '@/lib/tracking/events'
import type { DigitalMaterial, Campaign } from '@/types/database'
import type { FunnelData } from '../FunnelPage'

interface MaterialStepProps {
  material: DigitalMaterial | null
  onDownloadRequest: () => void
  onSkip: () => void
  data: FunnelData
}

export default function MaterialStep({ material, onDownloadRequest, onSkip, data }: MaterialStepProps) {
  useEffect(() => {
    if (material) {
      trackEvent('MaterialViewed', {
        campaign_id: data.campaign?.id,
        church_id: data.church?.id,
        material_id: material.id,
        session_token: data.sessionToken,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!material) {
      onSkip()
    }
  }, [material, onSkip])

  if (!material) {
    return null
  }

  function handleDownloadRequest() {
    trackEvent('MaterialDownloadStarted', {
      campaign_id: data.campaign?.id,
      material_id: material?.id,
      session_token: data.sessionToken,
    })
    onDownloadRequest()
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center" style={{ paddingTop: '4rem' }}>
      <div className="container-narrow py-12 flex flex-col gap-8">
        
        {/* Gift icon */}
        <div
          className="flex justify-center"
        >
          <div 
            className="flex items-center justify-center"
            style={{
              width: 88,
              height: 88,
              background: 'linear-gradient(135deg, var(--green-muted), rgba(34, 160, 91, 0.12))',
              borderRadius: '50%',
              fontSize: '2.5rem',
            }}
            role="img"
            aria-label="Presente"
          >
            🎁
          </div>
        </div>

        {/* Material offer */}
        <div
          className="material-offer"
        >
          <div className="relative z-10 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <p 
                className="text-overline"
                style={{ color: 'var(--green)' }}
              >
                {material.offer_headline || 'Um presente para você'}
              </p>
              <h2 className="text-heading-2" style={{ color: 'var(--gray-900)' }}>
                {material.name}
              </h2>
              {material.offer_text && (
                <p className="text-body" style={{ color: 'var(--gray-600)' }}>
                  {material.offer_text}
                </p>
              )}
            </div>

            {/* Book cover preview */}
            {material.cover_image_url && (
              <div 
                className="flex justify-start"
              >
                <div 
                  className="relative overflow-hidden"
                  style={{ 
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    width: 120,
                  }}
                >
                  <img
                    src={material.cover_image_url}
                    alt={`Capa do livro ${material.name}`}
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
              </div>
            )}

            {/* Features */}
            <div className="flex flex-col gap-2">
              {[
                '📖 Leitura digital — acesse no seu celular',
                '🆓 Completamente gratuito',
                '💚 Entrega imediata após o cadastro',
              ].map((item) => (
                <div 
                  key={item} 
                  className="flex items-center gap-2 text-small"
                  style={{ color: 'var(--gray-600)' }}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Green download button */}
            <button
              onClick={handleDownloadRequest}
              className="btn btn-download btn-full"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M10 14l-5-5 1.4-1.4L9 11.2V2h2v9.2l2.6-2.6L15 9l-5 5z" fill="currentColor"/>
                <path d="M3 16h14v2H3z" fill="currentColor"/>
              </svg>
              Baixar Meu Livro Digital
            </button>
          </div>
        </div>

        {/* Skip option */}
        <div
          className="text-center"
        >
          <button
            onClick={onSkip}
            className="text-small"
            style={{ 
              color: 'var(--gray-400)', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Continuar sem o livro
          </button>
        </div>
      </div>
    </div>
  )
}
