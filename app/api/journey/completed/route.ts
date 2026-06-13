import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

/**
 * GET /api/journey/completed
 * Returns the phase_ids the authenticated user has fully completed.
 * A journey is considered complete when missionGroupId 4 (the last group) is in its progress array.
 */
export async function GET() {
  if (!supabase) return NextResponse.json({ completedPhaseIds: [] })

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return NextResponse.json({ completedPhaseIds: [] })

  const { data: user } = await supabase
    .from('users')
    .select('journey_progress')
    .eq('email', session.user.email)
    .single()

  const progress: Record<string, number[]> = user?.journey_progress ?? {}

  const completedPhaseIds = Object.entries(progress)
    .filter(([, groups]) => Array.isArray(groups) && groups.includes(4))
    .map(([phaseId]) => parseInt(phaseId))

  return NextResponse.json({ completedPhaseIds })
}
