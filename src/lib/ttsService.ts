/**
 * Plays text via Azure TTS (/api/tts).
 * Calls speechSynthesis as fallback if the API fails.
 *
 * @param text    - Text to speak
 * @param voice   - 'oliver' (GuyNeural) | 'alice' (JennyNeural)
 * @param rate    - 'normal' (-25%) | 'slow' (-40%)
 * @param onEnd   - Called when audio finishes playing
 * @param onStart - Called just before playback starts (after audio loads)
 */
export async function playTTS(
  text: string,
  voice: 'oliver' | 'alice',
  rate: 'normal' | 'slow',
  onEnd: () => void,
  onStart?: () => void,
): Promise<void> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, rate }),
    })
    if (!res.ok) throw new Error('TTS failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => { onEnd(); URL.revokeObjectURL(url) }
    audio.onerror = () => { onEnd(); URL.revokeObjectURL(url) }
    onStart?.()
    await audio.play()
  } catch {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'
      u.rate = rate === 'slow' ? 0.6 : 0.8
      u.onend = () => onEnd()
      u.onerror = () => onEnd()
      onStart?.()
      window.speechSynthesis.speak(u)
    } else {
      onEnd()
    }
  }
}
