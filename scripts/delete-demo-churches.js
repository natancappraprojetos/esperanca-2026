const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  console.log('Fetching all demo churches...')
  
  const { data: churches, error } = await supabase.from('churches').select('id, name, is_demo')
  
  if (error) {
    console.error(error)
    return
  }
  
  const demoChurches = churches.filter(c => c.is_demo || c.name.toLowerCase().includes('demo'))
  console.log('Found demo churches:', demoChurches)
  
  if (demoChurches.length > 0) {
    const ids = demoChurches.map(c => c.id)
    console.log('Deleting related events...')
    await supabase.from('funnel_events').delete().in('church_id', ids)
    await supabase.from('banners').delete().in('church_id', ids)
    await supabase.from('campaign_churches').delete().in('church_id', ids)
    await supabase.from('church_neighborhoods').delete().in('church_id', ids)
    
    console.log('Deleting demo churches...')
    const { error: delErr } = await supabase.from('churches').delete().in('id', ids)
    if (delErr) console.error('Error deleting:', delErr)
    else console.log('Deleted successfully.')
  }
}

run()
