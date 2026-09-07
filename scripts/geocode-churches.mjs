// geocode-churches.mjs
// Run: node scripts/geocode-churches.mjs
// Geocodifies ALL active churches via Nominatim and saves lat/lon to Supabase.

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = readFileSync(join(__dirname, '../.env.local'), 'utf8')

function getEnvVar(key) {
  const line = env.split('\n').find(l => l.startsWith(key + '='))
  return line ? line.split('=').slice(1).join('=').trim() : null
}

const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL')
const SUPABASE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function geocodeAddress(query) {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('countrycodes', 'br')
  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'EvangelismoApp/1.0 (church-geocoding-script)',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      }
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data || data.length === 0) return null
    return { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon), formatted: data[0].display_name }
  } catch { return null }
}

async function run() {
  console.log('Fetching churches from Supabase...')
  const { data: churches, error } = await supabase.from('churches').select('id, name, latitude, longitude, address_street, address_number, address_neighborhood, address_cep, geocode_status, city_id').eq('status', 'active')
  if (error) { console.error('Error:', error); process.exit(1) }
  const { data: cities } = await supabase.from('cities').select('id, name, states(uf)')
  const cityMap = {}
  cities.forEach(c => { cityMap[c.id] = { name: c.name, uf: c.states?.uf || 'RS' } })
  console.log('Processing ' + churches.length + ' churches...\n')
  let success = 0, failed = 0, skipped = 0
  for (let i = 0; i < churches.length; i++) {
    const church = churches[i]
    const city = cityMap[church.city_id]
    if (!city || (!church.address_street && !church.address_neighborhood)) { skipped++; continue }
    const parts = []
    if (church.address_street) parts.push(church.address_street.trim())
    if (church.address_neighborhood) parts.push(church.address_neighborhood.trim())
    parts.push(city.name, city.uf, 'Brasil')
    const query = parts.join(', ')
    console.log('[' + (i+1) + '/' + churches.length + '] ' + church.name)
    console.log('   ' + query)
    let coords = await geocodeAddress(query)
    if (!coords && church.address_neighborhood) {
      await sleep(1100)
      const fallbackQuery = church.address_neighborhood + ', ' + city.name + ', ' + city.uf + ', Brasil'
      coords = await geocodeAddress(fallbackQuery)
      if (coords) console.log('   (fallback used)')
    }
    if (coords) {
      await supabase.from('churches').update({ latitude: coords.latitude, longitude: coords.longitude, geocode_status: 'ok', geocode_provider: 'nominatim', geocode_formatted_address: coords.formatted.substring(0, 500), geocoded_at: new Date().toISOString(), needs_geocode: false }).eq('id', church.id)
      await supabase.rpc('update_church_location', { p_church_id: church.id, p_longitude: coords.longitude, p_latitude: coords.latitude })
      console.log('   OK lat:' + coords.latitude + ' lon:' + coords.longitude)
      success++
    } else {
      await supabase.from('churches').update({ geocode_status: 'failed', needs_geocode: true }).eq('id', church.id)
      console.log('   FAILED - could not geocode')
      failed++
    }
    if (i < churches.length - 1) await sleep(1100)
  }
  console.log('\n=== RESULTS ===')
  console.log('Success: ' + success)
  console.log('Failed:  ' + failed)
  console.log('Skipped: ' + skipped)
}

run().catch(console.error)
