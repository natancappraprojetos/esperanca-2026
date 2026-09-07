'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import HeroStep from '@/components/public/funnel/HeroStep'
import CityStep from '@/components/public/funnel/CityStep'
import NeighborhoodStep from '@/components/public/funnel/NeighborhoodStep'
import ChurchStep from '@/components/public/funnel/ChurchStep'
import MaterialStep from '@/components/public/funnel/MaterialStep'
import LeadFormStep from '@/components/public/funnel/LeadFormStep'
import ConfirmationStep from '@/components/public/funnel/ConfirmationStep'
import { trackEvent, initializePixels } from '@/lib/tracking/events'
import type { City, Neighborhood, Church, Campaign, DigitalMaterial } from '@/types/database'

export type FunnelData = {
  city: City | null
  neighborhood: Neighborhood | null
  church: Church | null
  campaign: Campaign | null
  material: DigitalMaterial | null
  assignmentMethod: string | null
  // Lead data
  leadName: string
  leadWhatsapp: string
  consentData: boolean
  consentReminder: boolean
  leadId: string | null
  // Tracking
  churchPixels?: any[]
  // UTM (preserved from URL)
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  utmTerm: string | null
  sessionToken: string | null
}

export type FunnelStep = 
  | 'hero'
  | 'city'
  | 'neighborhood'
  | 'church'
  | 'material'
  | 'form'
  | 'confirmation'

const STEP_ORDER: FunnelStep[] = ['hero', 'city', 'neighborhood', 'church', 'material', 'form', 'confirmation']

function getStepIndex(step: FunnelStep) {
  return STEP_ORDER.indexOf(step)
}

interface FunnelPageProps {
  initialCity?: City
  initialChurch?: Church
  campaign: Campaign
  material: DigitalMaterial | null
  utmParams?: Record<string, string>
  sessionToken: string
}

export function FunnelPage({ 
  initialCity, 
  initialChurch, 
  campaign,
  material,
  utmParams = {},
  sessionToken
}: FunnelPageProps) {
  const [currentStep, setCurrentStep] = useState<FunnelStep>(
    initialChurch ? 'church' : initialCity ? 'neighborhood' : 'hero'
  )
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  
  const [data, setData] = useState<FunnelData>({
    city: initialCity || null,
    neighborhood: null,
    church: initialChurch || null,
    campaign,
    material,
    assignmentMethod: initialChurch ? 'direct' : null,
    leadName: '',
    leadWhatsapp: '',
    consentData: false,
    consentReminder: false,
    leadId: null,
    utmSource: utmParams.utm_source || null,
    utmMedium: utmParams.utm_medium || null,
    utmCampaign: utmParams.utm_campaign || null,
    utmContent: utmParams.utm_content || null,
    utmTerm: utmParams.utm_term || null,
    sessionToken,
  })

  useEffect(() => {
    trackEvent('PageView', { 
      campaign_id: campaign.id,
      city_id: initialCity?.id,
      church_id: initialChurch?.id,
      session_token: sessionToken,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update tracking pixels when church changes
  useEffect(() => {
    if (data.churchPixels && data.churchPixels.length > 0) {
      initializePixels(data.churchPixels)
    }
  }, [data.churchPixels])

  function goTo(step: FunnelStep, updatedData?: Partial<FunnelData>) {
    const currentIndex = getStepIndex(currentStep)
    const nextIndex = getStepIndex(step)
    setDirection(nextIndex > currentIndex ? 1 : -1)
    if (updatedData) {
      setData(prev => ({ ...prev, ...updatedData }))
    }
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const stepCount = STEP_ORDER.length
  const currentIndex = getStepIndex(currentStep)

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 40 : -40,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -40 : 40,
      opacity: 0,
    }),
  }

  return (
    <div className="funnel-wrapper min-h-screen text-gray-900 relative overflow-x-hidden">
      {/* Background Images */}
      <div className="fixed inset-0 z-0 hidden md:block">
        <Image
          src="/images/bg-desktop-2.jpg"
          alt="Background"
          fill
          priority
          quality={100}
          unoptimized
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>
      <div className="fixed inset-0 z-0 block md:hidden">
        <Image
          src="/images/bg-mobile-2.png"
          alt="Background"
          fill
          priority
          quality={100}
          unoptimized
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>
      
      {/* Content wrapper with z-index to sit above the fixed backgrounds */}
      <div className="relative z-10 min-h-screen flex flex-col">
      {/* Progress & Back logic kept separate from animations to avoid flashing */}
      
      {currentStep !== 'hero' && currentStep !== 'confirmation' && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="container-narrow h-16 flex items-center justify-between">
            <button
              onClick={() => {
                const idx = getStepIndex(currentStep)
                if (idx > 1) {
                  goTo(STEP_ORDER[idx - 1])
                } else {
                  goTo('hero')
                }
              }}
              className="text-primary font-medium flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span aria-hidden="true">←</span> Voltar
            </button>
            
            <div className="flex gap-1.5" aria-label="Progresso">
              {['neighborhood', 'church', 'material', 'form'].map((step, i) => {
                const isActive = getStepIndex(currentStep) >= getStepIndex(step as FunnelStep)
                return (
                  <div
                    key={step}
                    className="h-1.5 rounded-full transition-all duration-300"
                    style={{ 
                      width: isActive ? 24 : 8,
                      backgroundColor: isActive ? 'var(--red)' : 'var(--gray-200)'
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area without AnimatePresence to prevent flashing */}
      <div className="relative z-10 w-full min-h-screen">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-16 md:pt-0"
        >
          {currentStep === 'hero' && (
            <HeroStep
              campaign={campaign}
              material={material}
              onStart={() => goTo('city')}
              data={data}
            />
          )}
          {currentStep === 'city' && (
            <CityStep
              campaign={campaign}
              onSelect={(city) => goTo('neighborhood', { city })}
              data={data}
            />
          )}
          {currentStep === 'neighborhood' && (
            <NeighborhoodStep
              city={data.city!}
              campaign={campaign}
              onSelect={(neighborhood, church, method, pixels) => 
                goTo('church', { neighborhood, church, assignmentMethod: method, churchPixels: pixels })}
              data={data}
            />
          )}
          {currentStep === 'church' && (
            <ChurchStep
              church={data.church!}
              campaign={campaign}
              onContinue={() => goTo('material')}
              data={data}
            />
          )}
          {currentStep === 'material' && (
            <MaterialStep
              material={data.material}
              onDownloadRequest={() => goTo('form')}
              onSkip={() => goTo('confirmation')}
              data={data}
            />
          )}
          {currentStep === 'form' && (
            <LeadFormStep
              campaign={campaign}
              onSubmit={(leadData) => goTo('confirmation', leadData)}
              data={data}
            />
          )}
          {currentStep === 'confirmation' && (
            <ConfirmationStep
              data={data}
              campaign={campaign}
            />
          )}
        </motion.div>
      </div>
    </div>
    </div>
  )
}
