/**
 * Speech Recognition with iOS fallback
 * 
 * On browsers that support Web Speech API (Chrome, Edge, Android): uses native SpeechRecognition
 * On iOS Safari (no Web Speech API): uses MediaRecorder + server-side Whisper transcription
 * 
 * The fallback class mimics the native SpeechRecognition event interface so
 * existing activity components need minimal changes.
 */

// ─── iOS / unsupported browser detection ───
import { blobToWavBase64 } from './audioUtils'

export function isNativeSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  )
}

// ─── Fallback: MediaRecorder → /api/transcribe ───
export class FallbackSpeechRecognition {
  // Properties that mirror the native API
  lang = 'en-US'
  continuous = true
  interimResults = true
  maxAlternatives = 1

  // Callbacks (same signature as native)
  onstart: (() => void) | null = null
  onend: (() => void) | null = null
  onresult: ((event: any) => void) | null = null
  onerror: ((event: any) => void) | null = null

  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private silenceCheckInterval: ReturnType<typeof setInterval> | null = null
  private silenceStart: number = 0
  private hasSpeech: boolean = false
  private stopped: boolean = false
  private maxRecordingTimer: ReturnType<typeof setTimeout> | null = null

  // Silence detection configuration
  private readonly SILENCE_THRESHOLD = 15   // RMS below this = silence
  private readonly SILENCE_DURATION = 3000  // 3s of silence → auto-stop
  private readonly MAX_RECORDING = 15000    // 15s max recording

  async start() {
    this.stopped = false
    this.hasSpeech = false
    this.chunks = []

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      this.fireError('not-allowed')
      return
    }

    // ── Audio analyser for silence detection ──
    try {
      this.audioContext = new AudioContext()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 512
      const source = this.audioContext.createMediaStreamSource(this.stream)
      source.connect(this.analyser)
    } catch {
      // Silence detection won't work but recording continues
    }

    // ── MediaRecorder ──
    // iOS Safari supports audio/mp4; desktop Chrome supports audio/webm
    const mimeType = this.pickMimeType()
    try {
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType })
    } catch {
      // Fallback without explicit mimeType
      this.mediaRecorder = new MediaRecorder(this.stream)
    }

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data)
    }

    this.mediaRecorder.onstop = () => {
      this.transcribeAndEmit()
    }

    // Collect data every second
    this.mediaRecorder.start(1000)
    if (this.onstart) this.onstart()

    // ── Silence monitoring ──
    this.silenceStart = Date.now()
    this.silenceCheckInterval = setInterval(() => this.checkSilence(), 200)

    // ── Safety: max recording duration ──
    this.maxRecordingTimer = setTimeout(() => this.stop(), this.MAX_RECORDING)
  }

  stop() {
    if (this.stopped) return
    this.stopped = true
    this.cleanup()

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    } else {
      // If recorder was never started or already inactive
      if (this.onend) this.onend()
    }
  }

  abort() {
    this.stopped = true
    this.cleanup()
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
  }

  // ─── Private helpers ───

  private pickMimeType(): string {
    if (typeof MediaRecorder.isTypeSupported === 'function') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) return 'audio/webm;codecs=opus'
      if (MediaRecorder.isTypeSupported('audio/webm')) return 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/mp4')) return 'audio/mp4'
      if (MediaRecorder.isTypeSupported('audio/aac')) return 'audio/aac'
    }
    // Safari iOS typically defaults to audio/mp4
    return 'audio/mp4'
  }

  private checkSilence() {
    if (!this.analyser) return

    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteTimeDomainData(dataArray)

    // Calculate RMS
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const v = (dataArray[i] - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / dataArray.length) * 100

    if (rms > this.SILENCE_THRESHOLD) {
      // Sound detected
      this.hasSpeech = true
      this.silenceStart = Date.now()
    } else if (this.hasSpeech && Date.now() - this.silenceStart > this.SILENCE_DURATION) {
      // 3s silence after speech → stop
      this.stop()
    }
  }

  private async transcribeAndEmit() {
    this.cleanup()

    if (this.chunks.length === 0) {
      this.fireError('no-speech')
      if (this.onend) this.onend()
      return
    }

    const mimeType = this.mediaRecorder?.mimeType || 'audio/mp4'
    const blob = new Blob(this.chunks, { type: mimeType })

    // Small blob = probably no real speech
    if (blob.size < 1000) {
      this.fireError('no-speech')
      if (this.onend) this.onend()
      return
    }

    const ext = mimeType.includes('webm') ? 'webm' : 'mp4'

    try {
      const base64 = await blobToWavBase64(blob)
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, mimeType: 'audio/wav' }),
      })

      if (!res.ok) {
        console.error('[FallbackSpeech] Transcribe failed:', res.status)
        this.fireError('network')
        if (this.onend) this.onend()
        return
      }

      const data = await res.json()
      const transcript = (data.transcript || '').trim()

      if (!transcript) {
        this.fireError('no-speech')
        if (this.onend) this.onend()
        return
      }

      // Emit a result event that matches the native SpeechRecognition format
      if (this.onresult) {
        const fakeResult = {
          0: { transcript, confidence: 0.9 },
          isFinal: true,
          length: 1,
        }
        this.onresult({
          resultIndex: 0,
          results: {
            0: fakeResult,
            length: 1,
            // Make it iterable for Array.from()
            [Symbol.iterator]: function* () {
              yield fakeResult
            },
          },
        })
      }
    } catch (err) {
      console.error('[FallbackSpeech] Network error:', err)
      this.fireError('network')
    }

    if (this.onend) this.onend()
  }

  private fireError(error: string) {
    if (this.onerror) {
      this.onerror({ error })
    }
  }

  private cleanup() {
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval)
      this.silenceCheckInterval = null
    }
    if (this.maxRecordingTimer) {
      clearTimeout(this.maxRecordingTimer)
      this.maxRecordingTimer = null
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
  }
}

// ─── Public API ───

/**
 * Returns native SpeechRecognition constructor if available,
 * otherwise returns the MediaRecorder-based fallback (for iOS).
 * Returns null if neither is supported.
 */
export function getSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null

  const Native =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition

  if (Native) return Native

  // Fallback: needs MediaRecorder + getUserMedia
  if (window.MediaRecorder && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
    return FallbackSpeechRecognition
  }

  return null
}
