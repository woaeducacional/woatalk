'use client'

import { useState, useEffect } from 'react'
import { ListenRepeatQuestion, SpeakFromMemoryQuestion } from '../questions_structs'
import { getCookie, setCookie, deleteCookie } from '@/lib/utils'

interface Block4PracticeSpeakProps {
  onComplete: (xp: number) => void
  onActivityChange?: (current: number, total: number) => void
  alreadyCompleted?: boolean
}

const COMPLETIONS: Record<number, { label: string; full: string }[]> = {
  0: [
    { label: 'cooking because it helps me unwind', full: 'I enjoy cooking because it helps me unwind.' },
    { label: 'reading because I learn new things', full: 'I enjoy reading because I learn new things.' },
    { label: 'drawing because it relaxes me', full: 'I enjoy drawing because it relaxes me.' },
    { label: 'hiking because I love nature', full: 'I enjoy hiking because I love nature.' },
  ],
  1: [
    { label: 'playing guitar', full: 'My favorite hobby is playing guitar.' },
    { label: 'drawing and sketching', full: 'My favorite hobby is drawing and sketching.' },
    { label: 'cooking new recipes', full: 'My favorite hobby is cooking new recipes.' },
    { label: 'playing video games', full: 'My favorite hobby is playing video games.' },
  ],
  2: [
    { label: 'go for a walk', full: 'In my free time, I go for a walk.' },
    { label: 'listen to music', full: 'In my free time, I listen to music.' },
    { label: 'read books', full: 'In my free time, I read books.' },
    { label: 'watch series', full: 'In my free time, I watch series.' },
  ],
  3: [
    { label: 'read a book', full: 'I like to read a book when I want to relax.' },
    { label: 'listen to calm music', full: 'I like to listen to calm music when I want to relax.' },
    { label: 'take a long walk', full: 'I like to take a long walk when I want to relax.' },
    { label: 'watch a movie', full: 'I like to watch a movie when I want to relax.' },
  ],
  4: [
    { label: 'learning new languages', full: "I'm interested in learning new languages." },
    { label: 'exploring different cultures', full: "I'm interested in exploring different cultures." },
    { label: 'understanding how technology works', full: "I'm interested in understanding how technology works." },
    { label: 'discovering new music', full: "I'm interested in discovering new music." },
  ],
  5: [
    { label: 'photography', full: "I'm passionate about photography." },
    { label: 'music and art', full: "I'm passionate about music and art." },
    { label: 'cooking and trying new recipes', full: "I'm passionate about cooking and trying new recipes." },
    { label: 'traveling and exploring new places', full: "I'm passionate about traveling and exploring new places." },
  ],
  6: [
    { label: 'watch movies', full: 'I usually watch movies in my free time.' },
    { label: 'listen to podcasts', full: 'I usually listen to podcasts in my free time.' },
    { label: 'go for a walk', full: 'I usually go for a walk in my free time.' },
    { label: 'read books', full: 'I usually read books in my free time.' },
  ],
  7: [
    { label: 'traveling to new places', full: 'One thing I really like is traveling to new places.' },
    { label: 'trying different foods', full: 'One thing I really like is trying different foods.' },
    { label: 'learning something new', full: 'One thing I really like is learning something new.' },
    { label: 'spending time with friends', full: 'One thing I really like is spending time with friends.' },
  ],
}

const EXPRESSIONS = [
  { id: 0, text: 'I enjoy… because…', example: 'I enjoy cooking because it helps me relax.' },
  { id: 1, text: 'My favorite hobby is…', example: 'My favorite hobby is playing guitar.' },
  { id: 2, text: 'In my free time, I…', example: 'In my free time, I go for a walk.' },
  { id: 3, text: 'I like to… when I want to relax', example: 'I like to read a book when I want to relax.' },
  { id: 4, text: "I'm interested in…", example: "I'm interested in learning new languages." },
  { id: 5, text: "I'm passionate about…", example: "I'm passionate about photography." },
  { id: 6, text: 'I usually… in my free time', example: 'I usually watch movies in my free time.' },
  { id: 7, text: 'One thing I really like is…', example: 'One thing I really like is traveling to new places.' },
]

type Stage =
  | 'choose' | 'listenRepeat' | 'completeStep'
  | 'speakWithText' | 'speakNoText'
  | 'upgrade' | 'upgradeRepeat'
  | 'final' | 'complete'

