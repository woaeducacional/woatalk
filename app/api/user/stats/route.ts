import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export async function GET(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.id || !supabaseUrl || !supabaseKey) {
    return NextResponse.json({ xp_total: 0, coins_balance: 0, streak_count: 0 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { data, error } = await supabase
      .from('users')
      .select('xp_total, coins_balance, streak_count')
      .eq('id', token.id as string)
      .single()

    if (error || !data) return NextResponse.json({ xp_total: 0, coins_balance: 0, streak_count: 0 })
    return NextResponse.json({ xp_total: data.xp_total ?? 0, coins_balance: data.coins_balance ?? 0, streak_count: data.streak_count ?? 0 })
  } catch {
    return NextResponse.json({ xp_total: 0, coins_balance: 0, streak_count: 0 })
  }
}
