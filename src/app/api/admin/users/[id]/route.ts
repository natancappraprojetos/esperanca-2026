import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

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
    const { full_name, role, church_id, allowed_campaigns, password, status } = body

    if (!full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (role === 'church_admin' && !church_id) {
      return NextResponse.json({ error: 'Church ID is required for pastors' }, { status: 400 })
    }

    // Initialize Service Role Client for admin tasks
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Update auth user if password is provided
    if (password) {
      const { error: authError } = await adminAuthClient.auth.admin.updateUserById(id, {
        password: password
      })
      if (authError) {
        return NextResponse.json({ error: authError.message || 'Failed to update password' }, { status: 400 })
      }
    }

    // Update user profile
    const { error: profileError } = await adminAuthClient
      .from('user_profiles')
      .update({
        full_name,
        role,
        allowed_campaigns: allowed_campaigns || [],
        status: status || 'active'
      })
      .eq('id', id)

    if (profileError) {
      return NextResponse.json({ error: 'Failed to update user profile: ' + profileError.message }, { status: 400 })
    }

    // Handle pastor records
    if (role === 'church_admin') {
      // Check if pastor record exists
      const { data: existingPastor } = await adminAuthClient
        .from('pastors')
        .select('id')
        .eq('user_id', id)
        .maybeSingle()
      
      if (existingPastor) {
        // Update existing
        await adminAuthClient.from('pastors').update({ church_id }).eq('user_id', id)
      } else {
        // Fetch email to create
        const { data: userProfile } = await adminAuthClient.from('user_profiles').select('email').eq('id', id).single()
        if (userProfile) {
          await adminAuthClient.from('pastors').insert({
            user_id: id,
            full_name,
            email: userProfile.email,
            church_id,
            status: 'active'
          })
        }
      }
    } else {
      // If role changed away from church_admin, we could optionally delete or deactivate the pastor record
      await adminAuthClient.from('pastors').delete().eq('user_id', id)
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
