import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

/**
 * GET /api/activity-progress/last-phase
 * Returns the last journey phase with user progress.
 * Priority:
 * 1) Highest phase with mission-group progress in users.journey_progress
 * 2) Most recent step_completed in activity_progress
 * 3) users.current_phase - 1 (if > 0)
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })

    const userId = (token?.id as string | undefined) ?? token?.sub

    if (!userId) {
      return NextResponse.json({ phaseId: null }, { status: 401 })
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, current_phase, journey_progress')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ phaseId: null }, { status: 404 })
    }

    const progress = user.journey_progress
    let phaseFromJourneyProgress: number | null = null

    if (
      progress &&
      typeof progress === 'object' &&
      !Array.isArray(progress)
    ) {
      for (const [phaseKey, completedGroups] of Object.entries(
        progress as Record<string, unknown>
      )) {
        const phase = Number(phaseKey)

        if (!Number.isInteger(phase) || phase <= 0) continue
        if (!Array.isArray(completedGroups) || completedGroups.length === 0) {
          continue
        }

        if (
          phaseFromJourneyProgress === null ||
          phase > phaseFromJourneyProgress
        ) {
          phaseFromJourneyProgress = phase
        }
      }
    }

    if (phaseFromJourneyProgress !== null) {
      return NextResponse.json({
        phaseId: phaseFromJourneyProgress,
      })
    }

    const { data: activityProgress, error: progressError } = await supabase
      .from('activity_progress')
      .select('phase_id, completed_at, updated_at')
      .eq('user_id', user.id)
      .eq('step_completed', true)
      .gt('phase_id', 0)
      .order('completed_at', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1)

    if (progressError) {
      return NextResponse.json({ phaseId: null }, { status: 500 })
    }

    const phaseFromActivity = activityProgress?.[0]?.phase_id

    if (typeof phaseFromActivity === 'number' && phaseFromActivity > 0) {
      return NextResponse.json({
        phaseId: phaseFromActivity,
      })
    }

    const currentPhase = Number(user.current_phase ?? 1)

    const phaseFromCurrent =
      Number.isInteger(currentPhase) && currentPhase > 1
        ? currentPhase - 1
        : null

    return NextResponse.json({
      phaseId: phaseFromCurrent,
    })
  } catch {
    return NextResponse.json({ phaseId: null }, { status: 500 })
  }
}
