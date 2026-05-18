import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/authOptions'
import { supabase } from '@/src/lib/supabaseClient'
import {
  fetchGroupById,
  fetchLastMessages,
  insertMessage,
  trimToHundred,
} from '@/src/services/chat.service'

async function resolveUserId(email: string): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.from('users').select('id').eq('email', email).single()
  return data?.id ?? null
}

type Params = { params: Promise<{ groupId: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { groupId } = await params

  const [group, messages] = await Promise.all([
    fetchGroupById(groupId),
    fetchLastMessages(groupId),
  ])

  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  return NextResponse.json({ group, messages })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { groupId } = await params

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = await resolveUserId(session.user.email)
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let body: { content?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content || content.length > 500) {
    return NextResponse.json({ error: 'Mensagem inválida (1–500 caracteres)' }, { status: 400 })
  }

  const group = await fetchGroupById(groupId)
  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 })
  }

  const { error } = await insertMessage(groupId, userId, content)
  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  // Fire-and-forget trim (no await needed on response path)
  trimToHundred(groupId).catch(() => {})

  return NextResponse.json({ success: true })
}
