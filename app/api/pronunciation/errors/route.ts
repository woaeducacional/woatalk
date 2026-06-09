/**
 * GET /api/pronunciation/errors
 * Retorna o histórico de erros de pronúncia do usuário autenticado.
 * Usado pela tela /tutor para exibir relatório personalizado.
 * Query param opcional: ?limit=15
 */
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { getUserErrors } from '@/src/services/pronunciation.service'

export async function GET(req: NextRequest) {
  // Valida sessão
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Limit opcional via query param (padrão: 15)
  const limitParam = req.nextUrl.searchParams.get('limit')
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 15

  const errors = await getUserErrors(session.user.id, limit)

  return NextResponse.json({ errors })
}
