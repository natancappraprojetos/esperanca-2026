import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    // 1. Verify caller has permission
    const serverSupabase = await createServerClient()
    const { data: { user } } = await serverSupabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await serverSupabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin_general')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { email, password, full_name, role, church_id } = body

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (role === 'church_admin' && !church_id) {
      return NextResponse.json({ error: 'Church ID is required for pastors' }, { status: 400 })
    }

    // 2. Initialize Service Role Client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 3. Create auth user
    const { data: authData, error: authError } = await adminAuthClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Failed to create user' }, { status: 400 })
    }

    const newUserId = authData.user.id

    // 4. Create user profile
    const { error: profileError } = await adminAuthClient
      .from('user_profiles')
      .insert({
        id: newUserId,
        email,
        full_name,
        role,
        status: 'active'
      })

    if (profileError) {
      // Rollback user creation
      await adminAuthClient.auth.admin.deleteUser(newUserId)
      return NextResponse.json({ error: 'Failed to create user profile: ' + profileError.message }, { status: 400 })
    }

    // 5. If pastor, create pastor record
    if (role === 'church_admin') {
      const { error: pastorError } = await adminAuthClient
        .from('pastors')
        .insert({
          user_id: newUserId,
          full_name,
          email,
          church_id,
          status: 'active'
        })

      if (pastorError) {
        // We log but don't fail the whole request, they can fix it manually
        console.error('Failed to create pastor record:', pastorError)
      }
    }

    return NextResponse.json({ success: true, user: { id: newUserId, email, full_name, role } })

  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
