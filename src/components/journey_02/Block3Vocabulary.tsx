'use client'

import { useState, useRef, useEffect } from 'react'
import { getSpeechRecognition } from '@/src/lib/speechRecognition'
import { ListenRepeatQuestion, SpeakFromMemoryQuestion, VocabularyMatchQuestion } from '../questions_structs'
import { getCookie, setCookie, deleteCookie } from '@/lib/utils'

interface Block3VocabularyProps {
  onComplete: (xp: number) => void
  onActivityChange?: (current: number, total: number) => void
  alreadyCompleted?: boolean
}

const VOCABULARY = [
  { word: 'Introduce',   definition: 'To present yourself or someone to another person', translationPt: 'Apresentar',   example: 'Let me introduce myself — my name is Ana.' },
  { word: 'Background',  definition: 'Your history, education, and experience',          translationPt: 'Histórico',    example: 'Can you tell me about your background?' },
  { word: 'Nationality', definition: 'The country you are from',                          translationPt: 'Nacionalidade',example: 'My nationality is Brazilian.' },
  { word: 'Profession',  definition: 'Your job or career',                                translationPt: 'Profissão',    example: 'My profession is software engineering.' },
  { word: 'Origin',      definition: 'Where you come from',                              translationPt: 'Origem',       example: "I'm originally from São Paulo." },
  { word: 'Describe',    definition: 'To tell details about something or someone',        translationPt: 'Descrever',    example: 'How would you describe yourself?' },
  { word: 'Connect',     definition: 'To form a link or relationship with someone',       translationPt: 'Conectar',     example: 'English helps me connect with people worldwide.' },
  { word: 'Mention',     definition: 'To speak about something briefly',                  translationPt: 'Mencionar',    example: 'I should mention that I love music.' },
]

const FILL_SENTENCES = [
  { sentence: 'Let me ___ myself. My name is Ana.',                      answer: 'introduce',   options: ['introduce', 'describe', 'mention'],    full: 'Let me introduce myself. My name is Ana.' },
  { sentence: "Can you tell me about your ___?",                         answer: 'background',  options: ['background', 'origin', 'nationality'], full: 'Can you tell me about your background?' },
  { sentence: 'My ___ is Brazilian.',                                    answer: 'nationality', options: ['nationality', 'profession', 'background'], full: 'My nationality is Brazilian.' },
  { sentence: 'My ___ is software engineering.',                         answer: 'profession',  options: ['profession', 'origin', 'describe'],    full: 'My profession is software engineering.' },
  { sentence: "I'm originally from São Paulo — that's my ___.",         answer: 'origin',      options: ['origin', 'nationality', 'connect'],    full: "I'm originally from São Paulo — that's my origin." },
  { sentence: 'English helps me ___ with people from all over the world.', answer: 'connect',  options: ['connect', 'mention', 'describe'],      full: 'English helps me connect with people from all over the world.' },
  { sentence: 'I should ___ that I enjoy music and art.',                answer: 'mention',     options: ['mention', 'introduce', 'origin'],      full: 'I should mention that I enjoy music and art.' },
]

const MEMORY_SENTENCES = [
  'Let me introduce myself.',
  'My nationality is Brazilian.',
  'English helps me connect with people worldwide.',
]

type Stage = 'matchIntro' | 'matchWord' | 'fillBlank' | 'fillRepeat' | 'memory' | 'complete'

function getActivityIndex(stage: Stage, fillIdx: number): number {
  if (stage === 'matchIntro') return 1
  if (stage === 'matchWord') return 2
  if (stage === 'fillBlank' || stage === 'fillRepeat') return 3 + fillIdx
  return 10
}

