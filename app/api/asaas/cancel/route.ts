import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { createClient } from '@supabase/supabase-js'
import { cancelSubscription } from '@/lib/asaas'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('subscription_id, subscription_status')
    .eq('id', session.user.id)
    .single()

  if (userError || !user?.subscription_id) {
    return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada' }, { status: 400 })
  }

  let canceledOnAsaas = false
  try {
    await cancelSubscription(user.subscription_id)
    canceledOnAsaas = true
    console.log('[AsaasCancel] ✅ Assinatura cancelada no Asaas:', user.subscription_id)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[AsaasCancel] ⚠ Falha ao cancelar subscription; tentando cancelar autorização Pix Automático:', message)

    try {
      await cancelPixAutomaticAuthorization(user.subscription_id)
      canceledOnAsaas = true
      console.log('[AsaasCancel] ✅ Autorização Pix Automático cancelada no Asaas:', user.subscription_id)
    } catch (authErr) {
      const authMessage = authErr instanceof Error ? authErr.message : String(authErr)
      console.error('[AsaasCancel] ❌ Erro ao cancelar autorização Pix Automático no Asaas:', authMessage)
      return NextResponse.json({ error: authMessage }, { status: 500 })
    }
  }

  const { error: dbError } = await supabase
    .from('users')
    .update({
      subscription_status: 'inactive',
      subscription_id: null,
      subscription_plan: null,
      subscription_current_period_end: null,
    })
    .eq('id', session.user.id)

  if (dbError) {
    console.error('[AsaasCancel] ❌ Erro ao atualizar DB:', dbError.message)
    return NextResponse.json({ error: 'Assinatura cancelada no Asaas, mas falha ao atualizar banco de dados' }, { status: 500 })
  }

  console.log('[AsaasCancel] ✅ Assinatura cancelada e DB atualizado:', session.user.id)
  return NextResponse.json({ success: true })
}
