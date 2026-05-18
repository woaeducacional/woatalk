import { STTProvider, TTSProvider, SpeechConfig, SpeechProvider } from './types'
import { AzureSTTProvider, AzureTTSProvider } from './azure'
import { WhisperSTTProvider, WhisperCLIProvider } from './whisper'
import { Pyttsx3TTSProvider, SimpleTTSProvider } from './pyttsx3'

/**
 * Factory para criar providers de STT
 */
export function createSTTProvider(provider: SpeechProvider, config?: any): STTProvider {
  switch (provider) {
    case 'azure':
      if (!config?.azure?.speechKey || !config?.azure?.speechRegion) {
        throw new Error('Azure Speech Key and Region required for Azure provider')
      }
      return new AzureSTTProvider(config.azure.speechKey, config.azure.speechRegion)

    case 'whisper':
      return new WhisperCLIProvider(config?.whisper?.modelSize || 'base')

    default:
      throw new Error(`Unknown STT provider: ${provider}`)
  }
}

/**
 * Factory para criar providers de TTS
 */
export function createTTSProvider(provider: SpeechProvider, config?: any): TTSProvider {
  switch (provider) {
    case 'azure':
      if (!config?.azure?.speechKey || !config?.azure?.speechRegion) {
        throw new Error('Azure Speech Key and Region required for Azure provider')
      }
      return new AzureTTSProvider(config.azure.speechKey, config.azure.speechRegion)

    case 'pyttsx3':
      return new Pyttsx3TTSProvider()

    default:
      throw new Error(`Unknown TTS provider: ${provider}`)
  }
}

/**
 * Carrega configuração do ambiente
 */
export function loadSpeechConfig(): SpeechConfig {
  const sttProvider = (process.env.SPEECH_STT_PROVIDER || 'azure') as SpeechProvider
  const ttsProvider = (process.env.SPEECH_TTS_PROVIDER || 'azure') as SpeechProvider

  const config: SpeechConfig = {
    sttProvider,
    ttsProvider,
    azure: {
      speechKey: process.env.AZURE_SPEECH_KEY || '',
      speechRegion: process.env.AZURE_SPEECH_REGION || '',
    },
    whisper: {
      modelSize: (process.env.WHISPER_MODEL_SIZE || 'base') as any,
    },
  }

  return config
}

/**
 * Obter provider de STT global
 */
let sttProviderInstance: STTProvider | null = null

export function getSTTProvider(): STTProvider {
  if (!sttProviderInstance) {
    const config = loadSpeechConfig()
    sttProviderInstance = createSTTProvider(config.sttProvider, config)
  }
  return sttProviderInstance
}

/**
 * Obter provider de TTS global
 */
let ttsProviderInstance: TTSProvider | null = null

export function getTTSProvider(): TTSProvider {
  if (!ttsProviderInstance) {
    const config = loadSpeechConfig()
    ttsProviderInstance = createTTSProvider(config.ttsProvider, config)
  }
  return ttsProviderInstance
}

/**
 * Reset providers (útil para testes)
 */
export function resetProviders() {
  sttProviderInstance = null
  ttsProviderInstance = null
}

/**
 * Logs de debug
 */
export function logSpeechConfig() {
  const config = loadSpeechConfig()
  console.log('Speech Configuration:')
  console.log(`  STT Provider: ${config.sttProvider}`)
  console.log(`  TTS Provider: ${config.ttsProvider}`)
  if (config.whisper) {
    console.log(`  Whisper Model: ${config.whisper.modelSize}`)
  }
}
