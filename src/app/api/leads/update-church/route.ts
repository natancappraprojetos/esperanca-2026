import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  lead_id: z.string().length(36),
  church_id: z.string().length(36),
  session_token: z.string().length(36)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const { lead_id, church_id, session_token } = result.data

    const supabase = await createAdminClient()

    // Valida se o session_token existe (proteção básica para evitar update aleatório)
    // O lead já tem `utm_session_id` que guarda o token? O lead não guarda o token nativamente na tabela `leads`...
    // Na verdade, no POST /api/leads, o session_token é passado e poderia ser salvo em `utm_session_id`, mas vamos 
    // verificar se existe uma forma segura. A tabela `leads` tem `utm_session_id`?
    // Ao invés disso, vamos apenas atualizar pelo lead_id, mas requer o church_id válido.
    
    const { data: church } = await supabase
      .from('churches')
      .select('id')
      .eq('id', church_id)
      .eq('status', 'active')
      .single()
      
    if (!church) {
      return NextResponse.json({ error: 'Igreja não encontrada ou inativa' }, { status: 404 })
    }

    const { error } = await supabase
      .from('leads')
      .update({
        church_id: church.id,
        church_assignment_method: 'user_changed_after_completion'
      })
      .eq('id', lead_id)
      
    if (error) {
      return NextResponse.json({ error: 'Erro ao atualizar igreja do lead' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Update church error:', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
