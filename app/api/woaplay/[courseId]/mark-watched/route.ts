import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

/** POST /api/woaplay/[courseId]/mark-watched — Mark a module as watched */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { courseId } = await params
  const { moduleId } = await req.json()
  if (!moduleId) return NextResponse.json({ error: 'moduleId obrigatório' }, { status: 400 })

  const { data: course, error: fetchErr } = await supabase
    .from('woaplay_courses')
    .select('user_progress, modules')
    .eq('id', courseId)
    .single()

  if (fetchErr || !course) return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 })

  const userId = session.user.id
  const progress = (course.user_progress ?? {}) as Record<string, string[]>
  const watched = progress[userId] ?? []

  if (!watched.includes(moduleId)) {
    progress[userId] = [...watched, moduleId]
    const { error: updateErr } = await supabase
      .from('woaplay_courses')
      .update({ user_progress: progress })
      .eq('id', courseId)
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  const total = Array.isArray(course.modules) ? course.modules.length : 0
  const watchedNow = progress[userId] ?? []

  return NextResponse.json({ success: true, watched: watchedNow, total })
}
