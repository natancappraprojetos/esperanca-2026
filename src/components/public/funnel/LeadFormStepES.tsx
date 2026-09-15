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

interface LeadFormStepESProps {
  campaign: Campaign
  onSubmit: (data: Partial<FunnelData>) => void
  data: FunnelData
}

const schema = z.object({
  name: z.string()
    .min(2, 'Por favor, introduce tu nombre completo')
    .max(100, 'Nombre muy largo'),
  whatsapp: z.string()
    .min(1, 'Por favor, introduce tu WhatsApp')
    .refine(val => validateBrazilianWhatsapp(val), 'Número de WhatsApp inválido'),
  neighborhoodText: z.string().optional(),
  consentData: z.boolean().refine(v => v === true, {
    message: 'Debes aceptar la política de privacidad para continuar',
  }),
  consentReminder: z.enum(['yes', 'no']).optional(),
})

function formatWhatsApp(value: string) {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

type FormValues = z.infer<typeof schema>

export default function LeadFormStepES({ campaign, onSubmit, data }: LeadFormStepESProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data.leadName || '',
      whatsapp: data.leadWhatsapp || '',
      neighborhoodText: '',
      consentData: false,
      consentReminder: 'yes',
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
    if (!data.neighborhood && (!values.neighborhoodText || values.neighborhoodText.trim().length < 2)) {
      setError('Por favor, introduce tu barrio.')
      return
    }

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
          neighborhood_id: (data.neighborhood?.id && !data.neighborhood.id.startsWith('custom-')) ? data.neighborhood.id : null,
          neighborhood_name: data.neighborhood?.name || values.neighborhoodText?.trim() || null,
          material_id: data.material?.id || null,
          church_assignment_method: data.assignmentMethod,
          consent_data: values.consentData,
          consent_reminder_whatsapp: values.consentReminder === 'yes',
          utm_source: data.utmSource,
          utm_medium: data.utmMedium,
          utm_campaign: data.utmCampaign,
          utm_content: data.utmContent,
          utm_term: data.utmTerm,
          session_token: data.sessionToken,
        }),
      })

      if (!res.ok) {
        let errMessage = 'Error al enviar tus datos. Inténtalo de nuevo.'
        try {
          const err = await res.json()
          errMessage = err.error || errMessage
        } catch {
          // JSON parse failed, keep default message
        }
        throw new Error(errMessage)
      }

      let result
      try {
        result = await res.json()
      } catch {
        result = { leadId: 'unknown' }
      }

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
        consentReminder: values.consentReminder === 'yes',
        leadId: result.leadId,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ha ocurrido un error. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center w-full px-8 sm:px-12 md:px-16 py-10 sm:py-16">
      <div className="w-full max-w-[480px] mx-auto mb-6">
        <div 
          className="flex flex-col gap-6 md:gap-8 bg-white/60 backdrop-blur-2xl border border-gray-100/50 px-8 sm:px-14 py-10 sm:py-12 rounded-[32px] shadow-2xl w-full"
        >
          {/* Header */}
          <div className="flex flex-col gap-1.5 text-center">
            <h2 className="text-xl sm:text-2xl font-serif tracking-tight leading-tight" style={{ color: 'var(--gray-900)' }}>
              Tu libro está casi listo.
            </h2>
            <p className="text-xs sm:text-sm" style={{ color: 'var(--gray-600)' }}>
              Introduce tus datos para recibir el{' '}
              <strong style={{ color: 'var(--gray-900)' }}>
                {data.material?.name || 'libro digital'}
              </strong>{' '}
              gratis.
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onFormSubmit)}
            noValidate
            className="flex flex-col gap-4"
            aria-label="Formulario de registro"
          >
            {/* Name */}
            <div className="form-group">
              <label htmlFor="lead-name" className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gray-700)' }}>
                Tu Nombre
              </label>
              <input
                id="lead-name"
                type="text"
                className={`form-input text-sm py-2 px-3 ${errors.name ? 'error' : ''}`}
                style={{ backgroundColor: 'var(--white)', color: 'var(--gray-900)', border: '1px solid var(--gray-200)' }}
                placeholder="¿Cómo te llamas?"
                autoComplete="given-name"
                {...register('name')}
              />
              {errors.name && (
                <span className="form-error text-xs mt-1" role="alert">
                  {errors.name.message}
                </span>
              )}
            </div>

            {/* WhatsApp */}
            <div className="form-group">
              <label htmlFor="lead-whatsapp" className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gray-700)' }}>
                Tu WhatsApp
              </label>
              <input
                id="lead-whatsapp"
                type="tel"
                className={`form-input text-sm py-2 px-3 ${errors.whatsapp ? 'error' : ''}`}
                style={{ backgroundColor: 'var(--white)', color: 'var(--gray-900)', border: '1px solid var(--gray-200)' }}
                placeholder="(51) 99999-9999"
                autoComplete="tel"
                inputMode="numeric"
                {...register('whatsapp')}
                onChange={(e) => {
                  const formatted = formatWhatsApp(e.target.value)
                  e.target.value = formatted
                  setValue('whatsapp', formatted, { shouldValidate: true })
                }}
              />
              {errors.whatsapp && (
                <span className="form-error text-xs mt-1" role="alert">
                  {errors.whatsapp.message}
                </span>
              )}
              <p className="text-[11px] mt-1" style={{ color: 'var(--gray-500)' }}>
                Solo para el envío del material. No enviamos spam.
              </p>
            </div>

            {/* Bairro */}
            {!data.neighborhood && (
              <div className="form-group">
                <label htmlFor="lead-neighborhood" className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--gray-700)' }}>
                  ¿Cuál es tu barrio?
                </label>
                <input
                  id="lead-neighborhood"
                  type="text"
                  className={`form-input text-sm py-2 px-3 ${error === 'Por favor, introduce tu barrio.' ? 'error' : ''}`}
                  style={{ backgroundColor: 'var(--white)', color: 'var(--gray-900)', border: '1px solid var(--gray-200)' }}
                  placeholder="Ej: Centro"
                  autoComplete="address-level2"
                  {...register('neighborhoodText')}
                />
              </div>
            )}

            {/* Reminder consent */}
            <div 
              className="flex flex-col gap-2.5 py-1"
              role="group"
              aria-labelledby="reminder-legend"
            >
              <p 
                id="reminder-legend"
                style={{ fontWeight: 600, color: 'var(--gray-900)', fontSize: '0.8125rem' }}
              >
                {hasName ? `${nameValue.trim().split(' ')[0]}, ` : ''}¿Quieres que te recordemos la programación?
              </p>

              <div className="radio-group text-xs">
                <label className="radio-option" style={{ color: 'var(--gray-700)' }}>
                  <input
                    type="radio"
                    value="yes"
                    className="radio-input"
                    {...register('consentReminder')}
                  />
                  <span>Sí, quiero recibir recordatorios por WhatsApp</span>
                </label>
                <label className="radio-option" style={{ color: 'var(--gray-700)' }}>
                  <input
                    type="radio"
                    value="no"
                    className="radio-input"
                    {...register('consentReminder')}
                  />
                  <span>No, gracias</span>
                </label>
              </div>
            </div>

            {/* LGPD consent */}
            <div className="flex flex-col gap-2">
              <label className="checkbox-group text-xs">
                <input
                  id="consent-data"
                  type="checkbox"
                  className="checkbox-input"
                  {...register('consentData')}
                />
                <span className="checkbox-label" style={{ color: 'var(--gray-600)' }}>
                  He leído y acepto la{' '}
                  <a 
                    href="/politica-de-privacidade"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--red)', textDecoration: 'underline' }}
                  >
                    Política de Privacidad
                  </a>{' '}
                  y autorizo el tratamiento de mis datos.
                </span>
              </label>
              {errors.consentData && (
                <span className="form-error text-[11px] mt-1" role="alert">
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
                  Recibir Mi Libro
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
