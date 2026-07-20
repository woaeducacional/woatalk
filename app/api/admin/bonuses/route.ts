import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const { data, error } = await supabase
    .from('user_bonuses')
    .select(`
      id, plan_type, granted_at, expires_at,
      users!user_bonuses_user_id_fkey ( id, name, email, avatar_url ),
      granted_by_user:users!user_bonuses_granted_by_fkey ( id, name )
    `)
    .order('granted_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bonuses: data ?? [] })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const { user_id, plan_type } = await req.json()
  if (!user_id || !plan_type) return NextResponse.json({ error: 'user_id e plan_type são obrigatórios' }, { status: 400 })
  if (!['starter', 'premium'].includes(plan_type)) return NextResponse.json({ error: 'plan_type inválido' }, { status: 400 })

  const adminId = (session.user as { id?: string }).id ?? null

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const { data: bonus, error: bonusErr } = await supabase
    .from('user_bonuses')
    .insert({ user_id, plan_type, granted_by: adminId, expires_at: expiresAt.toISOString() })
    .select()
    .single()

  if (bonusErr) return NextResponse.json({ error: bonusErr.message }, { status: 500 })

  const { data: currentUser, error: userFetchErr } = await supabase
    .from('users')
    .select('subscription_current_period_end')
    .eq('id', user_id)
    .single()

  if (userFetchErr) return NextResponse.json({ error: userFetchErr.message }, { status: 500 })

  const currentEnd = currentUser?.subscription_current_period_end
    ? new Date(currentUser.subscription_current_period_end)
    : null

  const newEnd = currentEnd && currentEnd > expiresAt ? currentEnd : expiresAt

  const planMap: Record<string, string> = {
    starter: 'starter_monthly',
    premium: 'premium_monthly',
  }

  const { error: updateErr } = await supabase
    .from('users')
    .update({
      subscription_plan: planMap[plan_type],
      subscription_status: 'active',
      subscription_current_period_end: newEnd.toISOString(),
    })
    .eq('id', user_id)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json({ bonus }, { status: 201 })
}
