/**
 * Serviço de erros de pronúncia.
 * Todas as funções são pequenas, com responsabilidade única e comentadas.
 * Acesso direto ao Supabase via service role (server-side apenas).
 */
import { createClient } from '@supabase/supabase-js'

// ── Cliente Supabase com service role (bypass de RLS) ──────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface PronunciationError {
  id: string
  user_id: string
  word: string
  sentence: string
  error_count: number
  ai_tip: string | null
  last_error_at: string
}

// ── Funções ────────────────────────────────────────────────────────────────

/**
 * Registra (ou incrementa) um erro de pronúncia para um usuário.
 * Usa upsert com UNIQUE(user_id, word) para evitar duplicatas.
 */
export async function upsertPronunciationError(
  userId: string,
  word: string,
  sentence: string,
): Promise<{ ok: boolean; error?: string }> {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!normalized) return { ok: true }

  const { error } = await supabase.rpc('upsert_pronunciation_error', {
    p_user_id: userId,
    p_word: normalized,
    p_sentence: sentence,
  })

  if (error) {
    // Fallback: insert direto se a função RPC não existir ainda
    const { error: insertError } = await supabase
      .from('pronunciation_errors')
      .upsert(
        {
          user_id: userId,
          word: normalized,
          sentence,
          error_count: 1,
          last_error_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,word',
          ignoreDuplicates: false,
        },
      )
    if (insertError) return { ok: false, error: insertError.message }
  }

  return { ok: true }
}

/**
 * Retorna a dica cacheada para uma palavra específica do usuário.
 * Se já existe, evita nova chamada à IA.
 */
export async function getCachedTip(
  userId: string,
  word: string,
): Promise<string | null> {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '')

  const { data } = await supabase
    .from('pronunciation_errors')
    .select('ai_tip')
    .eq('user_id', userId)
    .eq('word', normalized)
    .single()

  return data?.ai_tip ?? null
}

/**
 * Salva a dica gerada pela IA no banco (cache para evitar chamadas repetidas).
 */
export async function cacheTip(
  userId: string,
  word: string,
  tip: string,
): Promise<void> {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, '')

  await supabase
    .from('pronunciation_errors')
    .update({ ai_tip: tip })
    .eq('user_id', userId)
    .eq('word', normalized)
}

/**
 * Retorna os erros mais frequentes de um usuário, ordenados por error_count DESC.
 * Usado na tela /tutor.
 */
export async function getUserErrors(
  userId: string,
  limit = 15,
): Promise<PronunciationError[]> {
  const { data, error } = await supabase
    .from('pronunciation_errors')
    .select('id, user_id, word, sentence, error_count, ai_tip, last_error_at')
    .eq('user_id', userId)
    .order('error_count', { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data as PronunciationError[]
}
