import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Valida se as variáveis de ambiente do Resend estão configuradas
 */
function validateResendConfig(): { valid: boolean; error?: string } {
  if (!process.env.RESEND_API_KEY) {
    return { valid: false, error: 'RESEND_API_KEY não configurada em .env.local' }
  }
  if (!process.env.RESEND_FROM_EMAIL) {
    return { valid: false, error: 'RESEND_FROM_EMAIL não configurada em .env.local' }
  }
  return { valid: true }
}

export async function sendOTPEmail(email: string, code: string) {
  try {
    const validation = validateResendConfig()
    console.log('📧 [EMAIL] Config válida:', validation.valid, '| API_KEY existe:', !!process.env.RESEND_API_KEY, '| FROM:', process.env.RESEND_FROM_EMAIL)
    
    if (!validation.valid) {
      console.error('❌', validation.error)
      return { success: false, error: 'Email service not configured' }
    }

    console.log('📧 [EMAIL] Enviando para:', email, '| from:', process.env.RESEND_FROM_EMAIL)

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Seu código de verificação WOA Talk - 10 minutos',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .card { background: white; border-radius: 8px; padding: 40px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .logo { font-size: 32px; margin-bottom: 20px; }
              h1 { color: #1e3a8a; font-size: 24px; margin-bottom: 10px; }
              .description { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
              .code { background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 30px 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af; font-family: monospace; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px; text-align: left; font-size: 12px; color: #92400e; }
              .footer { color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="logo">🌊</div>
                <h1>Código de Verificação</h1>
                <p class="description">Use este código para verificar sua conta no WOA Talk</p>
                
                <div class="code">${code}</div>
                
                <p style="color: #6b7280; font-size: 14px;">
                  Este código expira em <strong>10 minutos</strong>
                </p>
                
                <div class="warning">
                  ⚠️ <strong>Aviso:</strong> Nunca compartilhe este código com ninguém. A equipe WOA Talk nunca pedirá este código por email ou mensagem.
                </div>
                
                <p style="color: #6b7280; font-size: 13px; margin-top: 20px;">
                  Não solicitou este código?<br/>
                  Ignore esta mensagem - sua conta está segura.
                </p>
                
                <div class="footer">
                  <p>© 2026 WOA Talk. Todos os direitos reservados.</p>
                  <p>Este é um email automático. Por favor, não responda.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Seu código de verificação WOA Talk: ${code}\n\nEste código expira em 10 minutos.\n\nNunca compartilhe este código com ninguém.`,
    })

    if (error) {
      console.error('📧 [EMAIL] Erro Resend:', error)
      return { success: false, error: error.message }
    }

    console.log('📧 [EMAIL] Enviado com sucesso! ID:', data?.id)
    return { success: true, id: data?.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function sendPasswordResetEmail(email: string, code: string) {
  try {
    const validation = validateResendConfig()
    if (!validation.valid) {
      console.error('❌', validation.error)
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Redefinição de senha WOA Talk',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: Arial, sans-serif; background: #f3f4f6; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .card { background: white; border-radius: 8px; padding: 40px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .logo { font-size: 32px; margin-bottom: 20px; }
              h1 { color: #1e3a8a; font-size: 24px; margin-bottom: 10px; }
              .description { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
              .code { background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #92400e; font-family: monospace; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px; text-align: left; font-size: 12px; color: #92400e; }
              .footer { color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="logo">🔐</div>
                <h1>Redefinição de Senha</h1>
                <p class="description">Use este código para redefinir sua senha no WOA Talk</p>

                <div class="code">${code}</div>

                <p style="color: #6b7280; font-size: 14px;">
                  Este código expira em <strong>10 minutos</strong>
                </p>

                <div class="warning">
                  ⚠️ <strong>Aviso:</strong> Se você não solicitou a redefinição de senha, ignore este email. Sua conta continua segura.
                </div>

                <div class="footer">
                  <p>© 2026 WOA Talk. Todos os direitos reservados.</p>
                  <p>Este é um email automático. Por favor, não responda.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `Código de redefinição de senha WOA Talk: ${code}\n\nEste código expira em 10 minutos.\n\nSe você não solicitou isso, ignore este email.`,
    })

    if (error) {
      console.error('🔑 [RESET EMAIL] Erro Resend:', error)
      return { success: false, error: error.message }
    }

    console.log('🔑 [RESET EMAIL] Enviado com sucesso! ID:', data?.id)
    return { success: true, id: data?.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function sendEvolutionEmail(
  email: string,
  userName: string,
  stats: {
    xpTotal: number
    coinsBalance: number
    streakCount: number
    currentPhase: number
  }
) {
  try {
    const validation = validateResendConfig()
    if (!validation.valid) {
      console.error('❌', validation.error)
      return { success: false, error: 'Email service not configured' }
    }

    // Emojis de motivação baseado no streak
    let streakEmoji = '🔥'
    if (stats.streakCount === 0) streakEmoji = '⚡'
    else if (stats.streakCount < 3) streakEmoji = '💪'
    else if (stats.streakCount < 7) streakEmoji = '🔥'
    else streakEmoji = '⭐'

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: `${streakEmoji} Sua evolução em WOA Talk - Continua assim!`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #00D4FF; padding-bottom: 20px; }
              .logo { font-size: 48px; margin: 0 0 15px 0; }
              h1 { color: #1e3a8a; font-size: 28px; margin: 0; font-weight: bold; }
              .greeting { color: #00D4FF; font-size: 18px; margin-top: 10px; }
              
              .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0; }
              .stat-box { background: linear-gradient(135deg, #00D4FF15 0%, #00FF8815 100%); border-left: 4px solid #00D4FF; padding: 20px; border-radius: 8px; text-align: center; }
              .stat-value { font-size: 32px; font-weight: bold; color: #00D4FF; margin: 5px 0; }
              .stat-label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
              
              .streak { grid-column: 1 / -1; background: linear-gradient(135deg, #FF6B9D15 0%, #FFD70015 100%); border-left: 4px solid #FF6B9D; }
              .streak-value { font-size: 36px; font-weight: bold; color: #FF6B9D; }
              
              .message { background: #f0f9ff; border-left: 4px solid #00D4FF; padding: 20px; border-radius: 8px; margin: 25px 0; color: #1e3a8a; line-height: 1.6; }
              .message strong { color: #00D4FF; }
              
              .cta-button { display: inline-block; background: linear-gradient(135deg, #00D4FF 0%, #00FF88 100%); color: white; padding: 14px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; text-align: center; }
              .cta-button:hover { transform: scale(1.05); }
              
              .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
              .footer p { margin: 5px 0; }
              
              .phase-info { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #6b7280; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div class="logo">🌊</div>
                  <h1>Sua Ofensiva em WOA Talk</h1>
                  <div class="greeting">Olá, ${userName}! 👋</div>
                </div>

                <div class="stats">
                  <div class="stat-box">
                    <div class="stat-label">⭐ XP Total</div>
                    <div class="stat-value">${stats.xpTotal.toLocaleString('pt-BR')}</div>
                  </div>
                  
                  <div class="stat-box">
                    <div class="stat-label">💰 Moedas</div>
                    <div class="stat-value">${stats.coinsBalance.toLocaleString('pt-BR')}</div>
                  </div>
                  
                  <div class="stat-box streak">
                    <div class="stat-label">${streakEmoji} Sequência de Dias</div>
                    <div class="streak-value">${stats.streakCount} dias</div>
                  </div>
                </div>

                <div class="message">
                  <strong>🎯 Você está evoluindo!</strong> Seus pontos e moedas mostram dedicação. 
                  ${stats.streakCount >= 7 
                    ? 'Que sequência incrível! Continue firme! ⭐' 
                    : stats.streakCount >= 3 
                    ? 'Sua sequência está crescendo! Mantenha o ritmo! 💪' 
                    : 'Todo dia é uma oportunidade para recomeçar. Vamos lá! ⚡'}
                </div>

                <div class="phase-info">
                  📍 <strong>Fase Atual:</strong> Phase ${stats.currentPhase} | 
                  Continue explorando para desbloquear novas áreas e desafios!
                </div>

                <center>
                  <a href="${process.env.NEXTAUTH_URL || 'https://woatalk.com'}/dashboard" class="cta-button">
                    Voltar a Aprender
                  </a>
                </center>

                <div class="message" style="background: #fef3c7; border-color: #f59e0b; color: #92400e;">
                  <strong>💡 Dica:</strong> Acesse diariamente para manter sua sequência e ganhar mais recompensas!
                </div>

                <div class="footer">
                  <p>© 2026 WOA Talk. Todos os direitos reservados.</p>
                  <p>Este é um email automático. Por favor, não responda.</p>
                  <p><a href="${process.env.NEXTAUTH_URL || 'https://woatalk.com'}/profile" style="color: #3b82f6;">Gerenciar notificações</a></p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Sua Ofensiva em WOA Talk

Olá ${userName}!

Estatísticas:
- XP Total: ${stats.xpTotal}
- Moedas: ${stats.coinsBalance}
- Sequência: ${stats.streakCount} dias
- Fase: ${stats.currentPhase}

Você está evoluindo! Continue assim para ganhar mais recompensas.

Volte a aprender em: ${process.env.NEXTAUTH_URL || 'https://woatalk.com'}/dashboard
      `,
    })

    if (error) {
      console.error('📊 [EVOLUTION EMAIL] Erro Resend:', error)
      return { success: false, error: error.message }
    }

    console.log('📊 [EVOLUTION EMAIL] Enviado com sucesso para:', email, '| ID:', data?.id)
    return { success: true, id: data?.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function sendWelcomeEmail(email: string, userName: string) {
  try {
    const validation = validateResendConfig()
    if (!validation.valid) {
      console.error('❌', validation.error)
      return { success: false, error: 'Email service not configured' }
    }

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: '🌊 Bem-vindo ao WOA Talk! Sua jornada começa agora',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; background: linear-gradient(135deg, #00D4FF 0%, #00FF88 100%); padding: 30px; border-radius: 8px; }
              .logo { font-size: 64px; margin: 0 0 15px 0; }
              h1 { color: white; font-size: 32px; margin: 0; font-weight: bold; }
              .greeting { color: rgba(255,255,255,0.9); font-size: 18px; margin-top: 10px; }
              
              .features { margin: 30px 0; }
              .feature-item { display: flex; gap: 15px; margin: 20px 0; padding: 15px; background: #f0f9ff; border-left: 4px solid #00D4FF; border-radius: 8px; }
              .feature-emoji { font-size: 32px; flex-shrink: 0; }
              .feature-text { color: #1e3a8a; }
              .feature-text strong { color: #00D4FF; }
              
              .highlight { background: linear-gradient(135deg, #FFD70015 0%, #FF6B9D15 100%); border: 1px solid #FFD70050; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .highlight strong { color: #FF6B9D; }
              
              .cta-button { display: inline-block; background: linear-gradient(135deg, #00D4FF 0%, #00FF88 100%); color: white; padding: 16px 50px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; text-align: center; font-size: 16px; }
              .cta-button:hover { transform: scale(1.05); box-shadow: 0 8px 24px rgba(0,212,255,0.3); }
              
              .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
              .stat { background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; }
              .stat-emoji { font-size: 32px; margin-bottom: 8px; }
              .stat-label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
              .stat-value { font-size: 20px; font-weight: bold; color: #00D4FF; margin-top: 5px; }
              
              .tips { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .tips strong { color: #92400e; }
              .tips ul { margin: 10px 0; padding-left: 20px; color: #92400e; }
              .tips li { margin: 8px 0; }
              
              .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
              .footer p { margin: 5px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="card">
                <div class="header">
                  <div class="logo">🌊</div>
                  <h1>Bem-vindo!</h1>
                  <div class="greeting">Olá, ${userName}! Sua jornada no WOA Talk começou 🚀</div>
                </div>

                <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                  Parabéns por se juntar a <strong style="color: #00D4FF;">WOA Talk</strong>! Você agora faz parte de uma comunidade dedicada a aprender, crescer e evoluir juntos.
                </p>

                <div class="features">
                  <div class="feature-item">
                    <div class="feature-emoji">🎓</div>
                    <div class="feature-text">
                      <strong>Aprenda no seu ritmo</strong><br/>
                      Acesso a fases, lições e desafios personalizados
                    </div>
                  </div>

                  <div class="feature-item">
                    <div class="feature-emoji">⭐</div>
                    <div class="feature-text">
                      <strong>Ganhe recompensas</strong><br/>
                      Acumule XP, moedas e desbloqueie badges exclusivas
                    </div>
                  </div>

                  <div class="feature-item">
                    <div class="feature-emoji">👥</div>
                    <div class="feature-text">
                      <strong>Comunidade ativa</strong><br/>
                      Conecte-se com outros usuários nos 4 grupos de chat
                    </div>
                  </div>

                  <div class="feature-item">
                    <div class="feature-emoji">🔥</div>
                    <div class="feature-text">
                      <strong>Mantenha sua sequência</strong><br/>
                      Acesse diariamente para manter sua sequência viva
                    </div>
                  </div>
                </div>

                <div class="highlight">
                  <strong>🎁 Bônus de boas-vindas</strong><br/>
                  Você começa com alguns XP e moedas para explorar! Use-os com sabedoria.
                </div>

                <div class="stats-grid">
                  <div class="stat">
                    <div class="stat-emoji">⚡</div>
                    <div class="stat-label">Status</div>
                    <div class="stat-value">Iniciante</div>
                  </div>
                  <div class="stat">
                    <div class="stat-emoji">🌊</div>
                    <div class="stat-label">Fase Atual</div>
                    <div class="stat-value">Phase 1</div>
                  </div>
                </div>

                <center>
                  <a href="${process.env.NEXTAUTH_URL || 'https://woatalk.com'}/dashboard" class="cta-button">
                    Começar sua Jornada
                  </a>
                </center>

                <div class="tips">
                  <strong>💡 Dicas para aproveitar melhor:</strong>
                  <ul>
                    <li>✅ Complete as lições diárias para manter seu streak vivo</li>
                    <li>✅ Participe dos grupos de chat para networking e aprendizado</li>
                    <li>✅ Você receberá emails 2x por semana com suas estatísticas</li>
                    <li>✅ Explore todas as fases para desbloquear novos desafios</li>
                  </ul>
                </div>

                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Se tiver dúvidas ou precisar de suporte, sempre estaremos aqui para ajudar. Aproveite a jornada e divirta-se aprendendo! 🚀
                </p>

                <div class="footer">
                  <p><strong>✅ Sistema de Emails Funcionando!</strong></p>
                  <p>© 2026 WOA Talk. Todos os direitos reservados.</p>
                  <p>Este é um email automático. Por favor, não responda.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Bem-vindo ao WOA Talk, ${userName}!

Sua jornada começou! 🚀

Você agora tem acesso a:
- Fases e lições personalizadas
- Comunidade de usuários ativos
- Sistema de recompensas (XP, moedas, badges)
- 4 grupos de chat para conectar-se

Dicas:
✅ Complete as lições diárias para manter sua sequência
✅ Participe dos grupos de chat
✅ Você receberá emails 2x por semana com suas estatísticas

Começar: ${process.env.NEXTAUTH_URL || 'https://woatalk.com'}/dashboard

Divirta-se! 🌊
      `,
    })

    if (error) {
      console.error('🎉 [WELCOME EMAIL] Erro Resend:', error)
      return { success: false, error: error.message }
    }

    console.log('🎉 [WELCOME EMAIL] Enviado com sucesso para:', email, '| ID:', data?.id)
    return { success: true, id: data?.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
