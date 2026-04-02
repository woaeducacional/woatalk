import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    if (!supabase) return NextResponse.json([])

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData, error } = await supabase
      .from('users')
      .select('current_phase')
      .eq('email', session.user.email)
      .single()

    if (error || !userData) return NextResponse.json([])

    const currentPhase = userData.current_phase ?? 1
    // Phases 1..current_phase-1 are completed
    const completedPhases = Array.from({ length: currentPhase - 1 }, (_, i) => i + 1)

    return NextResponse.json(completedPhases)
  } catch {
    return NextResponse.json([])
  }
}
