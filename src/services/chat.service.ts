import { supabase } from '../lib/supabaseClient'

export interface ChatGroup {
  id: string
  name: string
  emoji: string
  color: string
  description: string
}

export interface ChatMessage {
  id: string
  group_id: string
  user_id: string
  content: string
  created_at: string
  user_name: string
  user_avatar: string | null
}

function db() {
  if (!supabase) throw new Error('Supabase not available')
  return supabase
}

export async function fetchGroupById(groupId: string): Promise<ChatGroup | null> {
  const { data, error } = await db()
    .from('chat_groups')
    .select('id, name, emoji, color, description')
    .eq('id', groupId)
    .single()
  if (error) return null
  return data as ChatGroup
}

export async function fetchAllGroups(): Promise<ChatGroup[]> {
  const { data, error } = await db()
    .from('chat_groups')
    .select('id, name, emoji, color, description')
  if (error) return []
  return (data ?? []) as ChatGroup[]
}

export async function fetchLastMessages(groupId: string): Promise<ChatMessage[]> {
  const { data, error } = await db()
    .from('chat_messages')
    .select(`
      id,
      group_id,
      user_id,
      content,
      created_at,
      users!chat_messages_user_id_fkey (name, avatar_url)
    `)
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error || !data) return []

  // Reverse so oldest-first for display
  const rows = (data as unknown as Array<{
    id: string
    group_id: string
    user_id: string
    content: string
    created_at: string
    users: { name: string; avatar_url: string | null }
  }>).reverse()

  return rows.map(row => ({
    id: row.id,
    group_id: row.group_id,
    user_id: row.user_id,
    content: row.content,
    created_at: row.created_at,
    user_name: row.users?.name ?? 'Anônimo',
    user_avatar: row.users?.avatar_url ?? null,
  }))
}

export async function insertMessage(
  groupId: string,
  userId: string,
  content: string
): Promise<{ error: string | null }> {
  const { error } = await db()
    .from('chat_messages')
    .insert({ group_id: groupId, user_id: userId, content })
  return { error: error?.message ?? null }
}

export async function trimToHundred(groupId: string): Promise<void> {
  // Keep only the 100 most recent messages for this group
  const { data } = await db()
    .from('chat_messages')
    .select('id')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .range(100, 200)

  if (!data || data.length === 0) return

  const idsToDelete = (data as { id: string }[]).map(r => r.id)
  await db().from('chat_messages').delete().in('id', idsToDelete)
}
