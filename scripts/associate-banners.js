const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function associateBanners() {
  const bannersDir = path.join(__dirname, '..', 'public', 'banners')
  const files = fs.readdirSync(bannersDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'))

  console.log(`Found ${files.length} banners. Fetching pastors...`)

  const { data: pastors, error: pastorsError } = await supabase.from('pastors').select('id, full_name, church_id')
  if (pastorsError) throw pastorsError

  const { data: campaign } = await supabase.from('campaigns').select('id').eq('slug', 'semana-esperanca-2026-rs').single()
  const campaignId = campaign.id

  let linkedCount = 0

  for (const file of files) {
    // Extract preacher name by removing extensions and "Pr. " or "Prof. "
    let preacherName = file.replace(/\.[^/.]+$/, "") // remove extension
    
    // Normalize both for comparison
    const normalize = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/pr\.\s*|prof\.\s*/g, "").trim()
    
    const targetName = normalize(preacherName)

    const pastor = pastors.find(p => {
      const dbName = normalize(p.full_name)
      // check if the file name is contained in the DB name or vice-versa
      return dbName.includes(targetName) || targetName.includes(dbName)
    })

    if (pastor) {
      console.log(`Linking banner "${file}" to church_id: ${pastor.church_id} (Pastor: ${pastor.full_name})`)
      
      await supabase.from('banners').delete().eq('church_id', pastor.church_id)

      const { error: bannerError } = await supabase
        .from('banners')
        .insert([{
          church_id: pastor.church_id,
          campaign_id: campaignId,
          name: `Banner ${pastor.full_name}`,
          image_mobile_url: `/banners/${file}`,
          image_desktop_url: `/banners/${file}`,
          display_order: 1,
          status: 'active'
        }])

      if (bannerError) {
        console.error(`Failed to insert banner for ${file}:`, bannerError)
      } else {
        linkedCount++
      }
    } else {
      console.log(`⚠️ No matching pastor found for banner: "${file}"`)
    }
  }

  console.log(`Successfully linked ${linkedCount} banners!`)
}

associateBanners()
