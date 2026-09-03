'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { trackEvent } from '@/lib/tracking/events'
import { normalizeWhatsapp, validateBrazilianWhatsapp } from '@/lib/utils/whatsapp'
import type { Campaign } from '@/types/database'
import type { FunnelData } from '../FunnelPage'

interface LeadFormStepProps {
  campaign: Campaign
  onSubmit: (data: Partial<FunnelData>) => void
  data: FunnelData
}

const schema = z.object({
  name: z.string()
    .min(2, 'Por favor, informe seu nome completo')
    .max(100, 'Nome muito longo'),
  whatsapp: z.string()
    .min(1, 'Por favor, informe seu WhatsApp')
    .refine(val => validateBrazilianWhatsapp(val), 'Número de WhatsApp inválido'),
  consentData: z.boolean().refine(v => v === true, {
    message: 'Você precisa aceitar a política de privacidade para continuar',
  }),
  consentReminder: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export default function LeadFormStep({ campaign, onSubmit, data }: LeadFormStepProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data.leadName || '',
      whatsapp: data.leadWhatsapp || '',
      consentData: false,
      consentReminder: false,
    },
  })

  useEffect(() => {
    trackEvent('LeadFormViewed', {
      campaign_id: campaign.id,
      church_id: data.church?.id,
      material_id: data.material?.id,
      session_token: data.sessionToken,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const nameValue = watch('name')
  const hasName = nameValue?.trim().length >= 2

  async function onFormSubmit(values: FormValues) {
    setSubmitting(true)
    setError(null)

    trackEvent('LeadFormStarted', {
      campaign_id: campaign.id,
      session_token: data.sessionToken,
    })

    try {
      const normalizedWhatsapp = normalizeWhatsapp(values.whatsapp)
      
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          whatsapp: normalizedWhatsapp,
          whatsapp_raw: values.whatsapp,
          campaign_id: campaign.id,
          church_id: data.church?.id || null,
          city_id: data.city?.id || null,
          neighborhood_id: data.neighborhood?.id || null,
          material_id: data.material?.id || null,
          church_assignment_method: data.assignmentMethod,
          consent_data: values.consentData,
          consent_reminder_whatsapp: values.consentReminder || false,
          utm_source: data.utmSource,
          utm_medium: data.utmMedium,
          utm_campaign: data.utmCampaign,
          utm_content: data.utmContent,
          utm_term: data.utmTerm,
          session_token: data.sessionToken,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Erro ao enviar seus dados. Tente novamente.')
      }

      const result = await res.json()

      trackEvent('LeadCompleted', {
        campaign_id: campaign.id,
        church_id: data.church?.id,
        city_id: data.city?.id,
        material_id: data.material?.id,
        session_token: data.sessionToken,
      })

      if (values.consentReminder) {
        trackEvent('ReminderOptIn', {
          campaign_id: campaign.id,
          session_token: data.sessionToken,
        })
      } else {
        trackEvent('ReminderOptOut', {
          campaign_id: campaign.id,
          session_token: data.sessionToken,
        })
      }

      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead')
      }

      onSubmit({
        leadName: values.name.trim(),
        leadWhatsapp: normalizedWhatsapp,
        consentData: values.consentData,
        consentReminder: values.consentReminder || false,
        leadId: result.leadId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col" style={{ paddingTop: '4rem' }}>
      <div className="container-narrow py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-8 bg-gray-900/90 backdrop-blur-2xl border border-gray-700/50 p-6 sm:p-10 rounded-[32px] shadow-2xl max-w-xl mx-auto"
        >
          {/* Header */}
          <div className="flex flex-col gap-2">
            <div 
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                background: 'linear-gradient(135deg, rgba(26, 122, 74, 0.2), rgba(34, 160, 91, 0.4))',
                borderRadius: '50%',
                fontSize: '1.5rem',
                marginBottom: '0.5rem',
                border: '1px solid rgba(34, 160, 91, 0.3)',
                boxShadow: '0 4px 20px rgba(26, 122, 74, 0.2)'
              }}
              role="img" aria-label="Livro"
            >
              📖
            </div>
            <h2 className="text-heading-2" style={{ color: 'var(--white)' }}>
              Seu livro está quase pronto.
            </h2>
            <p className="text-body" style={{ color: 'var(--gray-300)' }}>
              Informe seus dados para receber o{' '}
              <strong style={{ color: 'var(--white)' }}>
                {data.material?.name || 'livro digital'}
              </strong>{' '}
              gratuitamente.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            noValidate
            className="flex flex-col gap-6"
            aria-label="Formulário de cadastro"
          >
            {/* Name */}
            <div className="form-group">
              <label htmlFor="lead-name" className="form-label" style={{ color: 'var(--gray-200)' }}>
                Seu Nome
              </label>
              <input
                id="lead-name"
                type="text"
                className={`form-input ${errors.name ? 'error' : ''}`}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--white)', border: '1px solid var(--gray-700)' }}
                placeholder="Como você se chama?"
                autoComplete="given-name"
                {...register('name')}
              />
              {errors.name && (
                <span className="form-error" role="alert">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* WhatsApp */}
            <div className="form-group">
              <label htmlFor="lead-whatsapp" className="form-label" style={{ color: 'var(--gray-200)' }}>
                Seu WhatsApp
              </label>
              <input
                id="lead-whatsapp"
                type="tel"
                className={`form-input ${errors.whatsapp ? 'error' : ''}`}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--white)', border: '1px solid var(--gray-700)' }}
                placeholder="(51) 99999-9999"
                autoComplete="tel"
                inputMode="numeric"
                {...register('whatsapp')}
              />
              {errors.whatsapp && (
                <span className="form-error" role="alert">
                  {errors.whatsapp.message}
                </span>
              )}
              <p className="text-caption" style={{ color: 'var(--gray-400)' }}>
                Somente para envio do material. Não fazemos spam.
              </p>
            </div>

            {/* Reminder consent */}
            <div 
              className="p-5 flex flex-col gap-4 rounded-2xl"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--gray-700)' }}
              role="group"
              aria-labelledby="reminder-legend"
            >
              <p 
                id="reminder-legend"
                style={{ fontWeight: 600, color: 'var(--white)', fontSize: '0.9375rem' }}
              >
                {hasName ? `${nameValue.trim().split(' ')[0]}, ` : ''}Quer que a gente lembre você da programação?
              </p>

              <div className="radio-group">
                <label className="radio-option" style={{ color: 'var(--gray-200)' }}>
                  <input
                    type="radio"
                    value="yes"
                    className="radio-input"
                    {...register('consentReminder')}
                    onChange={() => {}}
                    onClick={() => {
                      const el = document.querySelector('input[name="consentReminder"][value="yes"]') as HTMLInputElement
                      if (el) el.checked = true
                      setValue('consentReminder', 'yes', { shouldValidate: true, shouldDirty: true })
                    }}
                  />
                  <span>Sim, quero receber lembretes pelo WhatsApp</span>
                </label>
                <label className="radio-option" style={{ color: 'var(--gray-200)' }}>
                  <input
                    type="radio"
                    value="no"
                    className="radio-input"
                    {...register('consentReminder')}
                    onChange={() => {}}
                    onClick={() => {
                      const el = document.querySelector('input[name="consentReminder"][value="no"]') as HTMLInputElement
                      if (el) el.checked = true
                      setValue('consentReminder', 'no', { shouldValidate: true, shouldDirty: true })
                    }}
                  />
                  <span>Não, obrigado</span>
                </label>
              </div>
            </div>

            {/* LGPD consent */}
            <div className="flex flex-col gap-3">
              <label className="checkbox-group">
                <input
                  id="consent-data"
                  type="checkbox"
                  className="checkbox-input"
                  {...register('consentData')}
                />
                <span className="checkbox-label">
                  Li e concordo com a{' '}
                  <a 
                    href="/politica-de-privacidade"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--red)', textDecoration: 'underline' }}
                  >
                    Política de Privacidade
                  </a>{' '}
                  e autorizo o tratamento dos meus dados pessoais para disponibilização do material solicitado.
                </span>
              </label>
              {errors.consentData && (
                <span className="form-error" role="alert">
                  {errors.consentData.message}
                </span>
              )}
            </div>

            {/* Global error */}
            {error && (
              <div 
                className="p-4 rounded-lg text-sm"
                role="alert"
                style={{ 
                  background: 'var(--red-muted)',
                  color: 'var(--red)',
                  border: '1px solid rgba(196,30,42,0.2)',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-download btn-full btn-lg"
              disabled={submitting}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="spinner" style={{ borderTopColor: 'white' }} />
                  <span>Enviando...</span>
                </div>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                    <path d="M10 14l-5-5 1.4-1.4L9 11.2V2h2v9.2l2.6-2.6L15 9l-5 5z" fill="currentColor"/>
                    <path d="M3 16h14v2H3z" fill="currentColor"/>
                  </svg>
                  Receber Meu Livro
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
