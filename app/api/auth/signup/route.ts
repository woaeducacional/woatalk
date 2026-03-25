import { NextRequest, NextResponse } from 'next/server'
import { signUpSchema } from '@/lib/validation'
import { createUser, getUserByEmail } from '@/lib/db'
import { generateOTP, storeOTP } from '@/lib/otp'
import { sendOTPEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validatedData = await signUpSchema.parseAsync(body)

    // Check if user already exists
    const existingUser = await getUserByEmail(validatedData.email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já está registrado' },
        { status: 400 }
      )
    }

    // Create new user
    try {
      const user = await createUser(
        validatedData.email,
        validatedData.name,
        validatedData.password
      )

      // Gerar e enviar código OTP para verificação de email
      const code = generateOTP()
      storeOTP(validatedData.email, code, 10) // Válido por 10 minutos

      const emailResult = await sendOTPEmail(validatedData.email, code)
      if (!emailResult.success) {
        console.warn('⚠️ Código OTP gerado mas email não foi enviado:', emailResult.error)
        // Não retorna erro — o código está armazenado e o usuário pode pedir para reenviar
      }

      return NextResponse.json(
        {
          message: 'Account created. Please verify your email.',
          requiresVerification: true,
          email: validatedData.email,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        },
        { status: 201 }
      )
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { 
          error: 'Erro ao criar usuário. Verifique as variáveis de ambiente.',
          isUsingFallback: true 
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar cadastro',
        message: error.message 
      },
      { status: 500 }
    )
  }
}
