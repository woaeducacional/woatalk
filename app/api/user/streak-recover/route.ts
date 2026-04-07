import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const RECOVERY_COST = 4

export async function POST(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, streak_count, streak_pending, last_streak_date, coins_balance')
      .eq('id', token.id as string)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const todayStr = new Date().toISOString().split('T')[0]

    if (!user.streak_pending) {
      return NextResponse.json({ error: 'No recovery available' }, { status: 400 })
    }
    if (user.last_streak_date !== todayStr) {
      return NextResponse.json({ error: 'Recovery window expired' }, { status: 400 })
    }
    if ((user.coins_balance ?? 0) < RECOVERY_COST) {
      return NextResponse.json({ error: 'Not enough WOA Coins' }, { status: 400 })
    }

    const newStreak = (user.streak_count ?? 0) + 1

    const { error: updateError } = await supabase
      .from('users')
      .update({
        streak_count: newStreak,
        streak_pending: false,
        coins_balance: (user.coins_balance ?? 0) - RECOVERY_COST,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Streak recover update error:', updateError)
      return NextResponse.json({ error: 'Failed to recover streak' }, { status: 500 })
    }

    return NextResponse.json({ success: true, newStreak, coinsDeducted: RECOVERY_COST })
  } catch (error) {
    console.error('Streak recover error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
