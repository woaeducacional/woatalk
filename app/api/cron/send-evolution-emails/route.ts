import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEvolutionEmail } from '@/lib/email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

/**
 * POST /api/cron/send-evolution-emails
 * 
 * Dispara emails de evolução (ofensiva) 2x por semana para todos os usuários
 * Pode ser chamado por:
 * - Vercel Cron (vercel.json)
 * - EasyCron / Cron-job.org
 * - IFTTT Webhooks
 * - Seu próprio sistema de cron
 * 
 * Requer autenticação via Bearer token (CRON_SECRET)
 */

export async function POST(req: NextRequest) {
  try {
    // Validar autenticação
    const authHeader = req.headers.get('authorization')
    const secret = process.env.CRON_SECRET
    
    if (!secret || authHeader !== `Bearer ${secret}`) {
      console.warn('🚫 [CRON] Tentativa de acesso sem autenticação')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📊 [CRON] Iniciando envio de emails de evolução...')

    // Buscar usuários que:
    // 1. Têm email verificado
    // 2. Não receberam email nos últimos 3 dias (2x por semana = a cada ~3.5 dias)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, xp_total, coins_balance, streak_count, current_phase')
      .eq('email_verified', true)
      .or(`last_evolution_email_sent_at.is.null,last_evolution_email_sent_at.lt.${threeDaysAgo}`)
      .limit(100) // Limitar para não sobrecarregar o serviço de email

    if (fetchError) {
      console.error('❌ [CRON] Erro ao buscar usuários:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!users || users.length === 0) {
      console.log('ℹ️ [CRON] Nenhum usuário para enviar email')
      return NextResponse.json({ message: 'No users to send emails to', count: 0 })
    }

    console.log(`📧 [CRON] Enviando emails para ${users.length} usuários...`)

    let successCount = 0
    let errorCount = 0
    const errors = []

    // Enviar email para cada usuário
    for (const user of users) {
      try {
        const result = await sendEvolutionEmail(user.email, user.name, {
          xpTotal: user.xp_total || 0,
          coinsBalance: user.coins_balance || 0,
          streakCount: user.streak_count || 0,
          currentPhase: user.current_phase || 1,
        })

        if (result.success) {
          // Atualizar timestamp de último email enviado
          await supabase
            .from('users')
            .update({ last_evolution_email_sent_at: new Date().toISOString() })
            .eq('id', user.id)

          successCount++
          console.log(`✅ Email enviado para: ${user.email}`)
        } else {
          errorCount++
          errors.push({ email: user.email, error: result.error })
          console.error(`❌ Falha ao enviar email para ${user.email}:`, result.error)
        }
      } catch (err) {
        errorCount++
        errors.push({ email: user.email, error: String(err) })
        console.error(`❌ Erro ao enviar email para ${user.email}:`, err)
      }

      // Pequeno delay para não sobrecarregar Resend
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`📊 [CRON] Resumo: ${successCount} sucesso, ${errorCount} erros`)

    return NextResponse.json({
      success: true,
      message: `Emails enviados com sucesso. ${successCount} enviados, ${errorCount} erros`,
      sent: successCount,
      failed: errorCount,
      errors: errorCount > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error('❌ [CRON] Erro geral:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET para testes e health check
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    status: 'ready',
    message: 'Cron endpoint is configured and ready',
    lastRun: new Date().toISOString(),
  })
}
