import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') return null
  return session
}

async function requirePremium() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  const { data: user } = await supabase
    .from('users')
    .select('subscription_status')
    .eq('id', session.user.id)
    .single()
  if (user?.subscription_status !== 'active') return null
  return session
}

/** GET /api/woaplay/[courseId] — Get course detail with modules */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const { courseId } = await params

  // Admins can preview unpublished courses
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const isAdmin = session.user.role === 'admin'

  const { data, error } = await supabase
    .from('woaplay_courses')
    .select('*')
    .eq('id', courseId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })
  if (!data.is_published && !isAdmin) {
    // For non-admins, check premium
    const { data: user } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', session.user.id)
      .single()
    if (user?.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Acesso premium necessário' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Curso não disponível' }, { status: 404 })
  }

  if (!isAdmin) {
    const { data: user } = await supabase
      .from('users')
      .select('subscription_status')
      .eq('id', session.user.id)
      .single()
    if (user?.subscription_status !== 'active') {
      return NextResponse.json({ error: 'Acesso premium necessário' }, { status: 403 })
    }
  }

  const userId = session.user.id
  const progress = (data.user_progress ?? {}) as Record<string, string[]>
  const watchedModules = progress[userId] ?? []

  return NextResponse.json({
    course: {
      ...data,
      user_progress: undefined,
    },
    watched_modules: watchedModules,
  })
}

/** PUT /api/woaplay/[courseId] — Update course (admin only) */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { courseId } = await params
  const body = await req.json()
  const { title, description, cover_url, is_published, modules } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

  const { data, error } = await supabase
    .from('woaplay_courses')
    .update({ title, description, cover_url, is_published: !!is_published, modules: modules ?? [], updated_at: new Date().toISOString() })
    .eq('id', courseId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ course: data })
}

/** DELETE /api/woaplay/[courseId] — Delete course (admin only) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const { courseId } = await params
  const { error } = await supabase.from('woaplay_courses').delete().eq('id', courseId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
