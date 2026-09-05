import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Auth check using standard server client
    const cookieStore = await cookies()
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Role check
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Apenas administradores podem excluir leads' }, { status: 403 })
    }

    // We use admin client to bypass any RLS on delete if necessary
    const adminSupabase = await createAdminClient()
    
    // Deleting a lead will cascade delete contacts and lead_consents if foreign keys are set up correctly.
    // If not, we should delete consents first, then lead, then contact (if contact not shared).
    // Let's just delete the lead first. If it fails due to FK, we'll see it in the error.
    
    const { error } = await adminSupabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete lead error:', error)
      return NextResponse.json({ error: 'Erro ao excluir o lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete route error:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
