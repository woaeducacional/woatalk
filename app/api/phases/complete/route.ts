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
    const { phase_id, total_xp, woa_coins } = body

    if (!phase_id) {
      return NextResponse.json({ error: 'Missing phase_id' }, { status: 400 })
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

    // Insert phase completion record
    const { error: insertError } = await supabase
      .from('user_phase_completion')
      .upsert(
        {
          user_id: userId,
          phase_id,
          total_xp,
          woa_coins,
          completed_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,phase_id' }
      )

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to save completion' }, { status: 500 })
    }

    // Update user's current phase
    const { error: updateError } = await supabase
      .from('users')
      .update({ current_phase: phase_id + 1 })
      .eq('id', userId)

    if (updateError) {
      console.error('Update error:', updateError)
      // Don't fail if update fails, the main data is already saved
    }

    return NextResponse.json({
      success: true,
      message: 'Phase completed and saved',
      data: {
        phase_id,
        total_xp,
        woa_coins,
      },
    })
  } catch (error) {
    console.error('Error completing phase:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

