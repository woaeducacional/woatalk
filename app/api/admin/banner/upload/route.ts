import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    throw new Error('Unauthorized')
  }
}

// POST /api/admin/banner/upload
export async function POST(req: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const linkUrl = (formData.get('link_url') as string | null) ?? null

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo inválido. Use PNG, JPEG, WebP ou GIF' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5 MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'png'
  const filePath = `banners/banner-${Date.now()}.${ext}`
  const bytes = await file.arrayBuffer()

  // Remove banners antigos do storage (best-effort)
  const { data: existing } = await supabase.storage.from('journey-assets').list('banners')
  if (existing && existing.length > 0) {
    const oldPaths = existing.map((f) => `banners/${f.name}`)
    await supabase.storage.from('journey-assets').remove(oldPaths).catch(() => {})
  }

  // Upload novo arquivo
  const { error: uploadError } = await supabase.storage
    .from('journey-assets')
    .upload(filePath, Buffer.from(bytes), { contentType: file.type, upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: `Erro no upload: ${uploadError.message}` }, { status: 500 })
  }

  const { data: urlData } = supabase.storage.from('journey-assets').getPublicUrl(filePath)
  const imageUrl = urlData?.publicUrl

  if (!imageUrl) {
    return NextResponse.json({ error: 'Falha ao gerar URL pública' }, { status: 500 })
  }

  // Remove registros anteriores do banco e insere o novo
  await supabase.from('app_banner').delete().neq('id', 0)

  const { data: inserted, error: dbError } = await supabase
    .from('app_banner')
    .insert({ image_url: imageUrl, link_url: linkUrl || null })
    .select('id, image_url, link_url, created_at')
    .single()

  if (dbError) {
    return NextResponse.json({ error: `Erro ao salvar no banco: ${dbError.message}` }, { status: 500 })
  }

  return NextResponse.json({ banner: inserted })
}
