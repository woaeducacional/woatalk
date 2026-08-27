import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const body = await request.json()

    const phaseId = Number(body?.phase_id)
    const missionGroupId = Number(body?.mission_group_id)
    const activityIndex = Number(body?.activity_index)
    const xpEarned = Math.max(0, Number(body?.xp_earned ?? 0))
    const stepCompleted = Boolean(body?.step_completed)

    if (!Number.isInteger(phaseId) || phaseId < 1) {
      return NextResponse.json(
        { error: 'phase_id inválido' },
        { status: 400 },
      )
    }

    if (!Number.isInteger(missionGroupId) || missionGroupId < 0 || missionGroupId > 4) {
      return NextResponse.json(
        { error: 'mission_group_id inválido' },
        { status: 400 },
      )
    }

    if (!Number.isInteger(activityIndex) || activityIndex < 0) {
      return NextResponse.json(
        { error: 'activity_index inválido' },
        { status: 400 },
      )
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 },
      )
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('activity_progress')
      .upsert(
        {
          user_id: user.id,
          phase_id: phaseId,
          mission_group_id: missionGroupId,
          activity_index: activityIndex,
          xp_earned: xpEarned,
          step_completed: stepCompleted,
          completed_at: stepCompleted ? now : null,
          updated_at: now,
        },
        {
          onConflict: 'user_id,phase_id,mission_group_id,activity_index',
        },
      )
      .select()
      .single()

    if (error) {
      console.error('Activity progress save error:', error)

      return NextResponse.json(
        { error: 'Não foi possível salvar o progresso.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      activity: data,
    })
  } catch (error) {
    console.error('Activity progress POST error:', error)

    return NextResponse.json(
      { error: 'Erro interno.' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      )
    }

    const phaseId = Number(
      request.nextUrl.searchParams.get('phase_id'),
    )

    if (!Number.isInteger(phaseId) || phaseId < 1) {
      return NextResponse.json(
        { error: 'phase_id inválido' },
        { status: 400 },
      )
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 },
      )
    }

    const { data, error } = await supabase
      .from('activity_progress')
      .select(`
        id,
        phase_id,
        mission_group_id,
        activity_index,
        xp_earned,
        step_completed,
        completed_at,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('phase_id', phaseId)
      .order('activity_index', { ascending: true })

    if (error) {
      console.error('Activity progress GET error:', error)

      return NextResponse.json(
        { error: 'Não foi possível carregar o progresso.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      phase_id: phaseId,
      activities: data ?? [],
    })
  } catch (error) {
    console.error('Activity progress GET error:', error)

    return NextResponse.json(
      { error: 'Erro interno.' },
      { status: 500 },
    )
  }
}
