'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import HeroStep from '@/components/public/funnel/HeroStep'
import CityStep from '@/components/public/funnel/CityStep'
import NeighborhoodStep from '@/components/public/funnel/NeighborhoodStep'
import ChurchStep from '@/components/public/funnel/ChurchStep'
import MaterialStep from '@/components/public/funnel/MaterialStep'
import LeadFormStepES from '@/components/public/funnel/LeadFormStepES'
import ConfirmationStepES from '@/components/public/funnel/ConfirmationStepES'
import { trackEvent, initializePixels } from '@/lib/tracking/events'
import type { City, Neighborhood, Church, Campaign, DigitalMaterial } from '@/types/database'
import type { FunnelData, FunnelStep, FunnelModel } from './FunnelPage'

export const MODELS_ES: Record<FunnelModel, FunnelStep[]> = {
  'model-1': ['hero', 'city', 'neighborhood', 'church', 'form', 'confirmation'],
  'model-2': ['hero', 'form', 'confirmation', 'city', 'neighborhood', 'church'],
  'model-3': ['hero', 'form', 'confirmation']
}

interface FunnelPageESProps {
  initialCity?: City
  initialChurch?: Church
  campaign: Campaign
  material: DigitalMaterial | null
  utmParams?: Record<string, string>
  sessionToken: string
  globalPixels?: any[]
  churchPixels?: any[]
}

export function FunnelPageES({ 
  initialCity, 
  initialChurch, 
  campaign,
  material,
  utmParams = {},
  sessionToken,
  globalPixels = [],
  churchPixels = []
}: FunnelPageESProps) {
  const activeModel = ((campaign.settings as any)?.funnel_model || 'model-1') as FunnelModel
  const stepOrder = MODELS_ES[activeModel] || MODELS_ES['model-1']

  function getStepIndex(step: FunnelStep) {
    return stepOrder.indexOf(step)
  }

  const [currentStep, setCurrentStep] = useState<FunnelStep>(
    initialChurch ? 'church' : initialCity ? 'neighborhood' : 'hero'
  )
  const [direction, setDirection] = useState(1)
  
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
    churchPixels: churchPixels.length > 0 ? churchPixels : undefined,
    utmSource: utmParams.utm_source || null,
    utmMedium: utmParams.utm_medium || null,
    utmCampaign: utmParams.utm_campaign || null,
    utmContent: utmParams.utm_content || null,
    utmTerm: utmParams.utm_term || null,
    sessionToken,
  })

  useEffect(() => {
    if (globalPixels.length > 0) {
      initializePixels(globalPixels)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    trackEvent('PageView', { 
      campaign_id: campaign.id,
      city_id: initialCity?.id,
      church_id: initialChurch?.id,
      session_token: sessionToken,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (data.churchPixels && data.churchPixels.length > 0) {
      initializePixels(data.churchPixels)
    }
  }, [data.churchPixels])

  function goToNext(updatedData?: Partial<FunnelData>) {
    const currentIndex = getStepIndex(currentStep)
    if (currentIndex >= 0 && currentIndex < stepOrder.length - 1) {
      goTo(stepOrder[currentIndex + 1], updatedData)
    }
  }

  function goTo(step: FunnelStep, updatedData?: Partial<FunnelData>) {
    const currentIndex = getStepIndex(currentStep)
    const nextIndex = getStepIndex(step)
    setDirection(nextIndex > currentIndex ? 1 : -1)
    
    const newData = { ...data, ...updatedData }
    
    if (step === 'church' || step === 'material' || step === 'form' || step === 'confirmation') {
      const churchSlug = newData.church?.slug
      if (churchSlug) {
        const newUrl = `/igreja/${churchSlug}`
        if (window.location.pathname !== newUrl) {
          window.history.pushState(null, '', newUrl)
        }
      }
    }

    if (updatedData) {
      setData(newData)
    }
    setCurrentStep(step)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      
      <div className="relative z-10 min-h-screen flex flex-col">
      
      {currentStep !== 'hero' && currentStep !== 'confirmation' && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="container-narrow h-16 flex items-center justify-between">
            <button
              onClick={() => {
                const idx = getStepIndex(currentStep)
                if (idx > 1) {
                  goTo(stepOrder[idx - 1])
                } else {
                  goTo('hero')
                }
              }}
              className="text-primary font-medium flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span aria-hidden="true">←</span> Volver
            </button>
            
            <div className="flex gap-1.5" aria-label="Progreso">
              {stepOrder.filter(s => s !== 'hero' && s !== 'confirmation').map((step, i) => {
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

      <div className="relative z-10 w-full min-h-screen">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="pt-16 md:pt-0 w-full flex flex-col min-h-screen"
        >
          {currentStep === 'hero' && (
            <HeroStep
              campaign={campaign}
              material={material}
              onStart={() => goToNext()}
              data={data}
            />
          )}
          {currentStep === 'city' && (
            <CityStep
              campaign={campaign}
              onSelect={(city) => goToNext({ city })}
              data={data}
            />
          )}
          {currentStep === 'neighborhood' && (
            <NeighborhoodStep
              city={data.city!}
              campaign={campaign}
              onSelect={(neighborhood, church, method, pixels) => 
                goToNext({ neighborhood, church, assignmentMethod: method, churchPixels: pixels })}
              data={data}
            />
          )}
          {currentStep === 'church' && (
            <ChurchStep
              church={data.church!}
              campaign={campaign}
              onContinue={() => goToNext()}
              data={data}
            />
          )}
          {currentStep === 'material' && (
            <MaterialStep
              material={data.material}
              onDownloadRequest={() => goToNext()}
              onSkip={() => goToNext()}
              data={data}
            />
          )}
          {currentStep === 'form' && (
            <LeadFormStepES
              campaign={campaign}
              onSubmit={(leadData) => goToNext(leadData)}
              data={data}
            />
          )}
          {currentStep === 'confirmation' && (
            <ConfirmationStepES
              data={data}
              campaign={campaign}
              onContinue={getStepIndex('confirmation') < stepOrder.length - 1 ? () => goToNext() : undefined}
              onChangeChurch={(newChurch) => setData(prev => ({ ...prev, church: newChurch }))}
            />
          )}
        </motion.div>
      </div>
    </div>
    </div>
  )
}
