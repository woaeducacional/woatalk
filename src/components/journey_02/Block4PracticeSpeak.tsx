'use client'

import { useState, useEffect } from 'react'
import { ListenRepeatQuestion, SpeakFromMemoryQuestion } from '../questions_structs'
import { getCookie, setCookie, deleteCookie } from '@/lib/utils'
import type { Block4Content } from '@/lib/journeyContent'

interface Block4PracticeSpeakProps {
  content: Block4Content
  phaseId: number
  onComplete: (xp: number) => void
  onActivityChange?: (current: number, total: number) => void
  alreadyCompleted?: boolean
}

type Stage =
  | 'choose' | 'listenRepeat' | 'completeStep'
  | 'speakWithText' | 'speakNoText'
  | 'upgrade' | 'upgradeRepeat'
  | 'final' | 'complete'

export function Block4PracticeSpeak({ content, phaseId, onComplete, onActivityChange, alreadyCompleted = false }: Block4PracticeSpeakProps) {
  const cookieKey = `woa_p${phaseId}_b4_stage`
  const [stage, setStage] = useState<Stage>(() => {
    const RESTORE: Partial<Record<Stage, Stage>> = { listenRepeat: 'choose', completeStep: 'choose', speakWithText: 'choose', speakNoText: 'choose', upgrade: 'choose', upgradeRepeat: 'choose', final: 'choose' }
    const s = getCookie(cookieKey) as Stage | null
    if (s && s !== 'complete') return RESTORE[s] ?? s
    return 'choose'
  })
  const [selected, setSelected] = useState<number[]>([])
  const [completeSentences, setCompleteSentences] = useState<string[]>([])
  const [upgradeSelected, setUpgradeSelected] = useState<number[]>([])
  const [xpEarned, setXpEarned] = useState(0)

  const STAGE_INDEX: Record<Stage, number> = { choose:1, listenRepeat:2, completeStep:3, speakWithText:4, speakNoText:5, upgrade:6, upgradeRepeat:7, final:8, complete:8 }
  useEffect(() => {
    onActivityChange?.(STAGE_INDEX[stage], 8)
    if (stage !== 'complete') setCookie(cookieKey, stage)
  }, [stage])

  const allSelected = [...selected, ...upgradeSelected]

  const handleListenRepeatComplete = (xp: number) => { setXpEarned((p) => p + xp); setCompleteSentences([]); setStage('completeStep') }
  const handleSpeakNoTextComplete = (xp: number) => { setXpEarned((p) => p + xp); setUpgradeSelected([]); setStage('upgrade') }
  const handleUpgradeRepeatComplete = (xp: number) => { setXpEarned((p) => p + xp); setStage('final') }
  const handleFinalComplete = (xp: number) => { setXpEarned((p) => p + xp); setStage('complete') }

  // --- Choose 2 expressions ---
  if (stage === 'choose') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-purple-400/30" style={{ background: 'rgba(168,85,247,0.06)' }}>
          <p className="text-purple-300 font-bold text-sm tracking-widest mb-0.5">✨ PASSO 1 — ESCOLHA 2 EXPRESSÕES</p>
          <p className="text-white/40 text-[10px] mb-3">Escolha 2 expressões</p>
          <p className="text-blue-200/80 mb-4">Escolha 2 expressões para praticar:</p>
          <div className="grid gap-2">
            {content.expressions.map((exp) => {
              const isSel = selected.includes(exp.id)
              return (
                <button key={exp.id}
                  onClick={() => { if (isSel) setSelected(selected.filter(x => x !== exp.id)); else if (selected.length < 2) setSelected([...selected, exp.id]) }}
                  className={`p-3 rounded-lg text-left border transition-all ${isSel ? 'bg-purple-500/30 border-purple-400 text-purple-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                >
                  <p className="font-semibold">{exp.text}</p>
                  <p className="text-xs text-blue-200/40 mt-1">{exp.example}</p>
                </button>
              )
            })}
          </div>
          {selected.length === 2 && (
            <button onClick={() => setStage('listenRepeat')} className="mt-4 w-full py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
              COMEÇAR →
            </button>
          )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // --- Listen & Repeat chosen expressions ---
  if (stage === 'listenRepeat') {
    return (
      <ListenRepeatQuestion
        sentences={selected.map((i) => content.expressions.find(e => e.id === i)?.example ?? '')}
        stepLabel="Passo 2 — Ouça e Repita"
        title="Suas Expressões"
        icon="🎧"
        instruction="Listen and repeat your chosen expressions!"
        instructionPt="Ouça e repita as expressões que você escolheu!"
        xpReward={20}
        onComplete={handleListenRepeatComplete}
      />
    )
  }

  // --- Complete a sentence about yourself ---
  if (stage === 'completeStep') {
    const expIdx = selected[completeSentences.length]
    const exp = content.expressions.find(e => e.id === expIdx)
    const options = content.completions[expIdx] ?? []
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-bold text-sm mb-0.5">✍️ PASSO 2 — COMPLETE ({completeSentences.length + 1}/2)</p>
          <p className="text-white/40 text-[10px] mb-3">Escolha a opção que combina com você</p>
          <p className="text-blue-200/80 mb-2">Complete sobre você:</p>
          <p className="text-white text-xl font-semibold mb-6">{exp?.text}</p>
          <div className="grid gap-3">
            {options.map((opt, i) => (
              <button key={i}
                onClick={() => {
                  const newList = [...completeSentences, opt.full]
                  setCompleteSentences(newList)
                  if (newList.length >= 2) { setXpEarned((p) => p + 10); setStage('speakWithText') }
                }}
                className="p-4 rounded-xl text-left border border-white/10 bg-white/5 text-white hover:bg-yellow-500/20 hover:border-yellow-400/50 active:scale-95 transition-all font-medium"
              >{opt.label}</button>
            ))}
          </div>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // --- Speak with text visible ---
  if (stage === 'speakWithText') {
    return (
      <ListenRepeatQuestion
        sentences={completeSentences}
        stepLabel="Passo 3a — Fale com Texto"
        title="Suas Frases"
        icon="🎤"
        instruction="Listen and say your own sentences out loud!"
        instructionPt="Ouça e diga suas próprias frases em voz alta!"
        xpReward={0}
        onComplete={() => setStage('speakNoText')}
      />
    )
  }

  // --- Speak without text ---
  if (stage === 'speakNoText') {
    return (
      <SpeakFromMemoryQuestion
        sentences={completeSentences}
        stepLabel="Passo 3b — Sem Texto"
        title="Fale de Memória"
        icon="🧠"
        instruction="Diga uma das suas frases — sem ler!"
        xpReward={30}
        onComplete={handleSpeakNoTextComplete}
      />
    )
  }

  // --- Upgrade: Pick 3 more expressions ---
  if (stage === 'upgrade') {
    const remaining = content.expressions.filter(e => !selected.includes(e.id))
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-cyan-400/30" style={{ background: 'rgba(0,212,255,0.06)' }}>
          <p className="text-cyan-300 font-bold text-sm tracking-widest mb-0.5">⬆️ UPGRADE — ESCOLHA MAIS 3</p>
          <p className="text-white/40 text-[10px] mb-3">Escolha mais 3 expressões</p>
          <p className="text-blue-200/80 mb-4">Escolha mais 3 expressões:</p>
          <div className="grid gap-2">
            {remaining.map((exp) => {
              const isSel = upgradeSelected.includes(exp.id)
              return (
                <button key={exp.id}
                  onClick={() => { if (isSel) setUpgradeSelected(upgradeSelected.filter(x => x !== exp.id)); else if (upgradeSelected.length < 3) setUpgradeSelected([...upgradeSelected, exp.id]) }}
                  className={`p-3 rounded-lg text-left border transition-all ${isSel ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                >
                  <p className="font-semibold">{exp.text}</p>
                  <p className="text-xs text-blue-200/40 mt-1">{exp.example}</p>
                </button>
              )
            })}
          </div>
          {upgradeSelected.length === 3 && (
            <button onClick={() => setStage('upgradeRepeat')} className="mt-4 w-full py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
              PRATICAR →
            </button>
          )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // --- Upgrade repeat ---
  if (stage === 'upgradeRepeat') {
    return (
      <ListenRepeatQuestion
        sentences={upgradeSelected.map((i) => content.expressions.find(e => e.id === i)?.example ?? '')}
        stepLabel="Upgrade — Ouça e Repita"
        title="Novas Expressões"
        icon="⬆️"
        instruction="Listen and repeat the new expressions!"
        instructionPt="Ouça e repita as expressões novas!"
        xpReward={10}
        onComplete={handleUpgradeRepeatComplete}
      />
    )
  }

  // --- Final: Say any of the 5 expressions from memory ---
  if (stage === 'final') {
    return (
      <SpeakFromMemoryQuestion
        sentences={allSelected.map((i) => content.expressions.find(e => e.id === i)?.example ?? '')}
        stepLabel="Final — Sem Áudio"
        title="Desafio Final"
        icon="🔥"
        instruction="Diga qualquer expressão que você praticou — sem áudio!"
        xpReward={25}
        onComplete={handleFinalComplete}
      />
    )
  }

  // --- Complete ---
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-white mb-2">Grupo Concluído!</h3>
        <p className="text-blue-200/80 mb-4">Practice &amp; Speak concluído</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">+{xpEarned} XP</p></div>
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">🪙 +5 WOA Coins</p></div>
        </div>
        <button onClick={() => { deleteCookie(cookieKey); onComplete(alreadyCompleted ? 0 : xpEarned) }} className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}>CONTINUAR →</button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
