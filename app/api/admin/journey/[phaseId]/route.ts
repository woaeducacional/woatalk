import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabase } from '@/src/lib/supabaseClient'
import { authOptions } from '@/lib/authOptions'
import type { JourneyCheckpoint } from '@/lib/journey'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') {
    return null
  }
  return session
}

/** GET /api/admin/journey/[phaseId] — fetch all checkpoints for admin editor */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { phaseId: raw } = await params
  const phaseId = parseInt(raw)
  if (isNaN(phaseId)) return NextResponse.json({ error: 'Invalid phaseId' }, { status: 400 })
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const [checkpointsResult, levelResult] = await Promise.all([
    supabase
      .from('journey_checkpoints')
      .select('*')
      .eq('phase_id', phaseId)
      .order('checkpoint_number', { ascending: true }),
    supabase
      .from('levels')
      .select('id, name, icon_path, lesson_title')
      .eq('id', phaseId)
      .single(),
  ])

  if (checkpointsResult.error) return NextResponse.json({ error: checkpointsResult.error.message }, { status: 500 })
  return NextResponse.json({
    checkpoints: checkpointsResult.data as JourneyCheckpoint[],
    phase: levelResult.data ?? null,
  })
}

/** PUT /api/admin/journey/[phaseId] — upsert a single checkpoint */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { phaseId: raw } = await params
  const phaseId = parseInt(raw)
  if (isNaN(phaseId)) return NextResponse.json({ error: 'Invalid phaseId' }, { status: 400 })
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const body = await req.json()
  const cp = body as Partial<JourneyCheckpoint>

  if (!cp.checkpoint_number || cp.checkpoint_number < 1 || cp.checkpoint_number > 10) {
    return NextResponse.json({ error: 'checkpoint_number must be 1-10' }, { status: 400 })
  }

  const row = {
    phase_id: phaseId,
    checkpoint_number: cp.checkpoint_number,
    theme_name: cp.theme_name ?? null,
    resource_type: cp.resource_type ?? 'audio',
    resource_url: cp.resource_url ?? '',
    q1_en: cp.q1_en ?? '',
    q1_pt: cp.q1_pt ?? null,
    q1_options: cp.q1_options ?? '',
    q1_answer: cp.q1_answer ?? '',
    complete_en: cp.complete_en ?? '',
    complete_pt: cp.complete_pt ?? null,
    complete_options: cp.complete_options ?? '',
    complete_answer: cp.complete_answer ?? '',
    speak1: cp.speak1 ?? '',
    q2_en: cp.q2_en ?? '',
    q2_pt: cp.q2_pt ?? null,
    q2_options: cp.q2_options ?? '',
    q2_answer: cp.q2_answer ?? '',
    q3_en: cp.q3_en ?? '',
    q3_pt: cp.q3_pt ?? null,
    q3_options: cp.q3_options ?? '',
    q3_answer: cp.q3_answer ?? '',
    speak2: cp.speak2 ?? '',
    order_sentence: cp.order_sentence ?? '',
    speak3: cp.speak3 ?? '',
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('journey_checkpoints')
    .upsert(row, { onConflict: 'phase_id,checkpoint_number' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ checkpoint: data })
}
