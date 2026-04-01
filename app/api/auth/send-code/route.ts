import { NextRequest, NextResponse } from 'next/server'
import { sendCodeSchema } from '@/lib/validation'
import { getUserByEmail } from '@/lib/db'
import { generateOTP, storeOTP, hasOTPPending } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validar entrada
    const validatedData = await sendCodeSchema.parseAsync(body)

    // Verificar se usuário existe
    const User = await getUserByEmail(validatedData.email)
    
    if (!User) {
      return NextResponse.json(
        { error: 'Email não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se já há um código pendente (limitar spam)
    if (await hasOTPPending(validatedData.email)) {
      return NextResponse.json(
        { 
          error: 'Um código já foi enviado recentemente. Aguarde alguns minutos.' 
        },
        { status: 429 }
      )
    }

    // Gerar código OTP
    const code = generateOTP()
    await storeOTP(validatedData.email, code)

    // Enviar email com Resend
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
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      )
    }

    console.error('Send code error:', error)
    return NextResponse.json(
      { error: 'Erro ao enviar código' },
      { status: 500 }
    )
  }
}
