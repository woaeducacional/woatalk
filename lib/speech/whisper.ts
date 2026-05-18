import { STTProvider, STTOptions } from './types'

/**
 * Whisper (OpenAI) - Speech-to-Text
 * Roda localmente usando Python com ffmpeg/sox para converter áudio
 */
export class WhisperSTTProvider implements STTProvider {
  name = 'Whisper (Local)'
  private modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large'

  constructor(modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large' = 'base') {
    this.modelSize = modelSize
  }

  async transcribe(audioBuffer: Buffer, options?: STTOptions): Promise<string> {
    // Método 1: Usar whisper-node (wrapper Node.js do Whisper)
    // Requer: npm install whisper-node

    try {
      const { default: Whisper } = await import('whisper-node')
      const whisper = new Whisper({
        modelSize: this.modelSize,
        autoDownloadModelName: this.modelSize,
      })

      // Salvar buffer temporário em arquivo
      const fs = await import('fs/promises')
      const path = await import('path')
      const os = await import('os')
      const tmpDir = os.tmpdir()
      const tmpFile = path.join(tmpDir, `audio-${Date.now()}.wav`)

      try {
        await fs.writeFile(tmpFile, audioBuffer)

        const result = await whisper.transcribe(tmpFile, {
          language: options?.language || 'auto',
        })

        return result.text || ''
      } finally {
        // Limpar arquivo temporário
        try {
          await fs.unlink(tmpFile)
        } catch {
          // Ignorar erro ao deletar
        }
      }
    } catch (error) {
      throw new Error(`Whisper transcription failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * Alternativa: Usar whisper-cli (instalado via pip)
 * Mais leve em termos de dependências Node.js
 */
export class WhisperCLIProvider implements STTProvider {
  name = 'Whisper CLI (Local)'
  private modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large'

  constructor(modelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large' = 'base') {
    this.modelSize = modelSize
  }

  async transcribe(audioBuffer: Buffer, options?: STTOptions): Promise<string> {
    // Requer: pip install openai-whisper

    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const fs = await import('fs/promises')
    const path = await import('path')
    const os = await import('os')

    const execAsync = promisify(exec)
    const tmpDir = os.tmpdir()
    const tmpFile = path.join(tmpDir, `audio-${Date.now()}.wav`)
    const jsonFile = path.join(tmpDir, `transcription-${Date.now()}.json`)

    try {
      await fs.writeFile(tmpFile, audioBuffer)

      const language = options?.language === 'auto' ? '' : `--language ${options?.language || 'en'}`
      const { stdout } = await execAsync(
        `whisper "${tmpFile}" --model ${this.modelSize} --output_format json --output_dir "${path.dirname(jsonFile)}" ${language} --verbose False`,
        { timeout: 300000 } // 5 minutos timeout
      )

      // Ler resultado JSON
      const jsonPath = tmpFile.replace(/\.[^.]+$/, '.json')
      const result = JSON.parse(await fs.readFile(jsonPath, 'utf-8'))

      return result.text || ''
    } catch (error) {
      throw new Error(`Whisper CLI failed: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      // Limpeza
      try {
        await fs.unlink(tmpFile)
        await fs.unlink(tmpFile.replace(/\.[^.]+$/, '.json'))
      } catch {
        // Ignorar erros de limpeza
      }
    }
  }
}