export function Block4PracticeSpeak({ onComplete, onActivityChange, alreadyCompleted = false }: Block4PracticeSpeakProps) {
  const [stage, setStage] = useState<Stage>(() => {
    const RESTORE: Partial<Record<Stage, Stage>> = { listenRepeat: 'choose', completeStep: 'choose', speakWithText: 'choose', speakNoText: 'choose', upgrade: 'choose', upgradeRepeat: 'choose', final: 'choose' }
    const s = getCookie('woa_b4_stage') as Stage | null
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
    if (stage !== 'complete') setCookie('woa_b4_stage', stage)
  }, [stage])
  const allSelected = [...selected, ...upgradeSelected]

  const handleListenRepeatComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setCompleteSentences([])
    setStage('completeStep')
  }

  const handleSpeakWithTextComplete = (_xp: number) => {
    setStage('speakNoText')
  }

  const handleSpeakNoTextComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setUpgradeSelected([])
    setStage('upgrade')
  }

  const handleUpgradeRepeatComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setStage('final')
  }

  const handleFinalComplete = (xpGained: number) => {
    setXpEarned((p) => p + xpGained)
    setStage('complete')
  }

  // ─── Choose 2 expressions ───
  if (stage === 'choose') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-purple-400/30" style={{ background: 'rgba(168,85,247,0.06)' }}>
          <p className="text-purple-300 font-bold text-sm tracking-widest mb-0.5">✨ PASSO 1 — ESCOLHA 2 EXPRESSÕES</p>
          <p className="text-white/40 text-[10px] mb-3">Escolha 2 expressões</p>
          <p className="text-blue-200/80 mb-4">Escolha 2 expressões para praticar:</p>
          <div className="grid gap-2">
            {EXPRESSIONS.map((exp) => {
              const isSel = selected.includes(exp.id)
              return (
                <button key={exp.id}
                  onClick={() => {
                    if (isSel) setSelected(selected.filter(x => x !== exp.id))
                    else if (selected.length < 2) setSelected([...selected, exp.id])
                  }}
                  className={`p-3 rounded-lg text-left border transition-all ${isSel ? 'bg-purple-500/30 border-purple-400 text-purple-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                >
                  <p className="font-semibold">{exp.text}</p>
                  <p className="text-xs text-blue-200/40 mt-1">{exp.example}</p>
                </button>
              )
            })}
          </div>
          {selected.length === 2 && (
            <button onClick={() => { setStage('listenRepeat') }} className="mt-4 w-full py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
              COMEÇAR →
            </button>
          )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Listen & Repeat chosen expressions ───
  if (stage === 'listenRepeat') {
    return (
      <ListenRepeatQuestion
        sentences={selected.map((i) => EXPRESSIONS[i].example)}
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

  // ─── Complete a sentence about yourself ───
  if (stage === 'completeStep') {
    const expIdx = selected[completeSentences.length]
    const exp = EXPRESSIONS[expIdx]
    const options = COMPLETIONS[expIdx] ?? []
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-bold text-sm mb-0.5">✍️ PASSO 2 — COMPLETE ({completeSentences.length + 1}/2)</p>
          <p className="text-white/40 text-[10px] mb-3">Escolha a opção que combina com você</p>
          <p className="text-blue-200/80 mb-2">Complete sobre você:</p>
          <p className="text-white text-xl font-semibold mb-6">{exp.text}</p>
          <div className="grid gap-3">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => {
                  const newList = [...completeSentences, opt.full]
                  setCompleteSentences(newList)
                  if (newList.length >= 2) { setXpEarned(p => p + 10); setStage('speakWithText') }
                }}
                className="p-4 rounded-xl text-left border border-white/10 bg-white/5 text-white hover:bg-yellow-500/20 hover:border-yellow-400/50 active:scale-95 transition-all font-medium"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Speak with text visible ───
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
        onComplete={handleSpeakWithTextComplete}
      />
    )
  }

  // ─── Speak without text ───
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

  // ─── Upgrade: Pick 3 more expressions ───
  if (stage === 'upgrade') {
    const remaining = EXPRESSIONS.filter(e => !selected.includes(e.id))
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
                  onClick={() => {
                    if (isSel) setUpgradeSelected(upgradeSelected.filter(x => x !== exp.id))
                    else if (upgradeSelected.length < 3) setUpgradeSelected([...upgradeSelected, exp.id])
                  }}
                  className={`p-3 rounded-lg text-left border transition-all ${isSel ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                >
                  <p className="font-semibold">{exp.text}</p>
                  <p className="text-xs text-blue-200/40 mt-1">{exp.example}</p>
                </button>
              )
            })}
          </div>
          {upgradeSelected.length === 3 && (
            <button onClick={() => { setStage('upgradeRepeat') }} className="mt-4 w-full py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
              PRATICAR →
            </button>
          )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Upgrade Repeat: Listen & Repeat the 3 new expressions ───
  if (stage === 'upgradeRepeat') {
    return (
      <ListenRepeatQuestion
        sentences={upgradeSelected.map((i) => EXPRESSIONS[i].example)}
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

  // ─── Final: Say any of the 5 expressions from memory ───
  if (stage === 'final') {
    return (
      <SpeakFromMemoryQuestion
        sentences={allSelected.map((i) => EXPRESSIONS[i].example)}
        stepLabel="Final — Sem Áudio"
        title="Desafio Final"
        icon="🔥"
        instruction="Diga qualquer expressão que você praticou — sem áudio!"
        xpReward={25}
        onComplete={handleFinalComplete}
      />
    )
  }

  // ─── Complete ───
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-white mb-2">Grupo Concluído!</h3>
        <p className="text-blue-200/80 mb-4">Practice & Speak concluído</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">+{xpEarned} XP</p></div>
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">🪙 +5 WOA Coins</p></div>
        </div>
        <button onClick={() => { deleteCookie('woa_b4_stage'); onComplete(alreadyCompleted ? 0 : xpEarned) }} className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}>CONTINUAR →</button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
