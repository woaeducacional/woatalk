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
