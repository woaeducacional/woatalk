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

/** GET /api/woaplay — List published courses (premium required) */
export async function GET() {
  const session = await requirePremium()
  if (!session) return NextResponse.json({ error: 'Acesso premium necessário' }, { status: 403 })

  const { data, error } = await supabase
    .from('woaplay_courses')
    .select('id, title, description, cover_url, is_published, modules, user_progress, created_at')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userId = session.user.id!
  const courses = (data ?? []).map((c) => {
    const progress = (c.user_progress ?? {}) as Record<string, string[]>
    const watched = progress[userId] ?? []
    const total = Array.isArray(c.modules) ? c.modules.length : 0
    return {
      id: c.id,
      title: c.title,
      description: c.description,
      cover_url: c.cover_url,
      module_count: total,
      watched_count: watched.length,
    }
  })

  return NextResponse.json({ courses })
}

/** POST /api/woaplay — Create or update a course (admin only) */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })

  const body = await req.json()
  const { id, title, description, cover_url, is_published, modules } = body

  if (!title?.trim()) return NextResponse.json({ error: 'Título obrigatório' }, { status: 400 })

  if (id) {
    // Update
    const { data, error } = await supabase
      .from('woaplay_courses')
      .update({ title, description, cover_url, is_published: !!is_published, modules: modules ?? [], updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ course: data })
  } else {
    // Create
    const { data, error } = await supabase
      .from('woaplay_courses')
      .insert({ title, description, cover_url, is_published: !!is_published, modules: modules ?? [] })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ course: data }, { status: 201 })
  }
}
