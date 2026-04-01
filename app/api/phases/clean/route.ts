import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

// Temporary endpoint to clean old phase completion data for phase 2
// DELETE after running once
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete old phase 2 completion record
    const { error } = await supabase
      .from('user_phase_completion')
      .delete()
      .eq('phase_id', 2)

    if (error) {
      console.error('Delete phase error:', error)
    }

    // Also delete all mission group completions for phase 2
    const { error: missionError } = await supabase
      .from('user_mission_group_completion')
      .delete()
      .eq('phase_id', 2)

    if (missionError) {
      console.error('Delete mission groups error:', missionError)
    }

    // Also reset user's current_phase if it was set to 3 because of old data
    const { data: userData } = await supabase
      .from('users')
      .select('id, current_phase')
      .eq('email', session.user.email)
      .single()

    if (userData && userData.current_phase > 2) {
      await supabase
        .from('users')
        .update({ current_phase: 2 })
        .eq('id', userData.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Old phase 2 data cleaned. Phase reset to 2.',
    })
  } catch (error) {
    console.error('Error cleaning data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
