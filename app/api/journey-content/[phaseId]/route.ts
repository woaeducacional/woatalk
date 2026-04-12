import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'
import type { JourneyContent } from '@/lib/journeyContent'

// GET — Fetch journey content for a phase
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const { phaseId: phaseIdStr } = await params
  const phaseId = parseInt(phaseIdStr)
  if (isNaN(phaseId)) return NextResponse.json({ error: 'Invalid phaseId' }, { status: 400 })

  // Try DB first
  if (supabase) {
    const { data, error } = await supabase
      .from('journey_content')
      .select('*')
      .eq('phase_id', phaseId)
      .single()

    if (!error && data) {
      return NextResponse.json({
        phase_id: data.phase_id,
        title: data.title,
        description: data.description,
        mission_groups: data.mission_groups,
        block1: data.block1,
        block2: data.block2,
        block3: data.block3,
        block4: data.block4,
        block5: data.block5,
      } as JourneyContent)
    }
  }

  return NextResponse.json({ error: 'Journey content not found' }, { status: 404 })
}

// PUT — Update journey content (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const { phaseId: phaseIdStr } = await params
  const phaseId = parseInt(phaseIdStr)
  if (isNaN(phaseId)) return NextResponse.json({ error: 'Invalid phaseId' }, { status: 400 })

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check admin role
  if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .single()

  if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body: Partial<JourneyContent> = await request.json()

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updateData.title = body.title
  if (body.description !== undefined) updateData.description = body.description
  if (body.mission_groups !== undefined) updateData.mission_groups = body.mission_groups
  if (body.block1 !== undefined) updateData.block1 = body.block1
  if (body.block2 !== undefined) updateData.block2 = body.block2
  if (body.block3 !== undefined) updateData.block3 = body.block3
  if (body.block4 !== undefined) updateData.block4 = body.block4
  if (body.block5 !== undefined) updateData.block5 = body.block5

  // Upsert: create if doesn't exist, update if it does
  const { data, error } = await supabase
    .from('journey_content')
    .upsert({
      phase_id: phaseId,
      title: body.title ?? 'New Journey',
      description: body.description ?? '',
      mission_groups: body.mission_groups ?? [],
      block1: body.block1 ?? {},
      block2: body.block2 ?? {},
      block3: body.block3 ?? {},
      block4: body.block4 ?? {},
      block5: body.block5 ?? {},
      ...updateData,
    }, { onConflict: 'phase_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}
