import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

const DEFAULT_CONFIG = {
  daily_reward: 'XP + WOA Coins + Streak',
  weekly_reward: 'XP + WOA Coins + Badge semanal',
  monthly_reward: 'XP + WOA Coins + Badge mensal',
  monthly_winner_name: 'A definir',
  monthly_winner_user_id: null,
  monthly_winner_badge: 'Vencedor mensal',
  monthly_winner_note: 'Conquista do melhor desempenho do mês',
}

export async function GET() {
  try {
    const { data } = await supabase
      .from('challenge_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ ...(DEFAULT_CONFIG), ...(data ?? {}) })
  } catch (error) {
    console.error('GET /api/public/challenge-config error:', error)
    return NextResponse.json({ ...DEFAULT_CONFIG }, { status: 500 })
  }
}
