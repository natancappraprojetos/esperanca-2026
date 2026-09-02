/**
 * WhatsApp number utilities for Brazil
 * Handles various input formats and normalizes to E.164
 */

/**
 * Validates a Brazilian WhatsApp number
 * Accepts: (51) 99999-9999, 51999999999, 5199999-9999, etc.
 */
export function validateBrazilianWhatsapp(raw: string): boolean {
  if (!raw) return false
  const digits = raw.replace(/\D/g, '')
  
  // With country code (55): 13 digits (9-digit cell) or 12 digits (8-digit - legacy)
  if (digits.startsWith('55') && (digits.length === 13 || digits.length === 12)) return true
  
  // With DDD only: 11 digits (9-digit) or 10 digits (8-digit - some regions)
  if (!digits.startsWith('55') && (digits.length === 11 || digits.length === 10)) {
    const ddd = parseInt(digits.substring(0, 2))
    // Valid DDDs (11–99, excluding unused ranges)
    if (ddd >= 11 && ddd <= 99) return true
  }
  
  return false
}

/**
 * Normalizes WhatsApp number to: 5551999999999 (country code + DDD + 9-digit number)
 */
export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  
  if (digits.startsWith('55')) {
    // Already has country code
    if (digits.length === 12) {
      // 8-digit number — add 9 after DDD
      return digits.substring(0, 4) + '9' + digits.substring(4)
    }
    return digits
  }
  
  if (digits.length === 11) {
    // DDD + 9-digit number
    return '55' + digits
  }
  
  if (digits.length === 10) {
    // DDD + 8-digit number — add 9 after DDD
    return '55' + digits.substring(0, 2) + '9' + digits.substring(2)
  }
  
  return '55' + digits
}

/**
 * Format for display: (51) 99999-9999
 */
export function formatWhatsappDisplay(normalized: string): string {
  const digits = normalized.replace(/\D/g, '').replace(/^55/, '')
  if (digits.length === 11) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`
  }
  return normalized
}

/**
 * Detect device type from user agent
 */
export function detectDeviceType(userAgent?: string): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (!userAgent) return 'unknown'
  const ua = userAgent.toLowerCase()
  if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile/.test(ua)) return 'mobile'
  if (/tablet|ipad/.test(ua)) return 'tablet'
  if (/windows|macintosh|linux/.test(ua)) return 'desktop'
  return 'unknown'
}

/**
 * Generate a session token for funnel tracking
 */
export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const rand = typeof window !== 'undefined' && window.crypto 
    ? Array.from(window.crypto.getRandomValues(new Uint8Array(32)))
    : Array.from({ length: 32 }, () => Math.floor(Math.random() * 62))
  return rand.map(n => chars[n % chars.length]).join('')
}

/**
 * Parse UTM params from URL
 */
export function parseUTMParams(searchParams: URLSearchParams): Record<string, string | null> {
  return {
    utm_source: searchParams.get('utm_source'),
    utm_medium: searchParams.get('utm_medium'),
    utm_campaign: searchParams.get('utm_campaign'),
    utm_content: searchParams.get('utm_content'),
    utm_term: searchParams.get('utm_term'),
  }
}
