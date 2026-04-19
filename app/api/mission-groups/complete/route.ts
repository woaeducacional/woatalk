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

    const body = await request.json()
    const { phaseId, missionGroupId, totalXp, woaCoins } = body

    if (phaseId === undefined || missionGroupId === undefined) {
      return NextResponse.json({ error: 'Missing phaseId or missionGroupId' }, { status: 400 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, journey_progress, xp_total, coins_balance, badges')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const journeyProgress: Record<string, number[]> = userData.journey_progress ?? {}
    const key = String(phaseId)
    const currentCompleted: number[] = Array.isArray(journeyProgress[key]) ? journeyProgress[key] : []
    const isFirstCompletion = !currentCompleted.includes(missionGroupId)

    // Merge the new groupId into the completed array (no duplicates)
    const updatedCompleted = isFirstCompletion
      ? [...currentCompleted, missionGroupId].sort((a, b) => a - b)
      : currentCompleted

    const updatedProgress = { ...journeyProgress, [key]: updatedCompleted }

    // Award badge only on first-ever group completion across all journeys
    let newBadges = userData.badges ?? ''
    let newBadgeEarned: string | null = null
    if (isFirstCompletion && missionGroupId === 0) {
      const badgeList = newBadges.split(',').map((b: string) => b.trim()).filter(Boolean)
      if (!badgeList.includes('first_step')) {
        badgeList.push('first_step')
        newBadges = badgeList.join(',')
        newBadgeEarned = 'first_step'
      }
    }

    const updatePayload: Record<string, unknown> = {
      journey_progress: updatedProgress,
      badges: newBadges,
      updated_at: new Date().toISOString(),
    }

    if (isFirstCompletion) {
      updatePayload.xp_total = (userData.xp_total ?? 0) + (totalXp ?? 0)
      updatePayload.coins_balance = (userData.coins_balance ?? 0) + (woaCoins ?? 0)
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', userData.id)

    if (updateError) console.error('Update error:', updateError)

    // ── Record XP history for weekly ranking ──
    if (isFirstCompletion && totalXp > 0) {
      await supabase.from('xp_history').insert({
        user_id: userData.id,
        amount: totalXp,
        reason: 'mission_group',
      })
    }

    const isLastGroup = missionGroupId === 4

    // ── Community auto-publish ──
    if (isFirstCompletion) {
      try {
        if (newBadgeEarned) {
          await communityService.createPost(userData.id, 'badge_earned', { badge: newBadgeEarned })
        }
        await communityService.createPost(userData.id, 'block_completed', { phaseId, missionGroupId })
        if (isLastGroup) {
          await communityService.createPost(userData.id, 'journey_completed', { phaseId })
        }
        const newXp = (updatePayload.xp_total as number) ?? (userData.xp_total ?? 0)
        const xpMilestones = [500, 1000, 2500, 5000, 10000]
        const oldXp = userData.xp_total ?? 0
        for (const m of xpMilestones) {
          if (oldXp < m && newXp >= m) {
            await communityService.createPost(userData.id, 'xp_milestone', { xp: m })
          }
        }
      } catch (e) { console.error('Community post error:', e) }
    }

    return NextResponse.json({
      success: true,
      message: 'Mission group completed',
      data: { phaseId, missionGroupId, phaseCompleted: isLastGroup },
      newBadge: newBadgeEarned,
    })
  } catch (error) {
    console.error('Error completing mission group:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

