import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
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
  winner_confirmed: false,
  first_place_prize: 'Prêmio 1º lugar - A definir',
  second_place_prize: 'Prêmio 2º lugar - A definir',
  third_place_prize: 'Prêmio 3º lugar - A definir',
  campaign_start_date: new Date().toISOString(),
  campaign_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
}

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'admin') throw new Error('Unauthorized')
}

export async function GET() {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ ...DEFAULT_CONFIG }, { status: 401 })
  }

  try {
    const { data } = await supabase
      .from('challenge_config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ ...(DEFAULT_CONFIG), ...(data ?? {}) })
  } catch (error) {
    console.error('GET /api/admin/challenge-config error:', error)
    return NextResponse.json({ ...DEFAULT_CONFIG }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = {
      daily_reward: String(body.daily_reward ?? DEFAULT_CONFIG.daily_reward),
      weekly_reward: String(body.weekly_reward ?? DEFAULT_CONFIG.weekly_reward),
      monthly_reward: String(body.monthly_reward ?? DEFAULT_CONFIG.monthly_reward),
      monthly_winner_name: String(body.monthly_winner_name ?? DEFAULT_CONFIG.monthly_winner_name),
      monthly_winner_user_id: body.monthly_winner_user_id ?? null,
      monthly_winner_badge: String(body.monthly_winner_badge ?? DEFAULT_CONFIG.monthly_winner_badge),
      monthly_winner_note: String(body.monthly_winner_note ?? DEFAULT_CONFIG.monthly_winner_note),
      winner_confirmed: Boolean(body.winner_confirmed ?? false),
      first_place_prize: String(body.first_place_prize ?? DEFAULT_CONFIG.first_place_prize),
      second_place_prize: String(body.second_place_prize ?? DEFAULT_CONFIG.second_place_prize),
      third_place_prize: String(body.third_place_prize ?? DEFAULT_CONFIG.third_place_prize),
      campaign_start_date: body.campaign_start_date ?? DEFAULT_CONFIG.campaign_start_date,
      campaign_end_date: body.campaign_end_date ?? DEFAULT_CONFIG.campaign_end_date,
    }

    const { data: existing } = await supabase
      .from('challenge_config')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing?.id) {
      const { data, error } = await supabase
        .from('challenge_config')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return NextResponse.json({ config: data })
    }

    const { data, error } = await supabase
      .from('challenge_config')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ config: data })
  } catch (error) {
    console.error('POST /api/admin/challenge-config error:', error)
    return NextResponse.json({ error: 'Erro ao salvar configuração dos desafios' }, { status: 500 })
  }
}
