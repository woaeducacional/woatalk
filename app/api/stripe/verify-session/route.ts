import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { stripe } from '@/src/lib/stripe'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { sessionId } = await req.json()
  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId ausente' }, { status: 400 })
  }

  let checkoutSession
  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)
  } catch {
    return NextResponse.json({ error: 'Sessão Stripe inválida' }, { status: 400 })
  }

  // Garantir que a session pertence ao usuário autenticado
  if (checkoutSession.metadata?.userId !== session.user.id) {
    return NextResponse.json({ error: 'Sessão não pertence a este usuário' }, { status: 403 })
  }

  if (checkoutSession.payment_status !== 'paid' && checkoutSession.status !== 'complete') {
    return NextResponse.json({ error: 'Pagamento não confirmado' }, { status: 402 })
  }

  // Buscar subscription para status real (trialing ou active)
  let subStatus = 'active'
  let subscriptionId = checkoutSession.subscription as string | null

  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    subStatus = ['active', 'trialing'].includes(sub.status) ? 'active' : 'inactive'
  }

  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: subStatus,
      subscription_id: subscriptionId,
    })
    .eq('id', session.user.id)

  if (error) {
    console.error('[VerifySession] ❌ Erro ao atualizar DB:', error)
    return NextResponse.json({ error: 'Erro ao ativar premium' }, { status: 500 })
  }

  console.log('[VerifySession] ✅ Premium ativado para:', session.user.id, '| status:', subStatus)
  return NextResponse.json({ success: true, status: subStatus })
}
