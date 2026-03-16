import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(
  request: NextRequest,
  { params }: { params: { phaseId: string } }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ checkpoint: 0, missions_completed: 0 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const userId = token.id as string
  const phaseId = parseInt(params.phaseId)

  try {
    const { data, error } = await supabase
      .from('phase_checkpoints')
      .select('checkpoint, missions_completed, xp_earned, coins_earned')
      .eq('user_id', userId)
      .eq('phase_id', phaseId)
      .maybeSingle()

    if (error) return NextResponse.json({ checkpoint: 0, missions_completed: 0, xp_earned: 0, coins_earned: 0 })
    return NextResponse.json(data ?? { checkpoint: 0, missions_completed: 0, xp_earned: 0, coins_earned: 0 })
  } catch {
    return NextResponse.json({ checkpoint: 0, missions_completed: 0, xp_earned: 0, coins_earned: 0 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { phaseId: string } }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const supabase = createClient(supabaseUrl, supabaseKey)
  const userId = token.id as string
  const phaseId = parseInt(params.phaseId)

  const { checkpoint, missions_completed, xp_earned, coins_earned } = await request.json()

  try {
    // Upsert checkpoint record
    const { error: cpError } = await supabase
      .from('phase_checkpoints')
      .upsert(
        {
          user_id: userId,
          phase_id: phaseId,
          checkpoint,
          missions_completed,
          xp_earned: xp_earned ?? 0,
          coins_earned: coins_earned ?? 0,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,phase_id' }
      )

    if (cpError) return NextResponse.json({ error: cpError.message }, { status: 500 })

    // Increment xp_total and coins_balance on the users table
    if (xp_earned || coins_earned) {
      // Read current values first
      const { data: userRow } = await supabase
        .from('users')
        .select('xp_total, coins_balance')
        .eq('id', userId)
        .single()

      if (userRow) {
        await supabase
          .from('users')
          .update({
            xp_total: (userRow.xp_total ?? 0) + (xp_earned ?? 0),
            coins_balance: (userRow.coins_balance ?? 0) + (coins_earned ?? 0),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
