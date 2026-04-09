import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUserByEmail } from '@/lib/db'
import { deleteOTP } from '@/lib/otp'

const schema = z.object({ email: z.string().email() })

/**
 * POST /api/auth/skip-verification
 * Deletes the pending OTP so the user can log in without verifying.
 * email_verified stays false — dashboard will show the "verify" banner.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = await schema.parseAsync(body)

    // Confirm user exists before deleting OTP
    const user = await getUserByEmail(email)
    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    await deleteOTP(email)

    return NextResponse.json({ message: 'ok' }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Erro ao processar' }, { status: 500 })
  }
}
