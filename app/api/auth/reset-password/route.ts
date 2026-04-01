import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { verifyOTP } from '@/lib/otp'
import { apiService } from '@/lib/api.service'

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6, 'O código deve ter 6 dígitos'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, password } = schema.parse(body)

    const otpResult = await verifyOTP(`reset:${email}`, code)
    if (!otpResult.valid) {
      return NextResponse.json({ error: otpResult.message }, { status: 400 })
    }

    const updated = await apiService.updateUserPassword(email, password)
    if (!updated) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Senha redefinida com sucesso.' }, { status: 200 })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0]?.message ?? 'Dados inválidos' }, { status: 400 })
    }
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
