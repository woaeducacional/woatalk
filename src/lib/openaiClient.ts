/**
 * Singleton do cliente OpenAI.
 * Reutiliza a mesma instância em toda a aplicação (server-side).
 * Modelo padrão: gpt-4o-mini (custo baixo, latência baixa).
 */
import OpenAI from 'openai'

// Garante que a variável existe antes de instanciar
if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY não definida — chamadas à IA falharão')
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? '',
})

export default openai
