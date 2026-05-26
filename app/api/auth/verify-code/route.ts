import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailSchema } from '@/lib/validation'
import { verifyOTP } from '@/lib/otp'
import { getUserByEmail } from '@/lib/db'
import { apiService } from '@/lib/api.service'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar entrada
    const validatedData = await verifyEmailSchema.parseAsync(body)

    // Verificar código OTP
    const otpResult = await verifyOTP(validatedData.email, validatedData.code)

    if (!otpResult.valid) {
      return NextResponse.json(
        { error: otpResult.message },
        { status: 400 }
      )
    }

    // Buscar usuário e marcar email como verificado
    const user = await getUserByEmail(validatedData.email)
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Atualizar status de email verificado no banco de dados
    await apiService.setEmailVerified(user.id)

    // Enviar email de boas-vindas
    const welcomeResult = await sendWelcomeEmail(user.email, user.name)
    if (welcomeResult.success) {
      console.log('🎉 Email de boas-vindas enviado com sucesso para:', user.email)
    } else {
      console.warn('⚠️ Email de boas-vindas não foi enviado:', welcomeResult.error)
      // Não falha — o usuário ainda consegue fazer login mesmo sem receber o email de boas-vindas
    }

    return NextResponse.json(
      {
        message: 'Email verificado com sucesso',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 200 }
    )
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    console.error('Verify code error:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar código' },
      { status: 500 }
    )
  }
}
