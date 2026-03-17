// @ts-nocheck
/**
 * Exemplo de Integração com Resend para Envio de Email Real
 * 
 * Passo 1: Instalar Resend
 * npm install resend
 * 
 * Passo 2: Configurar variável de ambiente
 * RESEND_API_KEY=re_test_seu_token_aqui
 * 
 * Passo 3: Usar este arquivo em app/api/auth/send-code/route.ts
 */

import { Resend } from 'resend'

// Instanciar cliente Resend
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Enviar email com código OTP usando Resend
 * 
 * @param email - Email do destinatário
 * @param code - Código OTP de 6 dígitos
 * @returns Promise com resultado do envio
 */
export async function sendOTPEmail(email: string, code: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@woa-talk.com', // Alterar para seu domínio
      to: email,
      subject: 'Seu código de verificação WOA Talk - 10 minutos',
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: Arial, sans-serif; background: #f3f4f6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .card { background: white; border-radius: 8px; padding: 40px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .logo { font-size: 32px; margin-bottom: 20px; }
              h1 { color: #1e3a8a; font-size: 24px; margin-bottom: 10px; }
              .description { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
              .code { background: #dbeafe; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 30px 0; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af; font-family: monospace; }
              .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px; text-align: left; font-size: 12px; color: #92400e; }
              .footer { color: #9ca3af; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
              .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; margin: 20px 0; font-weight: bold; }
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
                  Ignore esta mensagem ou <a href="https://woa-talk.com/report" style="color: #3b82f6;">reporte como spam</a>
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
      console.error('Resend error:', error)
      return { success: false, error: error.message }
    }

    console.log(`✅ Email enviado com sucesso. ID: ${data?.id}`)
    return { success: true, id: data?.id }
  } catch (error: any) {
    console.error('Error sending email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Versão com template personalizado usando Resend Templates
 * 
 * Passo 1: Criar template no dashboard Resend
 * Passo 2: Copiar Template ID
 * Passo 3: Usar este código
 */
export async function sendOTPEmailWithTemplate(email: string, code: string, templateId: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'noreply@woa-talk.com',
      to: email,
      template: { id: templateId },
      react: undefined as any,
      subject: 'Seu código WOA Talk',
    } as any)

    if (error) {
      console.error('Resend template error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, id: data?.id }
  } catch (error: any) {
    console.error('Error sending template email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * EXEMPLO: Como usar em app/api/auth/send-code/route.ts
 */

/*
import { sendOTPEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = await sendCodeSchema.parseAsync(body)

    const user = await getUserByEmail(validatedData.email)
    if (!user) {
      return NextResponse.json({ error: 'Email não encontrado' }, { status: 404 })
    }

    if (hasOTPPending(validatedData.email)) {
      return NextResponse.json(
        { error: 'Um código já foi enviado recentemente. Aguarde alguns minutos.' },
        { status: 429 }
      )
    }

    const code = generateOTP()
    storeOTP(validatedData.email, code)

    // ENVIAR EMAIL REAL (substituir log do console)
    const emailResult = await sendOTPEmail(validatedData.email, code)
    
    if (!emailResult.success) {
      return NextResponse.json(
        { error: 'Erro ao enviar código. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Código enviado com sucesso',
        email: validatedData.email,
      },
      { status: 200 }
    )
  } catch (error: any) {
    // ... tratamento de erro
  }
}
*/

/**
 * ALTERNATIVA: SendGrid
 * 
 * npm install @sendgrid/mail
 */

import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export async function sendOTPEmailWithSendGrid(email: string, code: string) {
  try {
    const msg = {
      to: email,
      from: 'noreply@woa-talk.com', // Deve estar verificado no SendGrid
      subject: 'Seu código de verificação WOA Talk',
      html: `
        <h1>Código de Verificação</h1>
        <p>Use este código para verificar sua conta:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>Este código expira em 10 minutos.</p>
        <p>⚠️ Nunca compartilhe este código!</p>
      `,
      text: `Código de verificação: ${code}\nExpira em 10 minutos.`,
    }

    await sgMail.send(msg)
    console.log(`✅ Email enviado via SendGrid`)
    return { success: true }
  } catch (error: any) {
    console.error('SendGrid error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * ALTERNATIVA: AWS SES
 * 
 * npm install @aws-sdk/client-ses
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' })

export async function sendOTPEmailWithAWSSES(email: string, code: string) {
  try {
    const command = new SendEmailCommand({
      Source: 'noreply@woa-talk.com',
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: 'Seu código de verificação WOA Talk',
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: `
              <h1>Código de Verificação</h1>
              <p>Use este código para verificar sua conta:</p>
              <p style="font-size: 32px; font-weight: bold;">${code}</p>
              <p>Este código expira em 10 minutos.</p>
            `,
            Charset: 'UTF-8',
          },
          Text: {
            Data: `Código: ${code}\nExpira em 10 minutos.`,
            Charset: 'UTF-8',
          },
        },
      },
    })

    await sesClient.send(command)
    console.log(`✅ Email enviado via AWS SES`)
    return { success: true }
  } catch (error: any) {
    console.error('AWS SES error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * LISTA DE PROVEDORES RECOMENDADOS
 * 
 * 1. Resend (RECOMENDADO para desenvolvimento)
 *    - Gratuito até 100 emails/dia
 *    - Simples de usar
 *    - Ótima documentação
 *    - URL: resend.com
 * 
 * 2. SendGrid
 *    - Gratuito até 100 emails/dia
 *    - Maior escalabilidade
 *    - URL: sendgrid.com
 * 
 * 3. AWS SES
 *    - Muito barato
 *    - Integração com AWS
 *    - URL: aws.amazon.com/ses
 * 
 * 4. Brevo (anteriormente Sendinblue)
 *    - Gratuito até 300 emails/dia
 *    - Bom suporte
 *    - URL: brevo.com
 * 
 * 5. MailerSend
 *    - Gratuito até 1000 emails/mês
 *    - Boas templates
 *    - URL: mailersend.com
 */
