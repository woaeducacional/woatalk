/**
 * Transcription Service
 *
 * Routes transcription based on user plan:
 * - PREMIUM: Azure Speech-to-Text via /api/transcribe (high accuracy, server-side)
 * - FREE:    Web Speech API nativa do browser (zero custo, zero servidor)
 *            Sem suporte nativo (Safari): graceful degradation com mensagem ao usuário
 */

import { blobToWavBase64 } from './audioUtils'

// ── iOS detection ────────────────────────────────────────────────────────────
/** Detecta iPhone / iPad / iPod (inclui iPads novos com userAgent "MacIntel") */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// ── Premium status cache (evita chamar API a cada gravação) ──
let cachedIsPremium: boolean | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

export async function isPremiumUser(): Promise<boolean> {
  const now = Date.now()
  if (cachedIsPremium !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedIsPremium
  }
  try {
    const res = await fetch('/api/user/subscription')
    if (!res.ok) { cachedIsPremium = false; cacheTimestamp = now; return false }
    const data = await res.json()
    cachedIsPremium = data.isPremium === true
    cacheTimestamp = now
    return cachedIsPremium
  } catch {
    cachedIsPremium = false
    cacheTimestamp = now
    return false
  }
}

/** Invalida o cache (usar após login/logout ou mudança de plano) */
export function invalidatePremiumCache() {
  cachedIsPremium = null
  cacheTimestamp = 0
}

// ── PREMIUM: transcreve blob via Azure no servidor ──
export async function transcribeBlob(blob: Blob, language = 'en-US'): Promise<string> {
  const base64 = await blobToWavBase64(blob)
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audio: base64, mimeType: 'audio/wav', language }),
  })
  const text = await res.text()
  if (!text) throw new Error('Resposta vazia do servidor')
  const data = JSON.parse(text)
  if (!res.ok) throw new Error(data.error || 'Erro na transcrição')
  return data.transcript || ''
}

// ── FREE: verifica se o browser suporta Web Speech API nativa de forma confiável ──
export function isNativeWebSpeechSupported(): boolean {
  if (typeof window === 'undefined') return false
  // iOS tem webkitSpeechRecognition mas é não-confiável fora do app nativo
  // (requer HTTPS obrigatório, falha silenciosamente, depende dos servidores Apple)
  // Forçamos o fallback MediaRecorder + Azure STT, que funciona de forma consistente.
  if (isIOS()) return false
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  )
}

/** Retorna o construtor nativo de SpeechRecognition ou null */
function getNativeSpeechRecognition(): any | null {
  if (typeof window === 'undefined') return null
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null
}

// ── Whisper.js cache (evita recarregar o modelo a cada gravação) ──
let whisperPipeline: any = null
let whisperLoadingPromise: Promise<any> | null = null

async function getWhisperPipeline() {
  if (whisperPipeline) return whisperPipeline
  if (whisperLoadingPromise) return whisperLoadingPromise

  whisperLoadingPromise = (async () => {
    console.log('[Whisper.js] Carregando modelo (primeira vez ~30MB, depois em cache)...')
    const { pipeline, env } = await import('@xenova/transformers')
    env.allowLocalModels = false
    env.useBrowserCache = true
    whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en', {
      quantized: true,
    })
    console.log('[Whisper.js] ✅ Modelo carregado')
    return whisperPipeline
  })()

  return whisperLoadingPromise
}

/**
 * Transcreve blob de áudio usando Whisper.js local (FREE users em Firefox/Safari).
 * No iOS, Whisper.js é muito pesado — usa Azure STT via /api/transcribe.
 * Reamostrado para 16kHz mono antes de enviar ao modelo.
 */
export async function transcribeFreeBlob(blob: Blob, language = 'en-US'): Promise<string> {
  // iOS: Whisper.js (~30MB) é lento demais para mobile — delega para Azure STT
  if (isIOS()) {
    return transcribeBlob(blob, language)
  }

  const arrayBuffer = await blob.arrayBuffer()

  // Decodifica e reamostra para 16kHz mono (exigido pelo Whisper)
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
  const tmpCtx = new AudioCtx()
  let float32Array: Float32Array
  try {
    const audioBuffer = await tmpCtx.decodeAudioData(arrayBuffer)
    if (audioBuffer.sampleRate !== 16000 || audioBuffer.numberOfChannels > 1) {
      const offlineCtx = new OfflineAudioContext(1, Math.ceil(audioBuffer.duration * 16000), 16000)
      const source = offlineCtx.createBufferSource()
      source.buffer = audioBuffer
      source.connect(offlineCtx.destination)
      source.start(0)
      const resampled = await offlineCtx.startRendering()
      float32Array = resampled.getChannelData(0)
    } else {
      float32Array = audioBuffer.getChannelData(0)
    }
  } finally {
    await tmpCtx.close()
  }

  const pipe = await getWhisperPipeline()
  const result = await pipe(float32Array, {
    language: language.split('-')[0].toLowerCase(),
    task: 'transcribe',
  })

  return result.text?.trim() || ''
}

export interface LiveRecognitionCallbacks {
  onResult: (transcript: string, isFinal: boolean) => void
  onEnd: (finalTranscript: string) => void
  onError: (error: string) => void
}

export interface LiveRecognitionHandle {
  stop: () => void
}

/**
 * Inicia reconhecimento de voz ao vivo (FREE users).
 * Usa Web Speech API nativa — sem servidor, sem custo.
 *
 * @returns handle com `.stop()` ou null se não suportado
 */
export function startLiveRecognition(
  language = 'en-US',
  callbacks: LiveRecognitionCallbacks
): LiveRecognitionHandle | null {
  const Recognition = getNativeSpeechRecognition()
  if (!Recognition) {
    callbacks.onError('not-supported')
    return null
  }

  const recognition = new Recognition()
  recognition.lang = language
  recognition.continuous = false
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  let accumulated = ''

  recognition.onresult = (event: any) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        accumulated += t + ' '
        callbacks.onResult(accumulated.trim(), true)
      } else {
        interim = t
        callbacks.onResult(accumulated + interim, false)
      }
    }
  }

  recognition.onerror = (event: any) => {
    callbacks.onError(event.error || 'unknown')
  }

  recognition.onend = () => {
    callbacks.onEnd(accumulated.trim())
  }

  recognition.start()

  return {
    stop: () => {
      try { recognition.stop() } catch { /* ignore */ }
    },
  }
}
