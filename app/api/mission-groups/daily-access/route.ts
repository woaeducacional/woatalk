import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

const DAILY_BLOCK_LIMIT = 2

function getTodayStart() {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

function encode(phaseId: number, missionGroupId: number): number {
  return phaseId * 1000 + missionGroupId
}

function decode(amount: number): { phaseId: number; missionGroupId: number } {
  return { phaseId: Math.floor(amount / 1000), missionGroupId: amount % 1000 }
}

/**
 * GET /api/mission-groups/daily-access
 * Returns all (phaseId, missionGroupId) pairs the user has opened today
 * plus the total count.
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
      .select('id, subscription_status')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.subscription_status === 'active') {
      return NextResponse.json({ accessedBlocks: [], count: 0, isPremium: true })
    }

    const { data: rows, error: fetchError } = await supabase
      .from('xp_history')
      .select('amount')
      .eq('user_id', userData.id)
      .eq('reason', 'block_access')
      .gte('created_at', getTodayStart())

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const uniqueAmounts = [...new Set((rows ?? []).map((r) => r.amount as number))]
    const accessedBlocks = uniqueAmounts.map(decode)

    return NextResponse.json({ accessedBlocks, count: accessedBlocks.length, isPremium: false })
  } catch (error) {
    console.error('Error in mission-groups daily-access GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/mission-groups/daily-access
 * Records that the user opened a specific block today.
 * Returns { alreadyAccessed, dailyCount, blocked }.
 * `blocked` is true when the user has already opened DAILY_BLOCK_LIMIT
 * distinct blocks today and this (phaseId, missionGroupId) is new.
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
    const { phaseId, missionGroupId } = body
    if (phaseId === undefined || missionGroupId === undefined) {
      return NextResponse.json({ error: 'Missing phaseId or missionGroupId' }, { status: 400 })
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, subscription_status')
      .eq('email', session.user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (userData.subscription_status === 'active') {
      return NextResponse.json({ alreadyAccessed: false, dailyCount: 0, blocked: false, isPremium: true })
    }

    const { data: rows, error: fetchError } = await supabase
      .from('xp_history')
      .select('amount')
      .eq('user_id', userData.id)
      .eq('reason', 'block_access')
      .gte('created_at', getTodayStart())

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const uniqueAmounts = [...new Set((rows ?? []).map((r) => r.amount as number))]
    const encoded = encode(Number(phaseId), Number(missionGroupId))
    const alreadyAccessed = uniqueAmounts.includes(encoded)

    if (alreadyAccessed) {
      return NextResponse.json({ alreadyAccessed: true, dailyCount: uniqueAmounts.length, blocked: false })
    }

    if (uniqueAmounts.length >= DAILY_BLOCK_LIMIT) {
      return NextResponse.json({ alreadyAccessed: false, dailyCount: uniqueAmounts.length, blocked: true })
    }

    await supabase.from('xp_history').insert({
      user_id: userData.id,
      amount: encoded,
      reason: 'block_access',
    })

    return NextResponse.json({
      alreadyAccessed: false,
      dailyCount: uniqueAmounts.length + 1,
      blocked: false,
    })
  } catch (error) {
    console.error('Error in mission-groups daily-access POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
