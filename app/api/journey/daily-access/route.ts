import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

const DAILY_JOURNEY_LIMIT = 2

/** Returns today's date as YYYY-MM-DD in BRT (UTC-3). */
function getTodayBRTDate(): string {
  const now = new Date()
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000)
  return brt.toISOString().slice(0, 10)
}

/** Reason tag for today's journey accesses — changes every day automatically. */
function todayJourneyReason(): string {
  return `journey_access_${getTodayBRTDate()}`
}

/**
 * GET /api/journey/daily-access
 * Returns the phase_ids the user has already opened today and the total count.
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

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, subscription_plan, subscription_status')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.subscription_plan !== null && userData.subscription_status === 'active') {
      return NextResponse.json({ accessedPhaseIds: [], count: 0, isPremium: true })
    }

    const todayReason = todayJourneyReason()
    const { data: rows, error: fetchError } = await supabase
      .from('xp_history')
      .select('amount')
      .eq('user_id', userData.id)
      .eq('reason', todayReason)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const accessedPhaseIds = [...new Set((rows ?? []).map((r) => r.amount as number))]

    return NextResponse.json({ accessedPhaseIds, count: accessedPhaseIds.length, isPremium: false, limit: DAILY_JOURNEY_LIMIT })
  } catch (error) {
    console.error('Error in journey daily-access GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/journey/daily-access
 * Records that the authenticated user opened a journey today.
 * Returns { alreadyAccessed, dailyCount, blocked }.
 * `blocked` is true when the user is not premium, has already opened
 * DAILY_JOURNEY_LIMIT distinct journeys today, and this phaseId is new.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { phaseId } = body
    if (phaseId === undefined || phaseId === null) {
      return NextResponse.json({ error: 'Missing phaseId' }, { status: 400 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, subscription_plan, subscription_status')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.subscription_plan !== null && userData.subscription_status === 'active') {
      return NextResponse.json({ alreadyAccessed: false, dailyCount: 0, blocked: false, isPremium: true })
    }

    const todayReason = todayJourneyReason()
    const { data: rows, error: fetchError } = await supabase
      .from('xp_history')
      .select('amount')
      .eq('user_id', userData.id)
      .eq('reason', todayReason)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const accessedPhaseIds = [...new Set((rows ?? []).map((r) => r.amount as number))]
    const alreadyAccessed = accessedPhaseIds.includes(Number(phaseId))

    if (alreadyAccessed) {
      return NextResponse.json({ alreadyAccessed: true, dailyCount: accessedPhaseIds.length, blocked: false })
    }

    if (accessedPhaseIds.length >= DAILY_JOURNEY_LIMIT) {
      return NextResponse.json({ alreadyAccessed: false, dailyCount: accessedPhaseIds.length, blocked: true })
    }

    await supabase.from('xp_history').insert({
      user_id: userData.id,
      amount: Number(phaseId),
      reason: todayReason,
    })

    return NextResponse.json({
      alreadyAccessed: false,
      dailyCount: accessedPhaseIds.length + 1,
      blocked: false,
    })
  } catch (error) {
    console.error('Error in journey daily-access POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
