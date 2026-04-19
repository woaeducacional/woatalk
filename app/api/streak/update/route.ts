import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'
import { communityService } from '@/src/services/community.service'

export async function POST(request: NextRequest) {
  try {
    if (!supabase) return NextResponse.json({ error: 'Database not configured' }, { status: 503 })

    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, streak_count, last_streak_date, streak_pending')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const todayStr = new Date().toISOString().split('T')[0]
    const lastDate = userData.last_streak_date as string | null
    const isPending = userData.streak_pending as boolean ?? false
    const currentStreak = userData.streak_count ?? 0

    let newStreakCount = currentStreak
    let newLastStreakDate: string | null = lastDate
    let newStreakPending = isPending

    type StreakStatus = 'already_counted' | 'increased' | 'pending_recovery' | 'broken' | 'expired_recovery'
    let streakStatus: StreakStatus = 'already_counted'

    const diffDays = (a: string, b: string) => {
      const msPerDay = 86400000
      return Math.round((new Date(a).getTime() - new Date(b).getTime()) / msPerDay)
    }

    if (lastDate !== todayStr) {
      const days = lastDate ? diffDays(todayStr, lastDate) : 999
      newLastStreakDate = todayStr

      if (days === 1 && !isPending) {
        newStreakCount = currentStreak + 1
        newStreakPending = false
        streakStatus = 'increased'
      } else if (days === 2 && !isPending) {
        newStreakCount = currentStreak
        newStreakPending = true
        streakStatus = 'pending_recovery'
      } else if (days === 1 && isPending) {
        newStreakCount = 1
        newStreakPending = false
        streakStatus = 'expired_recovery'
      } else {
        newStreakCount = 1
        newStreakPending = false
        streakStatus = currentStreak > 0 ? 'broken' : 'increased'
      }

      const { error: streakError } = await supabase
        .from('users')
        .update({
          streak_count: newStreakCount,
          last_streak_date: newLastStreakDate,
          streak_pending: newStreakPending,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userData.id)

      if (streakError) console.error('Streak update error:', streakError)

      // ── Community auto-publish for streak milestones ──
      const streakMilestones = [7, 14, 30, 60, 100]
      if (streakStatus === 'increased' && streakMilestones.includes(newStreakCount)) {
        try {
          await communityService.createPost(userData.id, 'streak_milestone', { streak: newStreakCount })
        } catch (e) { console.error('Community streak post error:', e) }
      }
    }

    return NextResponse.json({
      status: streakStatus,
      streak: newStreakCount,
      canRecover: streakStatus === 'pending_recovery',
      recoveryCost: 4,
    })
  } catch (error) {
    console.error('Error updating streak:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
