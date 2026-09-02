/**
 * Hook para gerenciar gravação de áudio e transcrição
 * Usa Web Audio API para capturar áudio e Azure STT para transcrição
 */

import { useCallback, useRef, useState } from 'react'

interface UseVoiceRecorderOptions {
  onTranscriptionComplete?: (text: string) => void
  onError?: (error: string) => void
  maxDuration?: number // segundos, padrão 30
  language?: string
}

/**
 * Codificar áudio PCM como WAV (formato WAV com header)
 */
function encodeWAV(audioBuffer: AudioBuffer): ArrayBuffer {
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numberOfChannels * bytesPerSample

  // Extrair PCM samples
  const channels: Float32Array[] = []
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(audioBuffer.getChannelData(i))
  }

  const frameLength = audioBuffer.length
  const dataLength = frameLength * numberOfChannels * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // subchunk1size
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, dataLength, true)

  // Escrever PCM samples
  let offset = 44
  const volume = 0.8
  for (let i = 0; i < frameLength; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      let sample = Math.max(-1, Math.min(1, channels[channel][i]))
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
      view.setInt16(offset, sample * volume, true)
      offset += 2
    }
  }

  return buffer
}

/**
 * Converter WebM/qualquer formato para WAV PCM 16000Hz
 */
async function convertWebMToWav(webmBlob: Blob): Promise<ArrayBuffer> {
  const arrayBuffer = await webmBlob.arrayBuffer()
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    // Resample para 16000Hz (requerido pelo Azure STT)
    const targetSampleRate = 16000
    const offlineContext = new OfflineAudioContext(
      Math.min(audioBuffer.numberOfChannels, 1), // Mono para Azure STT
      Math.ceil(audioBuffer.duration * targetSampleRate),
      targetSampleRate
    )

    const source = offlineContext.createBufferSource()
    source.buffer = audioBuffer
    source.connect(offlineContext.destination)
    source.start(0)

    const resampled = await offlineContext.startRendering()

    // Converter para WAV PCM
    return encodeWAV(resampled)
  } catch (error) {
    console.error('Audio conversion error:', error)
    throw new Error('Não foi possível converter o áudio')
  }
}

export function useVoiceRecorder(options: UseVoiceRecorderOptions = {}) {
  const {
    onTranscriptionComplete,
    onError,
    maxDuration = 30,
    language = 'en-US',
  } = options

  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Transcrever áudio usando Azure STT via /api/transcribe
   */
  const transcribeAudio = useCallback(
    async (audioBlob: Blob) => {
      setIsTranscribing(true)
      try {
        console.log('🎤 [PASSO 10] Convertendo WebM → WAV...')
        // Converter WebM para WAV
        const wavBuffer = await convertWebMToWav(audioBlob)
        const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' })

        console.log('🎤 [PASSO 11] ✅ WAV criado:', wavBlob.size, 'bytes')

        // Converter blob para base64
        console.log('🎤 [PASSO 12] Convertendo WAV para base64...')
        const reader = new FileReader()
        reader.onload = async () => {
          try {
            const base64Audio = (reader.result as string).split(',')[1]
            console.log('🎤 [PASSO 13] ✅ Base64 pronto! Tamanho:', base64Audio.length)

            console.log('🎤 [PASSO 14] 📤 Enviando para /api/transcribe...')
            // Enviar para API
            const response = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: base64Audio,
                mimeType: 'audio/wav',
                language,
              }),
            })

            const data = await response.json()

            if (!response.ok) {
              const errorMsg = data.error || response.statusText
              console.error('🎤 ❌ ERRO DA API:', errorMsg, '| Status:', response.status)
              onError?.(`Erro na transcrição: ${errorMsg}`)
              setIsTranscribing(false)
              return
            }

            const transcript = data.transcript || ''
            console.log('🎤 [PASSO 15] 📥 Resposta recebida! Transcript:', transcript.substring(0, 50))

            if (transcript) {
              onTranscriptionComplete?.(transcript)
            } else {
              onError?.('Não foi possível transcrever o áudio. Tente novamente.')
            }

            setIsTranscribing(false)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao processar áudio'
            console.error('🎤 Transcription error:', error)
            onError?.(message)
            setIsTranscribing(false)
          }
        }

        reader.onerror = () => {
          const error = 'Erro ao ler áudio'
          console.error('🎤 ❌ ERRO FileReader:', error)
          onError?.(error)
          setIsTranscribing(false)
        }

        reader.readAsDataURL(wavBlob)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro na transcrição'
        console.error('🎤 ❌ ERRO CONVERSÃO:', message)
        console.error('🎤 ❌ Error stack:', error)
        onError?.(message)
        setIsTranscribing(false)
      }
    },
    [language, onError, onTranscriptionComplete]
  )

  /**
   * Iniciar gravação de áudio
   */
  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 [PASSO 1] Iniciando gravação...')
      
      // Limpar estado anterior
      audioChunksRef.current = []
      setRecordingTime(0)

      // Solicitar permissão de microfone
      console.log('🎤 [PASSO 2] Solicitando acesso ao microfone...')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      console.log('🎤 [PASSO 3] ✅ Permissão concedida!')

      // Criar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      // Coletar chunks de áudio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('🎤 [PASSO 5] Chunk recebido:', event.data.size, 'bytes')
          audioChunksRef.current.push(event.data)
        }
      }

      // Quando a gravação termina
      mediaRecorder.onstop = async () => {
        console.log('🎤 [PASSO 6] ✅ Gravação parada! Total de chunks:', audioChunksRef.current.length)
        
        // Parar todos os tracks do stream
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null
        console.log('🎤 [PASSO 7] ✅ Stream parado')

        // Criar blob de áudio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        console.log('🎤 [PASSO 8] ✅ WebM Blob criado:', audioBlob.size, 'bytes')

        // Transcrever
        console.log('🎤 [PASSO 9] Iniciando transcrição...')
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      console.log('🎤 [PASSO 4] ✅ MediaRecorder iniciado!')

      // Timer para máxima duração
      setRecordingTime(0)
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1
          if (next >= maxDuration) {
            console.log('🎤 Max duration reached, stopping recording')
            stopRecording()
            return next
          }
          return next
        })
      }, 1000)

      // Auto-stop após maxDuration
      timeoutRef.current = setTimeout(() => {
        console.log('🎤 Auto-stop timeout reached')
        stopRecording()
      }, maxDuration * 1000)
    } catch (error) {
      let message = 'Erro ao acessar microfone'

      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          message = '🎤 Permissão de microfone negada. Verifique as configurações do navegador.'
        } else if (error.name === 'NotFoundError') {
          message = '🎤 Nenhum microfone encontrado. Verifique seu equipamento.'
        }
      } else if (error instanceof Error) {
        message = error.message
      }

      console.error('🎤 Recording error:', error)
      onError?.(message)
    }
  }, [maxDuration, onError, transcribeAudio])

  /**
   * Parar gravação de áudio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('🎤 Stopping recording...')
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Limpar timers
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      // Parar stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }, [isRecording])

  /**
   * Cancelar gravação (limpar sem transcrever)
   */
  const cancelRecording = useCallback(() => {
    console.log('🎤 Cancelling recording...')
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    setIsRecording(false)
    audioChunksRef.current = []

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    setRecordingTime(0)
  }, [])

  return {
    isRecording,
    isTranscribing,
    recordingTime,
    startRecording,
    stopRecording,
    cancelRecording,
    maxDuration,
  }
}
