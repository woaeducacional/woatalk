/**
 * Plays text via Azure TTS (/api/tts).
 * Calls speechSynthesis as fallback if the API fails.
 *
 * @param text    - Text to speak
 * @param voice   - 'oliver' (GuyNeural) | 'alice' (JennyNeural)
 * @param rate    - 'normal' (-25%) | 'slow' (-40%) | 'superslow' (word-by-word)
 * @param onEnd   - Called when audio finishes playing
 * @param onStart - Called just before playback starts (after audio loads)
 */

// Cache client-side: evita nova requisição para o mesmo áudio já baixado
const ttsCache = new Map<string, ArrayBuffer>()

// Shared AudioContext — stays unlocked after unlockAudio() is called once
let sharedAudioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (sharedAudioCtx) return sharedAudioCtx
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioCtx) sharedAudioCtx = new AudioCtx()
  } catch { /* ignore */ }
  return sharedAudioCtx
}

/**
 * Unlocks iOS audio. Call once inside any button onClick before the first TTS.
 * Creates (or resumes) a shared AudioContext so subsequent playTTS calls work
 * without needing a new user gesture.
 */
export function unlockAudio(): void {
  const ctx = getAudioCtx()
  if (!ctx) return
  ctx.resume().catch(() => {})
}

/**
 * Pre-fetches TTS audio into the in-memory cache without playing.
 * Call from a gesture handler so subsequent playTTS is instant (no fetch delay).
 */
export async function prefetchTTS(
  text: string,
  voice: 'oliver' | 'alice',
  rate: 'normal' | 'slow' | 'superslow',
): Promise<void> {
  const cacheKey = `${voice}|${rate}|${text}`
  if (ttsCache.has(cacheKey)) return
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, rate }),
    })
    if (!res.ok) return
    const buffer = await res.arrayBuffer()
    ttsCache.set(cacheKey, buffer)
  } catch { /* silent */ }
}

export async function playTTS(
  text: string,
  voice: 'oliver' | 'alice',
  rate: 'normal' | 'slow' | 'superslow',
  onEnd: () => void,
  onStart?: () => void,
): Promise<void> {
  const cacheKey = `${voice}|${rate}|${text}`

  // ── 1. Fetch / cache buffer ───────────────────────────────────────────────
  let buffer: ArrayBuffer | undefined
  try {
    buffer = ttsCache.get(cacheKey)
    if (!buffer) {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, rate }),
      })
      if (!res.ok) throw new Error('TTS API error')
      buffer = await res.arrayBuffer()
      ttsCache.set(cacheKey, buffer)
    }
  } catch { /* fall through to speechSynthesis */ }

  if (buffer) {
    // ── 2a. Web Audio API (preferred on iOS — works after unlockAudio()) ─────
    const ctx = getAudioCtx()
    if (ctx && ctx.state === 'running') {
      try {
        const decoded = await ctx.decodeAudioData(buffer.slice(0))
        const source = ctx.createBufferSource()
        source.buffer = decoded
        source.connect(ctx.destination)
        let finished = false
        const safetyTimer = setTimeout(() => { if (!finished) { finished = true; onEnd() } }, 8000)
        source.onended = () => {
          if (!finished) { finished = true; clearTimeout(safetyTimer); onEnd() }
        }
        onStart?.()
        source.start(0)
        return
      } catch { /* fall through to HTMLAudio */ }
    }

    // ── 2b. HTMLAudioElement (fallback — needs fresh gesture on iOS) ──────────
    let playedViaAudio = false
    const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }))
    const audio = new Audio(url)
    let finished = false
    let safetyTimer: ReturnType<typeof setTimeout> | undefined = undefined

    const finish = () => {
      if (finished) return
      finished = true
      if (safetyTimer !== undefined) clearTimeout(safetyTimer)
      URL.revokeObjectURL(url)
      onEnd()
    }

    try {
      safetyTimer = setTimeout(finish, 8000)
      audio.onended = finish
      audio.onerror = finish
      onStart?.()
      await audio.play()
      playedViaAudio = true
    } catch {
      if (safetyTimer !== undefined) clearTimeout(safetyTimer)
      finished = true
      URL.revokeObjectURL(url)
    }

    if (playedViaAudio) return
  }

  // ── 3. Fallback: Web Speech API ───────────────────────────────────────────
  // (reached only if buffer fetch failed or all audio paths failed)
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd()
    return
  }

  // Cancel any stale/stuck iOS speech queue before starting
  window.speechSynthesis.cancel()

  if (rate === 'superslow') {
    const words = text.trim().split(/\s+/)
    let i = 0
    const speakNext = () => {
      if (i >= words.length) { onEnd(); return }
      const u = new SpeechSynthesisUtterance(words[i++])
      u.lang = 'en-US'
      u.rate = 0.85
      let wordEnded = false
      const wordFinish = () => { if (!wordEnded) { wordEnded = true; setTimeout(speakNext, 600) } }
      u.onend = wordFinish
      u.onerror = wordFinish
      // iOS safety: if onend never fires, advance after 2.5s per word
      setTimeout(wordFinish, 2500)
      if (i === 1) onStart?.()
      window.speechSynthesis.speak(u)
    }
    speakNext()
  } else {
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'
    u.rate = rate === 'slow' ? 0.6 : 0.8
    let utEnded = false
    const utFinish = () => { if (!utEnded) { utEnded = true; onEnd() } }
    u.onend = utFinish
    u.onerror = utFinish
    // iOS safety timeout: speechSynthesis.onend often never fires on iOS 16/17
    const iosSafetyMs = rate === 'slow' ? 7000 : 5000
    setTimeout(utFinish, iosSafetyMs)
    onStart?.()
    window.speechSynthesis.speak(u)
  }
}
