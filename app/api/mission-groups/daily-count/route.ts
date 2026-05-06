import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

/**
 * GET /api/mission-groups/daily-count
 * Returns the number of distinct mission group completions recorded today
 * for the authenticated user (based on xp_history entries with reason='mission_group').
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    // Resolve user id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Count xp_history entries with reason='mission_group' created today (UTC)
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    const { count, error: countError } = await supabase
      .from('xp_history')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userData.id)
      .eq('reason', 'mission_group')
      .gte('created_at', todayStart.toISOString())

    if (countError) {
      console.error('Error counting daily modules:', countError)
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    return NextResponse.json({ count: count ?? 0 })
  } catch (error) {
    console.error('Error in daily-count route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
