import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: user } = await supabase
    .from('users')
    .select('subscription_plan, subscription_current_period_end')
    .eq('id', session.user.id)
    .single()

  const plan = user?.subscription_plan ?? null

  return NextResponse.json({
    plan,
    currentPeriodEnd: user?.subscription_current_period_end ?? null,
    isPremium: plan !== null,
  })
}
