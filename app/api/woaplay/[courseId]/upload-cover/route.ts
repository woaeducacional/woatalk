import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024
const BUCKET = 'journey-assets'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

/** POST /api/woaplay/[courseId]/upload-cover — Upload course cover image */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { courseId } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Tipo de arquivo não permitido. Use PNG, JPEG ou WebP.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const filePath = `woaplay/covers/${courseId}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, Buffer.from(bytes), { contentType: file.type, upsert: true })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  const publicUrl = urlData?.publicUrl
  if (!publicUrl) return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 })

  const { error: dbErr } = await supabase
    .from('woaplay_courses')
    .update({ cover_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', courseId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  return NextResponse.json({ url: publicUrl })
}
