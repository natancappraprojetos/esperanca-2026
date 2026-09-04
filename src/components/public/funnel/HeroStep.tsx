'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import type { Campaign, Material } from '@/types/database'

interface HeroStepProps {
  campaign: Campaign
  material: Material | null
  onStart: () => void
}

export default function HeroStep({ campaign, material, onStart }: HeroStepProps) {
  useEffect(() => {
    // trackEvent('HeroViewed', { campaign_id: campaign.id })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="container-narrow flex flex-col h-svh w-full relative overflow-hidden">
      
      {/* Flex spacer to push the CTA block below the center logo */}
      <div className="flex-grow" />

      {/* CTA Block */}
      <div className="flex flex-col gap-4 items-center w-full px-4 mb-[15vh] md:mb-[20vh] mx-auto max-w-sm relative z-10">
        <button
          onClick={onStart}
          className="btn btn-primary btn-lg flex items-center justify-center gap-2 w-full"
        >
          <span className="text-center font-semibold">Veja a programação mais perto de você</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
            <path d="M4 10H16M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {material && (
          <p 
            className="text-sm"
            style={{ color: 'var(--gray-300)', textAlign: 'center' }}
          >
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>🎁 Presente:</span>{' '}
            Receba gratuitamente o livro digital <em>{material.name}</em>
          </p>
        )}
      </div>

      {/* Footer / Info / Decorative divider */}
      <div className="absolute bottom-6 left-0 right-0 px-4 z-10">
        <div className="flex items-center gap-4 max-w-sm mx-auto opacity-70">
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--white)', opacity: 0.2 }} />
          <p className="text-caption" style={{ color: 'var(--gray-300)' }}>
            Há um lugar preparado para você.
          </p>
          <div style={{ flex: 1, height: 1, backgroundColor: 'var(--white)', opacity: 0.2 }} />
        </div>
      </div>
    </div>
  )
}
