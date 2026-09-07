import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  lead_id: z.string().uuid(),
  church_id: z.string().uuid(),
  session_token: z.string()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.parse(body)

    const supabase = await createAdminClient()

    // Verificamos se o lead existe e se o session_token bate (segurança)
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, session_token')
      .eq('id', parsed.lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 })
    }

    if (lead.session_token !== parsed.session_token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Atualiza a igreja
    const { error: updateError } = await supabase
      .from('leads')
      .update({ church_id: parsed.church_id })
      .eq('id', parsed.lead_id)

    if (updateError) {
      console.error('Update church error:', updateError)
      return NextResponse.json({ error: 'Erro ao vincular igreja' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Assign church error:', error)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
