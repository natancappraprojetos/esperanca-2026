import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden. Only super_admin can edit campaigns.' }, { status: 403 })
    }

    const body = await req.json()
    const { name, tagline, description, starts_at, ends_at, status } = body

    if (!name || !starts_at || !ends_at) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update({
        name,
        tagline,
        description,
        starts_at,
        ends_at,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, campaign: data })
  } catch (error: any) {
    console.error('Error updating campaign:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
