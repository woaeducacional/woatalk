import { TTSProvider, TTSOptions } from './types'

/**
 * pyttsx3 - Text-to-Speech (Local)
 * Roda localmente, sem limites de uso
 * Requer: pip install pyttsx3
 */
export class Pyttsx3TTSProvider implements TTSProvider {
  name = 'pyttsx3 (Local TTS)'

  async synthesize(text: string, options?: TTSOptions): Promise<Buffer> {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const fs = await import('fs/promises')
    const path = await import('path')
    const os = await import('os')

    const execAsync = promisify(exec)
    const tmpDir = os.tmpdir()
    const outputFile = path.join(tmpDir, `tts-${Date.now()}.mp3`)

    try {
      // Criar script Python para usar pyttsx3
      const script = `
import pyttsx3
import sys

engine = pyttsx3.init()
engine.setProperty('rate', ${this.getRate(options?.rate)})
engine.setProperty('volume', 1.0)

# Selecionar voz
voices = engine.getProperty('voices')
voice_index = ${this.getVoiceIndex(options?.voice)}
if voice_index < len(voices):
    engine.setProperty('voice', voices[voice_index].id)

engine.save_to_file("""${text.replace(/"/g, '\\"')}""", """${outputFile.replace(/\\/g, '\\\\')}""")
engine.runAndWait()
`

      const scriptFile = path.join(tmpDir, `tts-script-${Date.now()}.py`)
      await fs.writeFile(scriptFile, script)

      try {
        await execAsync(`python "${scriptFile}"`, { timeout: 60000 })

        // Ler arquivo gerado
        const audioBuffer = await fs.readFile(outputFile)
        return audioBuffer
      } finally {
        // Limpeza
        try {
          await fs.unlink(scriptFile)
          await fs.unlink(outputFile)
        } catch {
          // Ignorar erros
        }
      }
    } catch (error) {
      throw new Error(`pyttsx3 TTS failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private getRate(rate?: 'normal' | 'slow' | 'superslow' | number): number {
    if (typeof rate === 'number') return rate
    if (rate === 'slow') return 150
    if (rate === 'superslow') return 100
    return 200 // normal
  }

  private getVoiceIndex(voice?: string | 'male' | 'female'): number {
    if (voice === 'male' || voice === 'oliver') return 0
    if (voice === 'female' || voice === 'jenny') return 1
    return 1 // default: female
  }
}

/**
 * Alternativa: Usar Web Audio API com TTS.js (se no browser)
 * Ou usar Google Translate TTS (mais simples, mas requer internet)
 */
export class SimpleTTSProvider implements TTSProvider {
  name = 'Simple Local TTS'

  async synthesize(text: string, options?: TTSOptions): Promise<Buffer> {
    // Esta é uma implementação alternativa muito simples
    // usando ffmpeg + espeak (disponível na maioria dos SO)

    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const fs = await import('fs/promises')
    const path = await import('path')
    const os = await import('os')

    const execAsync = promisify(exec)
    const tmpDir = os.tmpdir()
    const wavFile = path.join(tmpDir, `tts-${Date.now()}.wav`)
    const mp3File = path.join(tmpDir, `tts-${Date.now()}.mp3`)

    try {
      const speed = this.getRate(options?.rate)
      const speedFactor = speed / 200 // normalize to 200 = normal

      // Usar espeak para gerar WAV
      await execAsync(
        `espeak -w "${wavFile}" -s ${speed} "${text.replace(/"/g, '\\"')}"`,
        { timeout: 30000 }
      )

      // Converter WAV para MP3 com ffmpeg
      await execAsync(`ffmpeg -i "${wavFile}" -q:a 9 -y "${mp3File}"`, {
        timeout: 30000,
      })

      const audioBuffer = await fs.readFile(mp3File)
      return audioBuffer
    } catch (error) {
      throw new Error(`Simple TTS failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      try {
        await fs.unlink(wavFile)
        await fs.unlink(mp3File)
      } catch {
        // Ignorar erros
      }
    }
  }

  private getRate(rate?: 'normal' | 'slow' | 'superslow' | number): number {
    if (typeof rate === 'number') return rate
    if (rate === 'slow') return 150
    if (rate === 'superslow') return 100
    return 200 // normal
  }
}
