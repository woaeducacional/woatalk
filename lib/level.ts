/**
 * calcLevel — converts raw XP total into level info.
 *
 * Rules:
 *   Levels 1–100 : each level costs 1 000 XP  (level 2 at 1 000, level 100 at 99 000)
 *   Levels 101+  : each level costs 10 000 XP (level 101 at 109 000, etc.)
 */
export function calcLevel(xpTotal: number) {
  const xp = Math.max(0, Math.floor(xpTotal))

  if (xp < 99_000) {
    // Levels 1–99  (each 1 000 XP)
    const level = Math.floor(xp / 1_000) + 1
    const xpIntoLevel = xp % 1_000
    const xpForLevel = 1_000
    const xpToNext = xpForLevel - xpIntoLevel
    const progress = Math.round((xpIntoLevel / xpForLevel) * 100)
    return { level, xpIntoLevel, xpForLevel, xpToNext, progress }
  }

  // Level 100+ (each 10 000 XP, starting from 99 000)
  const over = xp - 99_000
  const extra = Math.floor(over / 10_000)
  const level = 100 + extra
  const xpIntoLevel = over % 10_000
  const xpForLevel = 10_000
  const xpToNext = xpForLevel - xpIntoLevel
  const progress = Math.round((xpIntoLevel / xpForLevel) * 100)
  return { level, xpIntoLevel, xpForLevel, xpToNext, progress }
}
