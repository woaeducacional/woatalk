'use client'

import { useState } from 'react'

export interface ChoiceOption {
  id: number
  text: string
  isCorrect: boolean
}

interface MultipleChoiceQuestionProps {
  /**
   * Título da questão
   * Exemplo: "Step 1 — Choose"
   */
  title: string

  /**
   * Descrição/instrução da questão
   * Exemplo: "Which sentences are useful for talking about hobbies?"
   */
  question: string

  /**
   * Descrição em português (opcional)
   * Exemplo: "Quais frases são úteis para falar sobre hobbies?"
   */
  questionPt?: string

  /**
   * Lista de opções de resposta
   * Cada opção deve ter: id, text, isCorrect
   */
  options: ChoiceOption[]

  /**
   * Número de respostas corretas esperadas
   * Se não fornecido, calcula automaticamente
   */
  expectedCorrectCount?: number

  /**
   * Callback quando usuário seleciona/desseleciona uma opção
   * Útil para debug ou tracking
   */
  onSelectionChange?: (selectedIds: Set<number>) => void

  /**
   * Callback quando as respostas estão corretas
   * Arg: XP ganho
   */
  onComplete: (xpEarned: number) => void

  /**
   * XP a ser ganho ao responder corretamente
   * @default 15
   */
  xpReward?: number

  /**
   * Emoji para o título
   * @default "🧩"
   */
  icon?: string

  /**
   * Posição/número da questão (para exibição)
   * Exemplo: "Step 1"
   */
  stepLabel?: string

  /**
   * Mensagem de confirmação ao selecionar corretamente
   * @default "✅ CONFIRMAR"
   */
  confirmText?: string

  /**
   * Mensagem ao selecionar incorretamente
   * @default "⏳ Selecione as respostas corretas"
   */
  incompleteText?: string
}

/**
 * Componente genérico para questões de múltipla escolha
 *
 * Uso:
 * ```tsx
 * const options = [
 *   { id: 1, text: 'I go to the gym.', isCorrect: true },
 *   { id: 2, text: 'She works in an office.', isCorrect: false },
 * ]
 *
 * <MultipleChoiceQuestion
 *   title="Choose Hobbies"
 *   question="Which sentences are about hobbies?"
 *   questionPt="Quais frases são sobre hobbies?"
 *   options={options}
 *   onComplete={(xp) => handleComplete(xp)}
 * />
 * ```
 *
 * Características:
 * - Suporta múltiplas respostas corretas
 * - Valida seleção automáticamente
 * - Feedback visual imediato
 * - Totalmente parametrizável
 * - Sem lógica hardcoded
 */
export function MultipleChoiceQuestion({
  title,
  question,
  questionPt,
  options,
  expectedCorrectCount,
  onSelectionChange,
  onComplete,
  xpReward = 15,
  icon = '🧩',
  stepLabel = 'Step 1',
  confirmText = '✅ CONFIRMAR',
  incompleteText = '⏳ Selecione as respostas corretas',
}: MultipleChoiceQuestionProps) {
  const [selectedSentences, setSelectedSentences] = useState<Set<number>>(new Set())

  // Calcular quantas respostas corretas existem
  const correctCount = expectedCorrectCount ?? options.filter((o) => o.isCorrect).length

  // Verificar se a seleção está correta
  const isSelectionCorrect = (): boolean => {
    // Verificar se selecionou a quantidade correta
    if (selectedSentences.size !== correctCount) {
      return false
    }

    // Verificar se todas as selecionadas estão corretas
    return Array.from(selectedSentences).every((id) => {
      const option = options.find((o) => o.id === id)
      return option?.isCorrect
    })
  }

  // Toggle de seleção
  const toggleOption = (id: number) => {
    const newSelected = new Set(selectedSentences)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedSentences(newSelected)
    onSelectionChange?.(newSelected)
  }

  // Lidar com conclusão
  const handleComplete = () => {
    if (isSelectionCorrect()) {
      onComplete(xpReward)
    }
  }

  const isCorrect = isSelectionCorrect()

  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.6s ease-in' }}>
      {/* Header */}
      <div
        className="text-center space-y-2 p-6 rounded-2xl"
        style={{
          background: 'rgba(0,102,255,0.1)',
          border: '1px solid rgba(0,212,255,0.2)',
        }}
      >
        <h2 className="text-2xl font-bold text-cyan-300">
          {icon} {stepLabel} — {title}
        </h2>
        <p className="text-lg text-blue-200/80">{question}</p>
        {questionPt && <p className="text-sm text-blue-200/60">{questionPt}</p>}
      </div>

      {/* Opções */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedSentences.has(option.id)

          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className="w-full p-4 rounded-lg border-2 transition-all text-left font-medium"
              style={{
                background: isSelected
                  ? option.isCorrect
                    ? 'rgba(34, 197, 94, 0.2)'
                    : 'rgba(239, 68, 68, 0.2)'
                  : 'rgba(0, 102, 255, 0.1)',
                borderColor: isSelected
                  ? option.isCorrect
                    ? '#22c55e'
                    : '#ef4444'
                  : 'rgba(0, 212, 255, 0.3)',
                color: 'white',
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded border-2 flex items-center justify-center transition-all flex-shrink-0"
                    style={{
                      borderColor: isSelected
                        ? option.isCorrect
                          ? '#22c55e'
                          : '#ef4444'
                        : 'rgba(0, 212, 255, 0.5)',
                      background: isSelected
                        ? option.isCorrect
                          ? '#22c55e'
                          : '#ef4444'
                        : 'transparent',
                    }}
                  >
                    {isSelected && (
                      <span className="text-white text-sm">
                        {option.isCorrect ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                  <span>{option.text}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Botão de confirmação */}
      <button
        onClick={handleComplete}
        disabled={!isCorrect}
        className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: isCorrect
            ? 'linear-gradient(135deg, #003AB0, #0066FF)'
            : 'linear-gradient(135deg, rgba(0,58,176,0.5), rgba(0,102,255,0.5))',
        }}
      >
        {isCorrect ? `${confirmText} (+${xpReward} XP)` : incompleteText}
      </button>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
