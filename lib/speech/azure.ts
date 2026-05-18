import { STTProvider, TTSProvider, STTOptions, TTSOptions } from './types'

/**
 * Azure Speech Services - STT
 * Mantém compatibilidade com a implementação anterior
 */
export class AzureSTTProvider implements STTProvider {
  name = 'Azure Speech-to-Text'
  private key: string
  private region: string

  constructor(key: string, region: string) {
    this.key = key
    this.region = region
  }

  async transcribe(audioBuffer: Buffer, options?: STTOptions): Promise<string> {
    const res = await fetch(
      `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${options?.language || 'en-US'}&format=simple`,
      {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.key,
          'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
          'Accept': 'application/json',
        },
        body: audioBuffer,
      }
    )

    const text = await res.text()
    if (!res.ok) {
      throw new Error(`Azure STT error: ${text}`)
    }

    let data: { RecognitionStatus?: string; DisplayText?: string }
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error('Invalid response from Azure')
    }

    if (data.RecognitionStatus !== 'Success') {
      return ''
    }

    return data.DisplayText ?? ''
  }
}

/**
 * Azure Speech Services - TTS
 * Mantém compatibilidade com a implementação anterior
 */
export class AzureTTSProvider implements TTSProvider {
  name = 'Azure Text-to-Speech'
  private key: string
  private region: string

  constructor(key: string, region: string) {
    this.key = key
    this.region = region
  }

  async synthesize(text: string, options?: TTSOptions): Promise<Buffer> {
    const voiceMap: { [key: string]: string } = {
      male: 'en-US-GuyNeural',
      oliver: 'en-US-GuyNeural',
      female: 'en-US-JennyNeural',
      jenny: 'en-US-JennyNeural',
    }

    const voiceName = voiceMap[options?.voice || 'female'] || 'en-US-JennyNeural'
    const rateMap: { [key: string]: string } = {
      normal: '-25%',
      slow: '-40%',
    }

    const escapeXml = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    let ssmlContent: string
    if (options?.rate === 'superslow') {
      // Palavra por palavra com pausa de 600ms entre cada palavra
      const words = text.trim().split(/\s+/)
      ssmlContent = words.map(w => escapeXml(w)).join(`<break time='600ms'/>`)
    } else {
      const rate = typeof options?.rate === 'string' ? rateMap[options.rate] ?? '-25%' : '-25%'
      ssmlContent = `<prosody rate='${rate}'>${escapeXml(text)}</prosody>`
    }

    const ssml = `<speak version='1.0' xml:lang='en-US'>
      <voice name='${voiceName}'>
        ${ssmlContent}
      </voice>
    </speak>`

    const res = await fetch(`https://${this.region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      },
      body: ssml,
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Azure error: ${err}`)
    }

    return Buffer.from(await res.arrayBuffer())
  }
}
