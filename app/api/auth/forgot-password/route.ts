import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserByEmail } from '@/lib/db'
import { generateOTP, storeOTP, hasOTPPending } from '@/lib/otp'
import { sendPasswordResetEmail } from '@/lib/email'

const schema = z.object({
  email: z.string().email('Email inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = schema.parse(body)

    // Always respond with success to avoid email enumeration
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ message: 'Se esse email estiver cadastrado, você receberá o código.' }, { status: 200 })
    }

    if (await hasOTPPending(`reset:${email}`)) {
      return NextResponse.json(
        { error: 'Um código já foi enviado. Aguarde alguns minutos antes de tentar novamente.' },
        { status: 429 }
      )
    }

    const code = generateOTP()
    await storeOTP(`reset:${email}`, code, 10)

    const emailResult = await sendPasswordResetEmail(email, code)
    if (!emailResult.success) {
      return NextResponse.json({ error: 'Erro ao enviar o código. Tente novamente.' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Se esse email estiver cadastrado, você receberá o código.' }, { status: 200 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
