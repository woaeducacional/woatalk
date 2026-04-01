'use client'

import { useEffect, useState } from 'react'
import { playClick } from '@/lib/sounds'

interface Activity5LearnSpeakProps {
  onComplete: (xp: number) => void
}

const VOCABULARY = [
  { word: 'Hobby', definition: 'An activity done for pleasure' },
  { word: 'Interest', definition: 'Wanting to learn more about something' },
  { word: 'Enjoy', definition: 'To feel pleasure' },
  { word: 'Activity', definition: 'Something you do' },
  { word: 'Leisure', definition: 'Free time' },
  { word: 'Free time', definition: 'Time when you are not busy' },
  { word: 'Passion', definition: 'Something you love a lot' },
  { word: 'Relax', definition: 'To rest and feel calm' },
]

const FILL_BLANKS = [
  { sentence: 'I ___ watching movies on weekends.', options: ['enjoy', 'hobby', 'activity'], answer: 'enjoy' },
  { sentence: 'In my ___ time, I like to read.', options: ['leisure', 'passion', 'interest'], answer: 'leisure' },
  { sentence: 'Playing soccer is my favorite ___.', options: ['hobby', 'relax', 'free time'], answer: 'hobby' },
  { sentence: 'I like to ___ by listening to music.', options: ['relax', 'interest', 'activity'], answer: 'relax' },
  { sentence: 'Traveling is my biggest ___.', options: ['passion', 'leisure', 'enjoy'], answer: 'passion' },
  { sentence: 'I have an ___ in learning English.', options: ['interest', 'hobby', 'relax'], answer: 'interest' },
]

type Step = 'match' | 'fill' | 'speak' | 'memory' | 'complete'

