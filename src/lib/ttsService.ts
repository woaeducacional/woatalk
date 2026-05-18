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

export async function playTTS(
  text: string,
  voice: 'oliver' | 'alice',
  rate: 'normal' | 'slow' | 'superslow',
  onEnd: () => void,
  onStart?: () => void,
): Promise<void> {
  const cacheKey = `${voice}|${rate}|${text}`
  try {
    let buffer = ttsCache.get(cacheKey)
    if (!buffer) {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, rate }),
      })
      if (!res.ok) throw new Error('TTS failed')
      buffer = await res.arrayBuffer()
      ttsCache.set(cacheKey, buffer)
    }
    const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }))
    const audio = new Audio(url)
    audio.onended = () => { onEnd(); URL.revokeObjectURL(url) }
    audio.onerror = () => { onEnd(); URL.revokeObjectURL(url) }
    onStart?.()
    await audio.play()
  } catch {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (rate === 'superslow') {
        // Fala palavra por palavra com pausa de 600ms
        const words = text.trim().split(/\s+/)
        let i = 0
        const speakNext = () => {
          if (i >= words.length) { onEnd(); return }
          const u = new SpeechSynthesisUtterance(words[i++])
          u.lang = 'en-US'
          u.rate = 0.85
          u.onend = () => { setTimeout(speakNext, 600) }
          u.onerror = () => { setTimeout(speakNext, 600) }
          if (i === 1) onStart?.()
          window.speechSynthesis.speak(u)
        }
        speakNext()
      } else {
        const u = new SpeechSynthesisUtterance(text)
        u.lang = 'en-US'
        u.rate = rate === 'slow' ? 0.6 : 0.8
        u.onend = () => onEnd()
        u.onerror = () => onEnd()
        onStart?.()
        window.speechSynthesis.speak(u)
      }
    } else {
      onEnd()
    }
  }
}
