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
    const { phase_id, total_xp, woa_coins } = body

    if (!phase_id) return NextResponse.json({ error: 'Missing phase_id' }, { status: 400 })

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, current_phase, xp_total, coins_balance')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Only advance if not already past this phase
    if ((userData.current_phase ?? 1) <= phase_id) {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          current_phase: phase_id + 1,
          xp_total: (userData.xp_total ?? 0) + (total_xp ?? 0),
          coins_balance: (userData.coins_balance ?? 0) + (woa_coins ?? 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.id)

      if (updateError) {
        console.error('Update error:', updateError)
        return NextResponse.json({ error: 'Failed to save completion' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: 'Phase completed' })
  } catch (error) {
    console.error('Error completing phase:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

