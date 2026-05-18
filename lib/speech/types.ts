/**
 * Tipos de configuração para Speech Services
 * Permite alternar entre múltiplos providers (Azure, Whisper local, pyttsx3, etc)
 */

export type SpeechProvider = 'azure' | 'whisper' | 'pyttsx3' | 'google'

export interface STTOptions {
  language?: string
  format?: 'json' | 'detailed'
}

export interface TTSOptions {
  voice?: 'male' | 'female' | string
  rate?: 'normal' | 'slow' | number
  language?: string
}

export interface STTProvider {
  name: string
  transcribe(audioBuffer: Buffer, options?: STTOptions): Promise<string>
}

export interface TTSProvider {
  name: string
  synthesize(text: string, options?: TTSOptions): Promise<Buffer>
}

export interface SpeechConfig {
  sttProvider: SpeechProvider
  ttsProvider: SpeechProvider
  azure?: {
    speechKey: string
    speechRegion: string
  }
  whisper?: {
    modelSize?: 'tiny' | 'base' | 'small' | 'medium' | 'large'
  }
}