export function Block3Vocabulary({ onComplete, onActivityChange, alreadyCompleted = false }: Block3VocabularyProps) {
  const [stage, setStage] = useState<Stage>(() => {
    const s = getCookie('woa_j2_b3_stage') as Stage | null
    return (s && s !== 'complete') ? s : 'matchIntro'
  })
  const [fillIdx, setFillIdx] = useState(0)
  const [fillAnswer, setFillAnswer] = useState('')
  const [fillCorrect, setFillCorrect] = useState<boolean | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [xpEarned, setXpEarned] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const transcriptRef = useRef('')

  useEffect(() => {
    onActivityChange?.(getActivityIndex(stage, fillIdx), 10)
    if (stage !== 'complete') setCookie('woa_j2_b3_stage', stage)
  }, [stage, fillIdx])

  const calcScore = (spoken: string, target: string): number => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
    const a = norm(spoken), b = norm(target)
    if (b.length === 0) return 0
    let m = 0; for (const w of b) if (a.includes(w)) m++
    return Math.round((m / b.length) * 100)
  }

  const record = async (target: string, onPass: () => void, xp: number, isMemoryTask?: boolean) => {
    if (isRecording) return
    setError(''); setTranscript(''); setScore(0)
    const API = getSpeechRecognition()
    if (!API) { setError('Speech Recognition not supported.'); return }
    const rec = new API()
    rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true
    setIsRecording(true); transcriptRef.current = ''
    let timer: ReturnType<typeof setTimeout> | null = null
    const resetT = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => rec.stop(), 3000) }
    rec.onresult = (e: any) => { resetT(); const t = Array.from(e.results).map((r: any) => r[0].transcript).join(''); transcriptRef.current = t; setTranscript(t) }
    rec.onend = () => {
      setIsRecording(false)
      if (timer) clearTimeout(timer)
      const s = calcScore(transcriptRef.current, target)
      setScore(s)
      if (isMemoryTask) {
        setTimeout(onPass, 600)
      } else {
        if (s >= 70) { setXpEarned((p) => p + xp); setAttemptCount(0); setTimeout(onPass, 600) }
        else { setAttemptCount((prev) => prev + 1); setError(`Score: ${s}%. Tente de novo (mínimo 70%).`) }
      }
    }
    rec.onerror = (e: any) => { setIsRecording(false); if (timer) clearTimeout(timer); setError(e.error === 'no-speech' ? 'Nenhuma fala detectada.' : `Erro: ${e.error}`) }
    await rec.start(); resetT()
  }

  const handleMatchComplete = (xp: number) => { setXpEarned((p) => p + xp); setStage('fillBlank') }

  const handleFillRepeatComplete = () => {
    const next = fillIdx + 1
    setFillAnswer(''); setFillCorrect(null)
    if (next < FILL_SENTENCES.length) { setFillIdx(next); setStage('fillBlank') }
    else { setXpEarned((p) => p + 20); setStage('memory') }
  }

  // ─── Match flip cards ───
  if (stage === 'matchIntro') {
    return (
      <VocabularyMatchQuestion
        items={VOCABULARY}
        stepLabel="Passo 1 — Combinação"
        title="Vocabulário"
        icon="🧩"
        instruction="Click each card to reveal the Portuguese translation."
        instructionPt="Clique em cada carta para ver a tradução. Vire todas para avançar!"
        onComplete={() => setStage('matchWord')}
      />
    )
  }

  // ─── Match word by word ───
  if (stage === 'matchWord') {
    return (
      <ListenRepeatQuestion
        sentences={VOCABULARY.map((v) => v.word)}
        stepLabel="Passo 1 — Combinação"
        title="Ouça e Repita"
        icon="🧩"
        instruction="Listen to each vocabulary word and repeat!"
        instructionPt="Ouça cada palavra de vocabulário e repita!"
        xpReward={10}
        onComplete={handleMatchComplete}
      />
    )
  }

  // ─── Fill blank ───
  if (stage === 'fillBlank') {
    const q = FILL_SENTENCES[fillIdx]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="flex justify-between items-center">
          <p className="text-green-300 text-sm font-bold mb-0.5">⚡ PASSO 2 — ESCOLHA E FALE ({fillIdx + 1}/{FILL_SENTENCES.length})</p>
          <p className="text-white/40 text-[10px] mb-3">Escolha e fale</p>
        </div>
        <div className="p-6 rounded-xl border border-green-400/30" style={{ background: 'rgba(34,197,94,0.06)' }}>
          <p className="text-white text-xl font-semibold mb-6">{q.sentence}</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {q.options.map((o) => (
              <button key={o} onClick={() => { setFillAnswer(o); setFillCorrect(o === q.answer) }}
                className={`p-3 rounded-lg font-medium text-sm transition-all border ${fillAnswer === o ? (fillCorrect ? 'bg-green-500/30 border-green-400 text-green-300' : 'bg-red-500/30 border-red-400 text-red-300') : 'bg-white/5 border-white/10 text-white'}`}
              >{o}</button>
            ))}
          </div>
          {fillCorrect === true && (
            <div className="text-center mt-4">
              <p className="text-green-400 font-bold mb-3">✅ Correto!</p>
              <p className="text-white mb-4">{q.full}</p>
              <button onClick={() => setStage('fillRepeat')} className="px-6 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
                🎧 Praticar pronúncia →
              </button>
            </div>
          )}
          {fillCorrect === false && <p className="text-red-400 text-center mt-3">❌ Tente outra opção</p>}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Fill repeat ───
  if (stage === 'fillRepeat') {
    return (
      <ListenRepeatQuestion
        sentences={[FILL_SENTENCES[fillIdx].full]}
        stepLabel={`Passo 2 — ${fillIdx + 1}/${FILL_SENTENCES.length}`}
        title="Ouça e Repita"
        icon="📝"
        instruction="Listen and repeat the full sentence!"
        instructionPt="Ouça e repita a frase completa!"
        xpReward={0}
        onComplete={handleFillRepeatComplete}
      />
    )
  }

  // ─── Memory ───
  if (stage === 'memory') {
    return (
      <SpeakFromMemoryQuestion
        sentences={MEMORY_SENTENCES}
        stepLabel="Passo 4 — Fixação"
        title="Fale de Memória"
        icon="🧠"
        instruction="Fale qualquer uma das frases que você aprendeu — sem ler!"
        xpReward={25}
        onComplete={(xp) => { setXpEarned((p) => p + xp); setStage('complete') }}
      />
    )
  }

  // ─── Complete ───
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-white mb-2">Grupo Concluído!</h3>
        <p className="text-blue-200/80 mb-4">Key Vocabulary concluído</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">+{xpEarned} XP</p></div>
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">🪙 +5 WOA Coins</p></div>
        </div>
        <button onClick={() => { deleteCookie('woa_j2_b3_stage'); onComplete(alreadyCompleted ? 0 : xpEarned) }} className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}>CONTINUAR →</button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
