const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const AVATARS_PUBLIC_PREFIX = '/storage/v1/object/public/avatars/'

export function normalizeStoredAvatarPath(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed

  if (/^https?:\/\//i.test(trimmed)) {
    const marker = AVATARS_PUBLIC_PREFIX
    const idx = trimmed.indexOf(marker)
    if (idx >= 0) {
      return trimmed.slice(idx + marker.length).replace(/^\/+/, '')
    }
  }

  return trimmed.replace(/^\/+/, '')
}

export function resolveAvatarUrl(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null
  const avatar = rawValue.trim()
  if (!avatar) return null

  if (/^https?:\/\//i.test(avatar)) return avatar
  if (!SUPABASE_URL) return null

  return `${SUPABASE_URL}${AVATARS_PUBLIC_PREFIX}${normalizeStoredAvatarPath(avatar)}`
}
