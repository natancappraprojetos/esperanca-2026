'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import type { Campaign, DigitalMaterial } from '@/types/database'
import type { FunnelData } from '../FunnelPage'

interface HeroStepProps {
  campaign: Campaign
  material: DigitalMaterial | null
  onStart: () => void
  data: FunnelData
}

export default function HeroStep({ campaign, material, onStart }: HeroStepProps) {
  const theme = campaign.theme || 'JESUS, NOSSA ESPERANÇA'
  const tagline = campaign.tagline || 'Uma semana para reencontrar a esperança.'
  const startDate = campaign.starts_at 
    ? new Date(campaign.starts_at + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
    : ''
  const endDate = campaign.ends_at 
    ? new Date(campaign.ends_at + 'T00:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  return (
    <div className="hero-section">
      {/* Background pattern */}
      <div className="hero-pattern" aria-hidden="true" />

      {/* Subtle top border accent */}
      <div 
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: 'var(--red)' }}
        aria-hidden="true"
      />

      <div className="container-narrow flex flex-col min-h-svh py-16 justify-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col gap-8"
        >
          {/* Campaign badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <span className="text-overline" style={{ color: 'var(--red)' }}>
              {campaign.name}
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            <h1 
              className="text-display"
              style={{ 
                color: 'var(--gray-900)',
                fontFamily: 'var(--font-serif)',
              }}
            >
              {theme.split(',').map((part, i) => (
                <span key={i}>
                  {i > 0 && <span style={{ color: 'var(--red)' }}>,</span>}
                  {i > 0 ? part : part}
                  {i < theme.split(',').length - 1 ? '' : ''}
                </span>
              ))}
            </h1>

            <div className="divider" style={{ width: 64, height: 2, backgroundColor: 'var(--red)' }} />

            <p 
              className="text-body-lg"
              style={{ color: 'var(--gray-600)', maxWidth: 480 }}
            >
              {tagline}
            </p>

            {startDate && endDate && (
              <p 
                className="text-small"
                style={{ color: 'var(--gray-400)', fontWeight: 500 }}
              >
                {startDate} a {endDate}
              </p>
            )}
          </motion.div>

          {/* CTA Block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-col gap-4"
          >
            <button
              onClick={onStart}
              className="btn btn-primary btn-lg"
              style={{ alignSelf: 'flex-start' }}
            >
              <span>Encontrar uma Igreja</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 10H16M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {material && (
              <p 
                className="text-small"
                style={{ color: 'var(--gray-500)' }}
              >
                <span style={{ color: 'var(--green)', fontWeight: 600 }}>🎁 Presente:</span>{' '}
                Receba gratuitamente o livro digital <em>{material.name}</em>
              </p>
            )}
          </motion.div>

          {/* Decorative divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="flex items-center gap-4 pt-4"
          >
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--gray-100)' }} />
            <p className="text-caption" style={{ color: 'var(--gray-400)', textAlign: 'center' }}>
              Há um lugar preparado para você.
            </p>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--gray-100)' }} />
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            {[
              { icon: '🏛️', text: 'Igrejas participantes' },
              { icon: '📍', text: 'Encontre a mais próxima' },
              { icon: '🤝', text: 'Entrada gratuita' },
            ].map((item) => (
              <div 
                key={item.text}
                className="flex items-center gap-2 text-caption"
                style={{ color: 'var(--gray-500)' }}
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom scroll hint */}
      <motion.div
        className="absolute bottom-8 left-0 right-0 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        aria-hidden="true"
      >
        <button
          onClick={onStart}
          className="flex flex-col items-center gap-1 text-caption"
          style={{ color: 'var(--gray-400)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <span>Começar</span>
          <motion.svg
            animate={{ y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            width="20" height="20" viewBox="0 0 20 20" fill="none"
          >
            <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </button>
      </motion.div>
    </div>
  )
}
