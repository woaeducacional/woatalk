const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const JOURNEY_ASSETS_PUBLIC_PREFIX = '/storage/v1/object/public/journey-assets/'

export function normalizeSupportScreenshotPath(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return trimmed

  if (/^https?:\/\//i.test(trimmed)) {
    const idx = trimmed.indexOf(JOURNEY_ASSETS_PUBLIC_PREFIX)
    if (idx >= 0) {
      return trimmed.slice(idx + JOURNEY_ASSETS_PUBLIC_PREFIX.length).replace(/^\/+/, '')
    }
  }

  return trimmed.replace(/^\/+/, '')
}

export function resolveSupportScreenshotUrl(rawValue: unknown): string | null {
  if (typeof rawValue !== 'string') return null
  const screenshot = rawValue.trim()
  if (!screenshot) return null

  if (/^https?:\/\//i.test(screenshot)) return screenshot
  if (!SUPABASE_URL) return null

  return `${SUPABASE_URL}${JOURNEY_ASSETS_PUBLIC_PREFIX}${normalizeSupportScreenshotPath(screenshot)}`
}
