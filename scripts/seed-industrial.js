const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  const { data: city, error: cityErr } = await supabase
    .from('cities')
    .select('id')
    .ilike('name', 'Novo Hamburgo')
    .single()
    
  if (cityErr || !city) {
    console.error('City not found', cityErr)
    return
  }
  
  console.log('Novo Hamburgo ID:', city.id)
  
  const { data, error } = await supabase
    .from('neighborhoods')
    .insert({
      city_id: city.id,
      name: 'Industrial',
      name_normalized: 'industrial',
      status: 'active'
    })
    .select()
    
  if (error) {
    console.error('Error inserting:', error)
  } else {
    console.log('Inserted neighborhood:', data)
  }
}

run()
