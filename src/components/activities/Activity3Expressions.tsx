'use client'

import { useState, useRef } from 'react'
import { getSpeechRecognition } from '@/src/lib/speechRecognition'

interface Activity3ExpressionsProps {
  onComplete: (xp: number) => void
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

function tts(text: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { resolve(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'en-US'; u.rate = rate
    u.onend = () => resolve(); u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

export function Activity3Expressions({ onComplete }: Activity3ExpressionsProps) {
  const [stage, setStage] = useState<Stage>('choose')
  const [selected, setSelected] = useState<number[]>([])
  const [repeatIdx, setRepeatIdx] = useState(0)
  const [completeSentences, setCompleteSentences] = useState<string[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [speakIdx, setSpeakIdx] = useState(0)
  const [upgradeSelected, setUpgradeSelected] = useState<number[]>([])
  const [upgradeRepeatIdx, setUpgradeRepeatIdx] = useState(0)
  const [finalIdx, setFinalIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [score, setScore] = useState(0)
  const [error, setError] = useState('')
  const [xpEarned, setXpEarned] = useState(0)
  const transcriptRef = useRef('')

  const calcScore = (spoken: string, target: string): number => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z\s]/g, '').trim().split(/\s+/)
    const a = norm(spoken), b = norm(target)
    if (b.length === 0) return 0
    let m = 0; for (const w of b) if (a.includes(w)) m++
    return Math.round((m / b.length) * 100)
  }

  const record = async (target: string, onPass: () => void, threshold = 70) => {
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
    rec.onend = () => { setIsRecording(false); if (timer) clearTimeout(timer); const s = calcScore(transcriptRef.current, target); setScore(s); if (s >= threshold) { setTimeout(onPass, 500) } else { setError(`Score: ${s}%. Mínimo ${threshold}%. Tente de novo.`) } }
    rec.onerror = (e: any) => { setIsRecording(false); if (timer) clearTimeout(timer); setError(e.error === 'no-speech' ? 'Nenhuma fala detectada.' : `Erro: ${e.error}`) }

    await rec.start(); resetT()
  }

  const freeRecord = async (onDone: (text: string) => void) => {
    if (isRecording) return
    setError(''); setTranscript('')
    const API = getSpeechRecognition(); if (!API) return
    const rec = new API(); rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true
    setIsRecording(true); transcriptRef.current = ''
    let timer: ReturnType<typeof setTimeout> | null = null
    const resetT = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => rec.stop(), 3000) }
    rec.onresult = (e: any) => { resetT(); transcriptRef.current = Array.from(e.results).map((r: any) => r[0].transcript).join(''); setTranscript(transcriptRef.current) }
    rec.onend = () => { setIsRecording(false); if (timer) clearTimeout(timer); if (transcriptRef.current.trim().split(/\s+/).length >= 3) { onDone(transcriptRef.current) } else { setError('Diga uma frase completa.') } }
    rec.onerror = (e: any) => { setIsRecording(false); setError(e.error === 'no-speech' ? 'Nenhuma fala.' : `Erro: ${e.error}`) }
    await rec.start(); resetT()
  }

  const allSelected = [...selected, ...upgradeSelected]
  const allExpressions = allSelected.map(i => EXPRESSIONS[i])

  // ─── Choose 2 expressions ───
  if (stage === 'choose') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-purple-400/30" style={{ background: 'rgba(168,85,247,0.06)' }}>
          <p className="text-purple-300 font-bold text-sm tracking-widest mb-0.5">✨ STEP 1 — CHOOSE 2 EXPRESSIONS</p>
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
            <button onClick={() => { setRepeatIdx(0); setStage('listenRepeat') }} className="mt-4 w-full py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}>
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
    const exp = EXPRESSIONS[selected[repeatIdx]]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-purple-400/30 text-center" style={{ background: 'rgba(168,85,247,0.06)' }}>
          <p className="text-purple-300 font-bold text-sm mb-0.5">🎧 LISTEN & REPEAT ({repeatIdx + 1}/2)</p>
          <p className="text-white/40 text-[10px] mb-3">Ouça e repita</p>
          <p className="text-white text-xl font-semibold mb-2">{exp.text}</p>
          <p className="text-blue-200/60 text-sm mb-6">{exp.example}</p>

          <button onClick={async () => { setIsPlaying(true); await tts(exp.example); setIsPlaying(false) }} disabled={isPlaying} className="px-6 py-2 rounded-xl font-bold text-white mb-4 hover:scale-105 transition-all" style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
            {isPlaying ? '🔊...' : '🎧 Ouvir'}
          </button>

          <div>
            {transcript && <p className="text-blue-200/60 text-sm mb-1">&quot;{transcript}&quot;</p>}
            {score > 0 && <p className={`text-sm font-bold mb-2 ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>}
            {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
            <button
              onClick={() => record(exp.example, () => {
                setTranscript(''); setScore(0); setXpEarned(p => p + 10)
                if (repeatIdx < 1) setRepeatIdx(1)
                else setStage('completeStep')
              }, 70)}
              disabled={isRecording}
              className="px-6 py-2 rounded-xl font-bold text-white hover:scale-105 transition-all"
              style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              {isRecording ? '🔴 Gravando...' : '🎤 Repetir'}
            </button>
          </div>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Complete a sentence about yourself ───
  if (stage === 'completeStep') {
    const exp = EXPRESSIONS[selected[completeSentences.length]]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-yellow-400/30" style={{ background: 'rgba(250,204,21,0.06)' }}>
          <p className="text-yellow-300 font-bold text-sm mb-0.5">✍️ STEP 2 — COMPLETE ({completeSentences.length + 1}/2)</p>
          <p className="text-white/40 text-[10px] mb-3">Complete a expressão</p>
          <p className="text-blue-200/80 mb-2">Complete sobre você:</p>
          <p className="text-white text-xl font-semibold mb-4">{exp.text}</p>

          <input
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder="Type your sentence..."
            className="w-full p-3 rounded-lg bg-white/5 border border-white/20 text-white placeholder-blue-200/30 mb-4"
          />
          {currentInput.trim().split(/\s+/).length >= 3 && (
            <button onClick={() => {
              const newList = [...completeSentences, currentInput.trim()]
              setCompleteSentences(newList); setCurrentInput('')
              if (newList.length >= 2) { setXpEarned(p => p + 10); setSpeakIdx(0); setStage('speakWithText') }
            }} className="w-full py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
              Próximo →
            </button>
          )}
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Speak with text visible ───
  if (stage === 'speakWithText') {
    const sent = completeSentences[speakIdx]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.06)' }}>
          <p className="text-green-300 font-bold text-sm mb-0.5">🎤 STEP 3a — SPEAK (with text) ({speakIdx + 1}/2)</p>
          <p className="text-white/40 text-[10px] mb-3">Fale com o texto à vista</p>
          <p className="text-white text-xl font-semibold mb-6">{sent}</p>

          <button onClick={async () => { setIsPlaying(true); await tts(sent); setIsPlaying(false) }} disabled={isPlaying} className="px-6 py-2 rounded-xl font-bold text-white mb-4 hover:scale-105 transition-all" style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
            {isPlaying ? '🔊...' : '🎧 Ouvir'}
          </button>
          <div>
            {transcript && <p className="text-blue-200/60 text-sm mb-1">&quot;{transcript}&quot;</p>}
            {score > 0 && <p className={`text-sm font-bold mb-2 ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>}
            {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
            <button
              onClick={() => record(sent, () => {
                setTranscript(''); setScore(0)
                if (speakIdx < 1) setSpeakIdx(1)
                else { setSpeakIdx(0); setStage('speakNoText') }
              }, 70)}
              disabled={isRecording}
              className="px-6 py-2 rounded-xl font-bold text-white hover:scale-105 transition-all"
              style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              {isRecording ? '🔴 Gravando...' : '🎤 Falar'}
            </button>
          </div>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Speak without text ───
  if (stage === 'speakNoText') {
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-orange-400/30 text-center" style={{ background: 'rgba(249,115,22,0.06)' }}>
          <p className="text-orange-300 font-bold text-sm mb-3">🧠 STEP 3b — SEM TEXTO ({speakIdx + 1}/2)</p>
          <p className="text-blue-200/80 mb-6">Now say your sentence without looking!</p>

          {transcript && <p className="text-blue-200/60 text-sm mb-1">&quot;{transcript}&quot;</p>}
          {score > 0 && <p className={`text-sm font-bold mb-2 ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>}
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button
            onClick={() => record(completeSentences[speakIdx], () => {
              setTranscript(''); setScore(0); setXpEarned(p => p + 15)
              if (speakIdx < 1) setSpeakIdx(1)
              else setStage('upgrade')
            }, 70)}
            disabled={isRecording}
            className="px-6 py-2 rounded-xl font-bold text-white hover:scale-105 transition-all"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🧠 Falar de memória'}
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Upgrade: Pick 3 more expressions ───
  if (stage === 'upgrade') {
    const remaining = EXPRESSIONS.filter(e => !selected.includes(e.id))
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-cyan-400/30" style={{ background: 'rgba(0,212,255,0.06)' }}>
          <p className="text-cyan-300 font-bold text-sm tracking-widest mb-0.5">⬆️ UPGRADE — CHOOSE 3 MORE</p>
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
            <button onClick={() => { setUpgradeRepeatIdx(0); setStage('upgradeRepeat') }} className="mt-4 w-full py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
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
    const exp = EXPRESSIONS[upgradeSelected[upgradeRepeatIdx]]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-cyan-400/30 text-center" style={{ background: 'rgba(0,212,255,0.06)' }}>
          <p className="text-cyan-300 font-bold text-sm mb-0.5">🎧 UPGRADE — REPEAT ({upgradeRepeatIdx + 1}/3)</p>
          <p className="text-white/40 text-[10px] mb-3">Repita as expressões novas</p>
          <p className="text-white text-xl font-semibold mb-2">{exp.text}</p>
          <p className="text-blue-200/60 text-sm mb-6">{exp.example}</p>

          <button onClick={async () => { setIsPlaying(true); await tts(exp.example); setIsPlaying(false) }} disabled={isPlaying} className="px-6 py-2 rounded-xl font-bold text-white mb-4 hover:scale-105 transition-all" style={{ background: isPlaying ? '#666' : 'linear-gradient(135deg, #00D4FF, #0066FF)' }}>
            {isPlaying ? '🔊...' : '🎧 Ouvir'}
          </button>

          <div>
            {transcript && <p className="text-blue-200/60 text-sm mb-1">&quot;{transcript}&quot;</p>}
            {score > 0 && <p className={`text-sm font-bold mb-2 ${score >= 70 ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>}
            {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
            <button
              onClick={() => record(exp.example, () => {
                setTranscript(''); setScore(0)
                if (upgradeRepeatIdx < 2) setUpgradeRepeatIdx(upgradeRepeatIdx + 1)
                else { setXpEarned(p => p + 10); setFinalIdx(0); setStage('final') }
              }, 70)}
              disabled={isRecording}
              className="px-6 py-2 rounded-xl font-bold text-white hover:scale-105 transition-all"
              style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
            >
              {isRecording ? '🔴 Gravando...' : '🎤 Repetir'}
            </button>
          </div>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Final: Say 5 expressions without listening (80% minimum) ───
  if (stage === 'final') {
    const exp = EXPRESSIONS[allSelected[finalIdx]]
    return (
      <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
        <div className="p-6 rounded-xl border border-red-400/30 text-center" style={{ background: 'rgba(239,68,68,0.06)' }}>
          <p className="text-red-300 font-bold text-sm mb-3">🔥 FINAL — SEM ÁUDIO ({finalIdx + 1}/{allSelected.length})</p>
          <p className="text-blue-200/80 mb-6">Say this expression without listening (80% minimum):</p>

          {transcript && <p className="text-blue-200/60 text-sm mb-1">&quot;{transcript}&quot;</p>}
          {score > 0 && <p className={`text-sm font-bold mb-2 ${score >= 80 ? 'text-green-400' : 'text-red-400'}`}>{score}%</p>}
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <button
            onClick={() => record(exp.example, () => {
              setTranscript(''); setScore(0)
              if (finalIdx < allSelected.length - 1) setFinalIdx(finalIdx + 1)
              else { setXpEarned(p => p + 25); setStage('complete') }
            }, 80)}
            disabled={isRecording}
            className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all"
            style={{ background: isRecording ? '#ef4444' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            {isRecording ? '🔴 Gravando...' : '🧠 Falar'}
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
      </div>
    )
  }

  // ─── Complete ───
  return (
    <div className="space-y-6" style={{ animation: 'fadeIn 0.5s ease-in' }}>
      <div className="p-8 rounded-xl border border-green-400/30 text-center" style={{ background: 'rgba(34,197,94,0.08)' }}>
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-2xl font-black text-white mb-2">Group Complete!</h3>
        <p className="text-blue-200/80 mb-4">Practice & Speak concluído</p>
        <div className="flex justify-center gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">+{xpEarned} XP</p></div>
          <div className="px-4 py-2 rounded-lg bg-yellow-500/20 border border-yellow-400"><p className="text-yellow-300 font-bold">🪙 +5 WOA Coins</p></div>
        </div>
        <button onClick={() => onComplete(xpEarned)} className="px-8 py-3 rounded-xl font-bold text-white hover:scale-105 transition-all" style={{ background: 'linear-gradient(135deg, #003AB0, #0066FF)', border: '2px solid #00D4FF' }}>CONTINUAR →</button>
      </div>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}
