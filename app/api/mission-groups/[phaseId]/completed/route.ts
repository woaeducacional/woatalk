import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  try {
    if (!supabase) return NextResponse.json([])

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { phaseId: phaseIdStr } = await params
    const phaseId = parseInt(phaseIdStr)
    if (isNaN(phaseId)) return NextResponse.json([])

    const { data: userData, error } = await supabase
      .from('users')
      .select('current_phase')
      .eq('email', session.user.email)
      .single()

    if (error || !userData) return NextResponse.json([])

    const currentPhase = userData.current_phase ?? 1
    // Each group index corresponds to a phase (group 0 = phase 1, group 1 = phase 2, ...)
    // Groups 0..(current_phase-2) are completed
    const completedCount = Math.max(0, Math.min(currentPhase - 1, 5))
    const completedGroups = Array.from({ length: completedCount }, (_, i) => i)

    return NextResponse.json(completedGroups)
  } catch {
    return NextResponse.json([])
  }
}
