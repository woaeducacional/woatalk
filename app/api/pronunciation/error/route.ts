/**
 * POST /api/pronunciation/error
 * Registra um erro de pronúncia de palavra para o usuário autenticado.
 * Body: { word: string, sentence: string }
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { upsertPronunciationError } from '@/src/services/pronunciation.service'

export async function POST(req: NextRequest) {
  // Valida sessão do usuário
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const { word, sentence } = body ?? {}

  if (!word || typeof word !== 'string') {
    return NextResponse.json({ error: 'word is required' }, { status: 400 })
  }

  const result = await upsertPronunciationError(
    session.user.id,
    word,
    sentence ?? '',
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
