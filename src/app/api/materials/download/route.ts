import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  lead_id: z.string().length(36).optional().nullable(),
  material_id: z.string().length(36),
})

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    // Also try from search params (GET-style POST)
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const materialId = searchParams.get('material_id')
    if (!materialId) {
      return NextResponse.json({ error: 'material_id required' }, { status: 400 })
    }
    parsed.data = { lead_id: leadId, material_id: materialId } as z.infer<typeof schema>
  }

  const { lead_id, material_id } = parsed.data

  const supabase = await createAdminClient()

  // Get material
  const { data: material, error: matError } = await supabase
    .from('digital_materials')
    .select('id, name, file_url, status')
    .eq('id', material_id)
    .single()

  if (matError || !material || material.status !== 'active') {
    return NextResponse.json({ error: 'Material não encontrado' }, { status: 404 })
  }

  if (!material.file_url) {
    return NextResponse.json({ error: 'Arquivo não disponível' }, { status: 404 })
  }

  // If material requires lead, verify lead exists
  const { data: matFull } = await supabase
    .from('digital_materials')
    .select('requires_lead')
    .eq('id', material_id)
    .single()

  if (matFull?.requires_lead && !lead_id) {
    return NextResponse.json({ error: 'Cadastro necessário para download' }, { status: 403 })
  }

  // Generate signed URL (valid for 5 minutes)
  // The file_url is a Supabase Storage path like: materials/contagem-regressiva.pdf
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_MATERIALS || 'materials'
  const filePath = material.file_url.startsWith(bucketName + '/') 
    ? material.file_url.substring(bucketName.length + 1)
    : material.file_url

  const { data: signedUrl, error: signError } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, 300) // 5 minutes

  if (signError || !signedUrl?.signedUrl) {
    console.error('Signed URL error:', signError)
    return NextResponse.json({ error: 'Erro ao gerar link de download' }, { status: 500 })
  }

  return NextResponse.json({ 
    url: signedUrl.signedUrl,
    name: material.name,
  })
}