export function Activity5LearnSpeak({ onComplete }: Activity5LearnSpeakProps) {
  const [step, setStep] = useState<Step>('match')
  const [matchedWords, setMatchedWords] = useState<Set<string>>(new Set())
  const [currentFillIdx, setCurrentFillIdx] = useState(0)
  const [fillAnswers, setFillAnswers] = useState<Record<number, string>>({})
  const [speakAnswers, setSpeakAnswers] = useState<Record<number, boolean>>({})
  const [memoryAnswers, setMemoryAnswers] = useState<Record<number, boolean>>({})

  const handleMatchWord = (word: string) => {
    playClick()
    const newMatched = new Set(matchedWords)
    if (newMatched.has(word)) {
      newMatched.delete(word)
    } else {
      newMatched.add(word)
    }
    setMatchedWords(newMatched)
  }

  const goToNextStep = (nextStep: Step) => {
    playClick()
    setStep(nextStep)
  }

  const handleFillAnswer = (answer: string) => {
    const newAnswers = { ...fillAnswers }
    newAnswers[currentFillIdx] = answer
    setFillAnswers(newAnswers)

    // Mostrar feedback
    const isCorrect = answer === FILL_BLANKS[currentFillIdx].answer

    if (isCorrect && currentFillIdx < FILL_BLANKS.length - 1) {
      setTimeout(() => {
        setCurrentFillIdx(currentFillIdx + 1)
      }, 500)
    } else if (isCorrect && currentFillIdx === FILL_BLANKS.length - 1) {
      setTimeout(() => {
        goToNextStep('speak')
      }, 500)
    }
  }

  const handleSpeak = (idx: number) => {
    playClick()
    const newAnswers = { ...speakAnswers }
    newAnswers[idx] = true
    setSpeakAnswers(newAnswers)
  }

  const handleMemory = (idx: number) => {
    playClick()
    const newAnswers = { ...memoryAnswers }
    newAnswers[idx] = true
    setMemoryAnswers(newAnswers)
  }

  const allMemoryComplete = Object.keys(memoryAnswers).length === 3

  if (step === 'match') {
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
            <span>🎯</span> Learn & Speak
          </h2>
          <p className="text-base text-blue-200/80">Step 1 — Match</p>
          <p className="text-sm text-blue-200/50">Click each word to hear and mark as learned:</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VOCABULARY.map((item) => (
            <button
              key={item.word}
              onClick={() => handleMatchWord(item.word)}
              className="text-left p-4 rounded-lg transition-all"
              style={{
                background: matchedWords.has(item.word)
                  ? 'rgba(34,197,94,0.15)'
                  : 'rgba(0,102,255,0.1)',
                border: matchedWords.has(item.word)
                  ? '2px solid #22c55e'
                  : '1px solid rgba(0,212,255,0.2)',
              }}
            >
              <div className="flex items-start gap-2">
                <span className="text-xl">{matchedWords.has(item.word) ? '✅' : '🎧'}</span>
                <div>
                  <p className="font-bold text-blue-200/90">{item.word}</p>
                  <p className="text-xs text-blue-200/50">{item.definition}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => goToNextStep('fill')}
          disabled={matchedWords.size < VOCABULARY.length}
          className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{
            background: matchedWords.size === VOCABULARY.length
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

  if (step === 'fill') {
    const current = FILL_BLANKS[currentFillIdx]
    const userChoice = fillAnswers[currentFillIdx]
    const isCorrect = userChoice === current.answer

    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
            <span>⚡</span> Step 2 — Choose & Speak
          </h2>
          <p className="text-sm text-blue-200/50">
            {currentFillIdx + 1}/{FILL_BLANKS.length}
          </p>
        </div>

        <div className="p-8 rounded-2xl backdrop-blur-md" style={{ background: 'rgba(0,36,120,0.5)', border: '1px solid rgba(0,212,255,0.3)' }}>
          <p className="text-xl text-blue-200/90 font-light mb-6">
            {current.sentence}
          </p>

          <div className="space-y-3 mb-6">
            {current.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleFillAnswer(opt)}
                className="w-full text-left p-4 rounded-lg transition-all"
                style={{
                  background: userChoice === opt
                    ? isCorrect
                      ? 'rgba(34,197,94,0.2)'
                      : 'rgba(239,68,68,0.2)'
                    : 'rgba(0,102,255,0.1)',
                  border: userChoice === opt
                    ? isCorrect
                      ? '2px solid #22c55e'
                      : '2px solid #ef4444'
                    : '1px solid rgba(0,212,255,0.2)',
                }}
              >
                <span className="font-bold text-blue-200/80">{opt}</span>
              </button>
            ))}
          </div>

          {userChoice && (
            <div
              className="p-4 rounded-lg text-center"
              style={{
                background: isCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
              }}
            >
              <p className={`font-bold text-sm ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                {isCorrect ? '✅ Correct!' : '❌ Try again'}
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (step === 'speak') {
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
            <span>🎤</span> Step 3 — Speak
          </h2>
          <p className="text-base text-blue-200/80">Complete and say these sentences:</p>
        </div>

        <div className="space-y-3">
          {[
            'I enjoy ______ in my free time.',
            'My favorite hobby is ______.',
          ].map((sentence, idx) => (
            <button
              key={idx}
              onClick={() => handleSpeak(idx)}
              className="w-full text-left p-6 rounded-lg transition-all"
              style={{
                background: speakAnswers[idx]
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(0,102,255,0.1)',
                border: speakAnswers[idx]
                  ? '2px solid #22c55e'
                  : '1px solid rgba(0,212,255,0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-lg text-blue-200/90">{sentence}</p>
                <span className="text-2xl">
                  {speakAnswers[idx] ? '✅' : '🎤'}
                </span>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => goToNextStep('memory')}
          disabled={Object.keys(speakAnswers).length < 2}
          className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
          style={{
            background: Object.keys(speakAnswers).length === 2
              ? 'linear-gradient(135deg, #003AB0, #0066FF)'
              : 'rgba(0,102,255,0.3)',
            border: '2px solid #00D4FF',
          }}
        >
          ✓ CONTINUE (+15 XP)
        </button>
      </div>
    )
  }

  if (step === 'memory') {
    return (
      <div className="space-y-8">
        <div className="space-y-4 p-6 rounded-2xl" style={{ background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
          <h2 className="text-2xl font-bold text-cyan-300 flex items-center gap-2">
            <span>🧠</span> Step 4 — Memory Boost
          </h2>
          <p className="text-base text-blue-200/80">Say 3 sentences without reading:</p>
        </div>

        <div className="space-y-3">
          {[
            'I enjoy watching movies in my free time.',
            'Music helps me relax.',
            'My favorite hobby is playing soccer.',
          ].map((sentence, idx) => (
            <button
              key={idx}
              onClick={() => handleMemory(idx)}
              className="w-full text-left p-6 rounded-lg transition-all"
              style={{
                background: memoryAnswers[idx]
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(0,102,255,0.1)',
                border: memoryAnswers[idx]
                  ? '2px solid #22c55e'
                  : '1px solid rgba(0,212,255,0.2)',
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-lg text-blue-200/90">{sentence}</p>
                <span className="text-2xl">
                  {memoryAnswers[idx] ? '✅' : '🧠'}
                </span>
              </div>
            </button>
          ))}
        </div>

        {allMemoryComplete && (
          <button
            onClick={() => onComplete(65)}
            className="w-full font-bold tracking-widest px-8 py-4 rounded-lg text-white transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #003AB0, #0066FF)',
              border: '2px solid #00D4FF',
            }}
          >
            ✓ COMPLETE ACTIVITY 5 (+65 XP)
          </button>
        )}
      </div>
    )
  }

  return null
}
