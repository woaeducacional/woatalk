import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!supabase) return NextResponse.json({ error: 'DB not configured' }, { status: 503 })

  const { data, error } = await supabase
    .from('users')
    .select('subscription_plan, subscription_status')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let free = 0, starter = 0, premium = 0
  for (const u of data ?? []) {
    const active = u.subscription_status === 'active' && u.subscription_plan
    if (!active) { free++; continue }
    if (u.subscription_plan.includes('premium')) premium++
    else starter++
  }

  return NextResponse.json({ free, starter, premium })
}
