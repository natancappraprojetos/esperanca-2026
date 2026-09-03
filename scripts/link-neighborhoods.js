const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function linkNeighborhoods() {
  console.log('Fetching churches and neighborhoods...')
  
  // 1. Get all churches
  const { data: churches, error: churchesError } = await supabase
    .from('churches')
    .select('id, name, address_neighborhood, city_id')

  if (churchesError) {
    console.error('Error fetching churches:', churchesError)
    return
  }

  // 2. Get all neighborhoods
  const { data: neighborhoods, error: neighborhoodsError } = await supabase
    .from('neighborhoods')
    .select('id, name, city_id')

  if (neighborhoodsError) {
    console.error('Error fetching neighborhoods:', neighborhoodsError)
    return
  }

  let linkedCount = 0

  for (const church of churches) {
    if (!church.address_neighborhood) continue

    // Normalize both strings to ignore accents and case
    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
    const targetName = normalize(church.address_neighborhood)

    const matchingNeighborhood = neighborhoods.find(n => 
      n.city_id === church.city_id && normalize(n.name) === targetName
    )

    if (matchingNeighborhood) {
      console.log(`Linking church "${church.name}" to neighborhood "${matchingNeighborhood.name}"`)
      
      const { error: insertError } = await supabase
        .from('church_neighborhoods')
        .upsert([{
          church_id: church.id,
          neighborhood_id: matchingNeighborhood.id,
          assignment_type: 'manual',
          priority: 1
        }], { onConflict: 'church_id, neighborhood_id' })

      if (insertError) {
        console.error('Failed to link:', insertError)
      } else {
        linkedCount++
      }
    }
  }

  console.log(`\nSuccess! Linked ${linkedCount} churches to their local neighborhoods.`)
}

linkNeighborhoods()
