import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const churchId = formData.get('church_id') as string
  const campaignId = formData.get('campaign_id') as string
  const existingBannerId = formData.get('existing_banner_id') as string | null
  const churchName = formData.get('church_name') as string

  if (!file || !churchId || !campaignId) {
    return NextResponse.json({ error: 'file, church_id and campaign_id are required' }, { status: 400 })
  }

  // Use service role key for storage uploads (bypasses RLS)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const ext = file.name.split('.').pop() || 'png'
  const fileName = `banners/${churchId}-${Date.now()}.${ext}`
  
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('public-assets')
    .upload(fileName, buffer, { 
      contentType: file.type,
      upsert: true 
    })

  if (uploadError) {
    return NextResponse.json({ error: 'Upload failed: ' + uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('public-assets').getPublicUrl(fileName)
  const publicUrl = urlData.publicUrl

  // Update or insert banner record
  if (existingBannerId) {
    const { error } = await supabase
      .from('banners')
      .update({
        image_desktop_url: publicUrl,
        image_mobile_url: publicUrl,
        name: `Banner ${churchName || churchId}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingBannerId)

    if (error) {
      return NextResponse.json({ error: 'DB update failed: ' + error.message }, { status: 500 })
    }
  } else {
    const { error } = await supabase
      .from('banners')
      .insert({
        church_id: churchId,
        campaign_id: campaignId,
        name: `Banner ${churchName || churchId}`,
        image_desktop_url: publicUrl,
        image_mobile_url: publicUrl,
        display_order: 1,
        status: 'active'
      })

    if (error) {
      return NextResponse.json({ error: 'DB insert failed: ' + error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ 
    success: true,
    url: publicUrl
  })
}
