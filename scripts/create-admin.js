const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdmin() {
  const email = 'admin@evangelismo.app'
  const password = 'adminpassword123'
  
  console.log(`Creating user ${email}...`)
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) {
    console.error('Auth Error:', authError.message)
    return
  }

  const userId = authData.user.id
  console.log('User created:', userId)

  // Insert into user_profiles
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert([
      {
        id: userId,
        email,
        full_name: 'Admin Master',
        role: 'super_admin',
        organization_id: '00000000-0000-0000-0000-000000000001',
        status: 'active'
      }
    ])

  if (profileError) {
    console.error('Profile Error:', profileError.message)
    return
  }
  
  console.log('Admin user created successfully! Login: ' + email + ' / ' + password)
}

createAdmin()
