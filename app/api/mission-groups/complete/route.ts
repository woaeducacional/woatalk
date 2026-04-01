import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { phaseId, missionGroupId, totalXp, woaCoins } = body

    if (phaseId === undefined || missionGroupId === undefined) {
      return NextResponse.json({ error: 'Missing phaseId or missionGroupId' }, { status: 400 })
    }

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userData.id

    // Save mission group completion
    const { error: insertError } = await supabase
      .from('user_mission_group_completion')
      .upsert(
        {
          user_id: userId,
          phase_id: phaseId,
          mission_group_id: missionGroupId,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,phase_id,mission_group_id' }
      )

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save mission group completion' }, { status: 500 })
    }

    // Check if this was the last mission group (group 4 for Talking About Hobbies)
    const isLastGroup = missionGroupId === 4
    
    if (isLastGroup) {
      // Mark the entire phase as complete
      const { error: phaseCompleteError } = await supabase
        .from('user_phase_completion')
        .upsert(
          {
            user_id: userId,
            phase_id: phaseId,
            total_xp: totalXp || 140, // Total XP for all 6 activities
            woa_coins: woaCoins || 5,
            completed_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,phase_id' }
        )

      if (phaseCompleteError) {
        console.error('Phase complete error:', phaseCompleteError)
      }

      // Update user's current phase
      await supabase
        .from('users')
        .update({ current_phase: phaseId + 1 })
        .eq('id', userId)
    }

    return NextResponse.json({
      success: true,
      message: 'Mission group completed',
      data: {
        phaseId,
        missionGroupId,
        phaseCompleted: isLastGroup,
      },
    })
  } catch (error) {
    console.error('Error completing mission group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
