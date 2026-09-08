import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin_general')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch churches linked to this campaign
    const { data: campaignChurches, error } = await supabase
      .from('campaign_churches')
      .select(`
        church_id,
        churches (
          id,
          name,
          address_neighborhood,
          cities (
            name,
            state_id
          )
        )
      `)
      .eq('campaign_id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const churches = campaignChurches.map(cc => cc.churches).filter(Boolean)

    return NextResponse.json({ success: true, churches })
  } catch (error: any) {
    console.error('Error fetching campaign churches:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
