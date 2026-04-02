import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  await params // consume params
  return NextResponse.json({ checkpoint: 0, missions_completed: 0, xp_earned: 0, coins_earned: 0 })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ phaseId: string }> }
) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'DB not configured' }, { status: 500 })

  const supabase = createClient(supabaseUrl, supabaseKey)
  const userId = token.id as string
  await params // consume params

  const { xp_earned, coins_earned } = await request.json()

  try {
    if (xp_earned || coins_earned) {
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
