'use client'

/**
 * Hook que orquestra o feedback de pronúncia com IA.
 *
 * Responsabilidades:
 * 1. Receber o diff de palavras após uma tentativa com erro
 * 2. Salvar cada palavra errada no banco (fire-and-forget)
 * 3. Buscar dica de pronúncia gerada pelo GPT-4 mini
 * 4. Expor: aiTip, isLoadingTip e a função triggerFeedback
 */
import { useState, useCallback } from 'react'

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface WordDiffItem {
  expected: string
  spoken: string | null
  isCorrect: boolean
}

interface UsePronunciationFeedbackReturn {
  /** Dica gerada pela IA (null enquanto não chegar) */
  aiTip: string | null
  /** True enquanto aguarda resposta da IA */
  isLoadingTip: boolean
  /** Dispara o fluxo de salvar erros + buscar dica */
  triggerFeedback: (wordDiff: WordDiffItem[], sentence: string) => void
  /** Limpa o estado (chamar ao avançar de frase) */
  clearFeedback: () => void
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function usePronunciationFeedback(userId?: string): UsePronunciationFeedbackReturn {
  const [aiTip, setAiTip] = useState<string | null>(null)
  const [isLoadingTip, setIsLoadingTip] = useState(false)

  /** Salva um único erro de palavra no banco (silencioso, sem bloquear UI) */
  const saveError = (word: string, sentence: string) => {
    fetch('/api/pronunciation/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, sentence }),
    }).catch(() => {}) // fire-and-forget — falha silenciosa
  }

  /** Busca dica da IA para as palavras erradas da tentativa */
  const fetchTip = async (wrongWords: WordDiffItem[], sentence: string) => {
    setIsLoadingTip(true)
    setAiTip(null)
    try {
      const res = await fetch('/api/pronunciation/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence,
          wrongWords: wrongWords.map(w => ({ expected: w.expected, spoken: w.spoken })),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiTip(data.tip ?? null)
      }
    } catch {
      // Falha silenciosa — o painel funciona sem a dica se a IA estiver fora
    } finally {
      setIsLoadingTip(false)
    }
  }

  /**
   * Ponto de entrada principal.
   * Chamado quando processTranscript detecta score < 60.
   */
  const triggerFeedback = useCallback(
    (wordDiff: WordDiffItem[], sentence: string) => {
      const wrongWords = wordDiff.filter(w => !w.isCorrect)
      if (wrongWords.length === 0) return

      // Salva cada palavra errada no banco (somente se usuário logado)
      if (userId) {
        wrongWords.forEach(w => saveError(w.expected, sentence))
      }

      // Busca dica da IA
      fetchTip(wrongWords, sentence)
    },
    [userId],
  )

  /** Limpa estado ao avançar para próxima frase */
  const clearFeedback = useCallback(() => {
    setAiTip(null)
    setIsLoadingTip(false)
  }, [])

  return { aiTip, isLoadingTip, triggerFeedback, clearFeedback }
}
