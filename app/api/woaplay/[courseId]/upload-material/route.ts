import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'
import type { WOAPlayModule, WOAPlayMaterial } from '@/lib/woaplay'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png', 'image/jpeg', 'image/webp',
  'audio/mpeg', 'audio/mp3',
]
const MAX_SIZE = 20 * 1024 * 1024 // 20MB for documents
const BUCKET = 'journey-assets'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

/**
 * POST /api/woaplay/[courseId]/upload-material
 * Body: FormData { file, moduleId }
 * Uploads a file and appends it to the module's materials array
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { courseId } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File
  const moduleId = formData.get('moduleId') as string

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo fornecido' }, { status: 400 })
  if (!moduleId) return NextResponse.json({ error: 'moduleId obrigatório' }, { status: 400 })

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 20MB.' }, { status: 400 })
  }

  const materialId = randomUUID()
  const ext = file.name.split('.').pop() || 'bin'
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const filePath = `woaplay/materials/${courseId}/${moduleId}/${materialId}-${safeName}`
  const bytes = await file.arrayBuffer()

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, Buffer.from(bytes), { contentType: file.type, upsert: false })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  const publicUrl = urlData?.publicUrl
  if (!publicUrl) return NextResponse.json({ error: 'Erro ao gerar URL' }, { status: 500 })

  // Fetch current course modules
  const { data: course, error: fetchErr } = await supabase
    .from('woaplay_courses')
    .select('modules')
    .eq('id', courseId)
    .single()

  if (fetchErr || !course) return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })

  const modules: WOAPlayModule[] = Array.isArray(course.modules) ? course.modules : []
  const modIdx = modules.findIndex((m) => m.id === moduleId)
  if (modIdx === -1) return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })

  const newMaterial: WOAPlayMaterial = {
    id: materialId,
    file_name: file.name,
    file_url: publicUrl,
  }

  modules[modIdx].materials = [...(modules[modIdx].materials ?? []), newMaterial]

  const { error: updateErr } = await supabase
    .from('woaplay_courses')
    .update({ modules, updated_at: new Date().toISOString() })
    .eq('id', courseId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ material: newMaterial })
}

/**
 * DELETE /api/woaplay/[courseId]/upload-material?moduleId=...&materialId=...
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { courseId } = await params
  const url = new URL(req.url)
  const moduleId = url.searchParams.get('moduleId')
  const materialId = url.searchParams.get('materialId')

  if (!moduleId || !materialId) {
    return NextResponse.json({ error: 'moduleId e materialId obrigatórios' }, { status: 400 })
  }

  const { data: course, error: fetchErr } = await supabase
    .from('woaplay_courses')
    .select('modules')
    .eq('id', courseId)
    .single()

  if (fetchErr || !course) return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })

  const modules: WOAPlayModule[] = Array.isArray(course.modules) ? course.modules : []
  const modIdx = modules.findIndex((m) => m.id === moduleId)
  if (modIdx === -1) return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 })

  modules[modIdx].materials = (modules[modIdx].materials ?? []).filter((m) => m.id !== materialId)

  const { error: updateErr } = await supabase
    .from('woaplay_courses')
    .update({ modules, updated_at: new Date().toISOString() })
    .eq('id', courseId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
