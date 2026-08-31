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
   * Iniciar gravação de áudio
   */
  const startRecording = useCallback(async () => {
    try {
      // Limpar estado anterior
      audioChunksRef.current = []
      setRecordingTime(0)

      // Solicitar permissão de microfone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      // Criar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      // Coletar chunks de áudio
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Quando a gravação termina
      mediaRecorder.onstop = async () => {
        // Parar todos os tracks do stream
        stream.getTracks().forEach(track => track.stop())
        streamRef.current = null

        // Criar blob de áudio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

        // Transcrever
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)

      // Timer para máxima duração
      setRecordingTime(0)
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1
          if (next >= maxDuration) {
            stopRecording()
            return next
          }
          return next
        })
      }, 1000)

      // Auto-stop após maxDuration
      timeoutRef.current = setTimeout(() => {
        stopRecording()
      }, maxDuration * 1000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao acessar microfone'
      console.error('Recording error:', error)
      onError?.(message)
    }
  }, [maxDuration, onError])

  /**
   * Parar gravação de áudio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
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
   * Transcrever áudio usando Azure STT via /api/transcribe
   */
  const transcribeAudio = useCallback(async (audioBlob: Blob) => {
    setIsTranscribing(true)
    try {
      // Converter blob para base64
      const reader = new FileReader()
      reader.onload = async () => {
        const base64Audio = (reader.result as string).split(',')[1]

        // Enviar para API
        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audio: base64Audio,
            mimeType: 'audio/webm',
            language,
          }),
        })

        if (!response.ok) {
          throw new Error(`Transcription failed: ${response.statusText}`)
        }

        const data = await response.json()
        const transcript = data.transcript || ''

        onTranscriptionComplete?.(transcript)
        setIsTranscribing(false)
      }

      reader.onerror = () => {
        const error = 'Erro ao ler áudio'
        onError?.(error)
        setIsTranscribing(false)
      }

      reader.readAsDataURL(audioBlob)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro na transcrição'
      console.error('Transcription error:', error)
      onError?.(message)
      setIsTranscribing(false)
    }
  }, [language, onError, onTranscriptionComplete])

  /**
   * Cancelar gravação (limpar sem transcrever)
   */
  const cancelRecording = useCallback(() => {
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
