'use client'

/**
 * Client-side event tracking module
 * Sends events to: Meta Pixel, GA4, GTM dataLayer, and our own funnel_events table
 */

export type TrackingEventName = 
  | 'PageView'
  | 'CitySelected'
  | 'NeighborhoodSearch'
  | 'NeighborhoodSelected'
  | 'ChurchMatched'
  | 'ChurchViewed'
  | 'InviteSaved'
  | 'InviteShared'
  | 'MaterialViewed'
  | 'MaterialDownloadStarted'
  | 'LeadFormViewed'
  | 'LeadFormStarted'
  | 'LeadSubmitted'
  | 'LeadCompleted'
  | 'ReminderOptIn'
  | 'ReminderOptOut'
  | 'DownloadCompleted'

export type EventProperties = Record<string, string | number | boolean | null | undefined>

/**
 * Main event tracking function
 * Fires to all configured tracking systems
 */
export function trackEvent(eventName: TrackingEventName, properties: EventProperties = {}) {
  // 1. Meta Pixel (fbq)
  try {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      // Map our events to Meta standard events where applicable
      const metaEvent = META_EVENT_MAP[eventName]
      if (metaEvent) {
        ;(window as any).fbq('track', metaEvent, properties)
      } else {
        ;(window as any).fbq('trackCustom', eventName, properties)
      }
    }
  } catch { /* Meta Pixel not loaded */ }

  // 2. Google Analytics 4 (gtag)
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', eventName, {
        event_category: 'funnel',
        ...properties,
      })
    }
  } catch { /* GA4 not loaded */ }

  // 3. GTM dataLayer
  try {
    if (typeof window !== 'undefined') {
      const dataLayer = (window as any).dataLayer || []
      ;(window as any).dataLayer = dataLayer
      dataLayer.push({
        event: eventName,
        ...properties,
      })
    }
  } catch { /* GTM not loaded */ }

  // 4. Our own analytics (async, non-blocking)
  sendToOwnAnalytics(eventName, properties).catch(() => {})
}

async function sendToOwnAnalytics(eventName: string, properties: EventProperties) {
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_name: eventName, ...properties }),
      // Non-blocking — don't await the response
      keepalive: true,
    })
  } catch { /* ignore errors in event tracking */ }
}

// Map our events to Meta standard events
const META_EVENT_MAP: Partial<Record<TrackingEventName, string>> = {
  PageView: 'PageView',
  LeadCompleted: 'Lead',
  MaterialDownloadStarted: 'InitiateCheckout',
  LeadFormStarted: 'AddToCart',
  DownloadCompleted: 'Purchase',
}

/**
 * Initialize tracking pixels loaded from admin config
 * Called once on page load with the pixel configs from the DB
 */
export function initializePixels(pixels: PixelConfig[]) {
  if (typeof window === 'undefined') return

  pixels.forEach(pixel => {
    switch (pixel.pixel_type) {
      case 'meta':
        loadMetaPixel(pixel.pixel_id)
        break
      case 'ga4':
        loadGA4(pixel.pixel_id)
        break
      case 'gtm':
        loadGTM(pixel.pixel_id)
        break
      case 'google_ads':
        loadGoogleAds(pixel.pixel_id)
        break
    }
  })
}

export interface PixelConfig {
  pixel_type: 'meta' | 'ga4' | 'gtm' | 'google_ads' | 'custom'
  pixel_id: string
  config?: Record<string, unknown>
}

function loadMetaPixel(pixelId: string) {
  if ((window as any).__meta_pixels_loaded?.includes(pixelId)) return
  ;(window as any).__meta_pixels_loaded = [...((window as any).__meta_pixels_loaded || []), pixelId]

  const script = `
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
    document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
  `
  const el = document.createElement('script')
  el.innerHTML = script
  document.head.appendChild(el)
}

function loadGA4(measurementId: string) {
  if ((window as any).__ga4_loaded?.includes(measurementId)) return
  ;(window as any).__ga4_loaded = [...((window as any).__ga4_loaded || []), measurementId]

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script)

  const init = document.createElement('script')
  init.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${measurementId}');
  `
  document.head.appendChild(init)
}

function loadGTM(containerId: string) {
  if ((window as any).__gtm_loaded?.includes(containerId)) return
  ;(window as any).__gtm_loaded = [...((window as any).__gtm_loaded || []), containerId]

  const script = document.createElement('script')
  script.innerHTML = `
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer','${containerId}');
  `
  document.head.appendChild(script)
}

function loadGoogleAds(conversionId: string) {
  // Google Ads uses gtag — reuse GA4 init
  if (!(window as any).gtag) {
    loadGA4(conversionId)
  } else {
    ;(window as any).gtag('config', conversionId)
  }
}
