'use client'

import { useEffect, useState } from 'react'
import { playClick } from '@/lib/sounds'

interface Activity6A2ExpressionsProps {
  onComplete: (xp: number) => void
}

const EXPRESSIONS = [
  'I enjoy… because…',
  'My favorite hobby is…',
  'In my free time, I…',
  'I like to… when I want to relax',
  "I'm interested in…",
  "I'm passionate about…",
  'I usually… in my free time',
  'One thing I really like is…',
]

type Step = 'choose' | 'complete' | 'speak' | 'upgrade' | 'final' | 'complete'

export function Activity6A2Expressions({ onComplete }: Activity6A2ExpressionsProps) {
  const [step, setStep] = useState<Step>('choose')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [completed, setAnswers] = useState<Record<string, string>>({})
  const [spoken, setSpoken] = useState<Set<string>>(new Set())
  const [upgradeSpoken, setUpgradeSpoken] = useState<Set<string>>(new Set())
  const [finalSpoken, setFinalSpoken] = useState<Set<string>>(new Set())

  const handleSelectExpression = (expr: string) => {
    playClick()
    if (selected.size < 2) {
      const newSelected = new Set(selected)
      newSelected.add(expr)
      setSelected(newSelected)

      // Auto move to complete when 2 selected
      if (newSelected.size === 2) {
        setTimeout(() => setStep('complete'), 300)
      }
    }
  }

  const handleCompleteExpression = (expr: string, text: string) => {
    playClick()
    const newAnswers = { ...completed }
    newAnswers[expr] = text
    setAnswers(newAnswers)
  }

  const handleSpeak = (expr: string) => {
    playClick()
    const newSpoken = new Set(spoken)
    newSpoken.add(expr)
    setSpoken(newSpoken)

    if (newSpoken.size === 2) {
      setTimeout(() => setStep('upgrade'), 500)
    }
  }

  const handleUpgradeSpeak = (expr: string) => {
    playClick()
    const newSpoken = new Set(upgradeSpoken)
    newSpoken.add(expr)
    setUpgradeSpoken(newSpoken)
  }

  const handleFinalSpeak = (expr: string) => {
    playClick()
    const newSpoken = new Set(finalSpoken)
    newSpoken.add(expr)
    setFinalSpoken(newSpoken)
  }

  const allFinalComplete = finalSpoken.size === 5

  if (step === 'choose') {
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
            <span>🚀</span> Practice & Speak
          </h2>
          <p className="text-base text-blue-200/80">Step 1 — Choose 2 expressions</p>
          <p className="text-sm text-blue-200/50">Pick ANY 2 and listen to the audio</p>
        </div>

        <div className="space-y-2">
          {EXPRESSIONS.map((expr) => (
            <button
              key={expr}
              onClick={() => handleSelectExpression(expr)}
              className="w-full text-left p-4 rounded-lg transition-all"
              style={{
                background: selected.has(expr)
                  ? 'rgba(34,197,94,0.15)'
                  : 'rgba(0,102,255,0.1)',
                border: selected.has(expr)
                  ? '2px solid #22c55e'
                  : '1px solid rgba(0,212,255,0.2)',
                opacity: selected.size >= 2 && !selected.has(expr) ? 0.5 : 1,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{selected.has(expr) ? '✅' : '🎧'}</span>
                <span className="text-blue-200/80">{expr}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 'complete') {
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300">Step 2 — Complete your sentences</h2>
          <p className="text-sm text-blue-200/50">Write your own answers about you:</p>
        </div>

        <div className="space-y-4">
          {Array.from(selected).map((expr) => (
            <div key={expr} className="p-6 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(0,212,255,0.3)' }}>
              <p className="text-sm text-cyan-400/60 mb-2 tracking-widest">EXPRESSION</p>
              <p className="text-lg text-blue-200/90 mb-4">{expr}</p>
              <input
                type="text"
                placeholder="Type your answer..."
                value={completed[expr] || ''}
                onChange={(e) => handleCompleteExpression(expr, e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-cyan-400/30 text-blue-200 placeholder-blue-200/30 outline-none focus:border-cyan-400 transition-all"
              />
            </div>
          ))}
        </div>

        <button
          onClick={() => setStep('speak')}
          disabled={Object.keys(completed).length < 2}
          className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{
            background: Object.keys(completed).length === 2
              ? 'linear-gradient(135deg, #003AB0, #0066FF)'
              : 'rgba(0,102,255,0.3)',
            border: '2px solid #00D4FF',
          }}
        >
          ✓ CONTINUE (+10 XP)
        </button>
      </div>
    )
  }

  if (step === 'speak') {
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300">Step 3 — Speak & Improve</h2>
          <p className="text-base text-blue-200/80">Say your sentences with proper pronunciation:</p>
        </div>

        <div className="space-y-3">
          {Array.from(selected).map((expr) => (
            <button
              key={expr}
              onClick={() => handleSpeak(expr)}
              className="w-full text-left p-6 rounded-lg transition-all"
              style={{
                background: spoken.has(expr)
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(0,102,255,0.1)',
                border: spoken.has(expr)
                  ? '2px solid #22c55e'
                  : '1px solid rgba(0,212,255,0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-blue-200/90">{expr}</p>
                <span className="text-2xl">
                  {spoken.has(expr) ? '✅' : '🎤'}
                </span>
              </div>
              {completed[expr] && (
                <p className="text-sm text-blue-200/60 mt-2">"{completed[expr]}"</p>
              )}
            </button>
          ))}
        </div>

        {spoken.size === 2 && (
          <button
            onClick={() => setStep('upgrade')}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #003AB0, #0066FF)',
              border: '2px solid #00D4FF',
            }}
          >
            ✓ CONTINUE (+15 XP)
          </button>
        )}
      </div>
    )
  }

  if (step === 'upgrade') {
    const upgradeExprs = ["I'm passionate about…", 'I usually… in my free time', 'One thing I really like is…']
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300">⚡ Step 4 — Upgrade</h2>
          <p className="text-base text-blue-200/80">Use 3 more expressions and speak them:</p>
        </div>

        <div className="space-y-4">
          {upgradeExprs.map((expr) => (
            <div key={expr} className="space-y-3 p-6 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(0,212,255,0.3)' }}>
              <p className="text-lg text-blue-200/90">{expr}</p>
              <input
                type="text"
                placeholder="Type your answer..."
                onChange={(e) => handleCompleteExpression(expr, e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black/30 border border-cyan-400/30 text-blue-200 placeholder-blue-200/30 outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => handleUpgradeSpeak(expr)}
                className="w-full py-2 rounded-lg transition-all"
                style={{
                  background: upgradeSpoken.has(expr) ? 'rgba(34,197,94,0.2)' : 'rgba(0,102,255,0.1)',
                  border: upgradeSpoken.has(expr) ? '2px solid #22c55e' : '1px solid rgba(0,212,255,0.2)',
                }}
              >
                {upgradeSpoken.has(expr) ? '✅ Spoken' : '🎤 Speak'}
              </button>
            </div>
          ))}
        </div>

        {upgradeSpoken.size === 3 && (
          <button
            onClick={() => setStep('final')}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #003AB0, #0066FF)',
              border: '2px solid #00D4FF',
            }}
          >
            ✓ CONTINUE (+20 XP)
          </button>
        )}
      </div>
    )
  }

  if (step === 'final') {
    const upgradeExprs = ["I'm passionate about…", 'I usually… in my free time', 'One thing I really like is…']
    const allExprsSet = new Set([...Array.from(selected), ...upgradeExprs])
    const allExprs = Array.from(allExprsSet)
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300">🧠 Step 5 — Final Practice</h2>
          <p className="text-base text-blue-200/80">Say all 5 sentences without reading:</p>
        </div>

        <div className="space-y-3">
          {allExprs.slice(0, 5).map((expr, idx) => (
            <button
              key={`final-${idx}-${expr}`}
              onClick={() => handleFinalSpeak(expr)}
              className="w-full text-left p-6 rounded-lg transition-all"
              style={{
                background: finalSpoken.has(expr)
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(0,102,255,0.1)',
                border: finalSpoken.has(expr)
                  ? '2px solid #22c55e'
                  : '1px solid rgba(0,212,255,0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-blue-200/90">{expr}</p>
                <span className="text-2xl">
                  {finalSpoken.has(expr) ? '✅' : '🧠'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {allFinalComplete && (
          <button
            onClick={() => onComplete(70)}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #003AB0, #0066FF)',
              border: '2px solid #00D4FF',
            }}
          >
            ✓ COMPLETE ACTIVITY 6 (+70 XP)
          </button>
        )}
      </div>
    )
  }

  return null
}
