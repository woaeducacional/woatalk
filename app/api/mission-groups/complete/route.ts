import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { phaseId, missionGroupId, totalXp, woaCoins } = body

    if (phaseId === undefined || missionGroupId === undefined) {
      return NextResponse.json({ error: 'Missing phaseId or missionGroupId' }, { status: 400 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, current_phase, xp_total, coins_balance, badges')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Each group (0-4) corresponds to a phase (1-5).
    // Completing group N sets current_phase to N+2  (so group 0 → phase 2, group 4 → phase 6).
    // Only advance if this group hasn't already been completed.
    const nextPhase = missionGroupId + 2
    const currentPhase = userData.current_phase ?? 1

    if (currentPhase <= missionGroupId + 1) {
      // Award badge for completing the first mission group
      let newBadges = userData.badges ?? ''
      let newBadgeEarned: string | null = null
      if (missionGroupId === 0) {
        const badgeList = newBadges.split(',').map((b: string) => b.trim()).filter(Boolean)
        if (!badgeList.includes('first_step')) {
          badgeList.push('first_step')
          newBadges = badgeList.join(',')
          newBadgeEarned = 'first_step'
        }
      }

      // First completion: advance phase and award XP/coins
      const { error: updateError } = await supabase
        .from('users')
        .update({
          current_phase: nextPhase,
          xp_total: (userData.xp_total ?? 0) + (totalXp ?? 0),
          coins_balance: (userData.coins_balance ?? 0) + (woaCoins ?? 0),
          badges: newBadges,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.id)

      if (updateError) console.error('Update error:', updateError)

      const isLastGroup = missionGroupId === 4

      return NextResponse.json({
        success: true,
        message: 'Mission group completed',
        data: { phaseId, missionGroupId, phaseCompleted: isLastGroup },
        newBadge: newBadgeEarned,
      })
    }

    const isLastGroup = missionGroupId === 4

    return NextResponse.json({
      success: true,
      message: 'Mission group completed',
      data: { phaseId, missionGroupId, phaseCompleted: isLastGroup },
      newBadge: null,
    })
  } catch (error) {
    console.error('Error completing mission group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
