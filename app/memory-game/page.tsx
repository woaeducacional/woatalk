'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { playCorrect, playWrong } from '@/lib/sounds'

interface VocabularyWord {
  en: string
  pt: string
}

type PairsData = VocabularyWord[]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Card {
  id: string
  pairIndex: number
  word: string
  isFlipped: boolean
  isMatched: boolean
}

function buildDeck(pairsData?: PairsData): { blueCards: Card[]; orangeCards: Card[] } {
  if (!pairsData || !pairsData.length) {
    return { blueCards: [], orangeCards: [] }
  }
  const enShuffled = shuffle(pairsData.map((p, i) => ({ pairIndex: i, word: p.en || '' })))
  const ptShuffled = shuffle(pairsData.map((p, i) => ({ pairIndex: i, word: p.pt || '' })))
  return {
    blueCards:   enShuffled.map((c, i) => ({ id: `b${i}`, ...c, isFlipped: false, isMatched: false })),
    orangeCards: ptShuffled.map((c, i) => ({ id: `o${i}`, ...c, isFlipped: false, isMatched: false })),
  }
}

function MemCard({
  card,
  color,
  isSelected,
  isWrong,
  isCorrect,
  onClick,
}: {
  card: Card
  color: 'blue' | 'orange'
  isSelected: boolean
  isWrong: boolean
  isCorrect: boolean
  onClick: () => void
}) {
  const isBlue = color === 'blue'

  const borderColor = isWrong
    ? '#ef4444'
    : isCorrect
    ? '#22c55e'
    : isSelected
    ? (isBlue ? '#00D4FF' : '#FF8C00')
    : card.isMatched
    ? 'rgba(255,255,255,0.1)'
    : isBlue ? 'rgba(0,180,255,0.35)' : 'rgba(255,120,0,0.35)'

  const glow = isWrong
    ? '0 0 20px rgba(239,68,68,0.7)'
    : isCorrect
    ? '0 0 20px rgba(34,197,94,0.7)'
    : isSelected
    ? (isBlue ? '0 0 18px rgba(0,212,255,0.55)' : '0 0 18px rgba(255,140,0,0.55)')
    : '0 2px 8px rgba(0,0,0,0.5)'

  return (
    <div
      onClick={onClick}
      style={{ perspective: '700px', cursor: card.isMatched ? 'default' : 'pointer', opacity: card.isMatched ? 0.32 : 1 }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '72%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.42s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: (card.isFlipped || card.isMatched) ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* FACE TRASEIRA — logo WOA */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: 9,
            background: isBlue
              ? 'linear-gradient(135deg, #010D25, #002060)'
              : 'linear-gradient(135deg, #1A0800, #461500)',
            border: `2px solid ${borderColor}`,
            boxShadow: glow,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        >
          <Image
            src="/images/logo.png"
            alt="WOA"
            width={108}
            height={108}
            className="rounded-full object-cover"
            style={{ opacity: 0.45, filter: isBlue ? 'none' : 'sepia(1) saturate(3) hue-rotate(-20deg)' }}
          />
        </div>

        {/* FACE FRONTAL — palavra */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 9,
            background: isBlue
              ? 'linear-gradient(135deg, #0040C0, #0070FF)'
              : 'linear-gradient(135deg, #7A2800, #E85000)',
            border: `2px solid ${isCorrect ? '#22c55e' : isWrong ? '#ef4444' : isBlue ? '#00D4FF' : '#FF7000'}`,
            boxShadow: isCorrect
              ? '0 0 22px rgba(34,197,94,0.65)'
              : isWrong
              ? '0 0 22px rgba(239,68,68,0.65)'
              : isBlue
              ? '0 0 14px rgba(0,180,255,0.4)'
              : '0 0 14px rgba(255,100,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 5,
          }}
        >
          <span
            style={{
              fontSize: 'clamp(24px, 4vw, 36px)',
              fontWeight: 800,
              color: '#fff',
              textAlign: 'center',
              letterSpacing: '0.04em',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              wordBreak: 'break-word',
              lineHeight: 1.25,
            }}
          >
            {card.word}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function MemoryGamePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [isPremium, setIsPremium] = useState(false)
  const [blueCards,   setBlueCards]   = useState<Card[]>([])
  const [orangeCards, setOrangeCards] = useState<Card[]>([])
  const [selectedBlue,   setSelectedBlue]   = useState<string | null>(null)
  const [selectedOrange, setSelectedOrange] = useState<string | null>(null)
  const [score,        setScore]        = useState(0)
  const [isChecking,   setIsChecking]   = useState(false)
  const [matchedCount, setMatchedCount] = useState(0)
  const [attempts,     setAttempts]     = useState(0)
  const [gameState,    setGameState]    = useState<'playing' | 'won' | 'quit'>('playing')
  const [flashIds,     setFlashIds]     = useState<{ ids: string[]; type: 'wrong' | 'correct' }>({ ids: [], type: 'wrong' })
  const [quitConfirm,  setQuitConfirm]  = useState(false)
  const [pairs,        setPairs]        = useState<PairsData | null>(null)
  const [isLoading,    setIsLoading]    = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      // Check if user is premium
      fetch('/api/user/subscription')
        .then(r => r.json())
        .then(d => {
          if (!d.isPremium) {
            router.push('/premium')
          } else {
            setIsPremium(true)
            // Now fetch vocabulary
            fetch('/api/memory-game/vocabulary')
              .then(r => r.json())
              .then(data => {
                if (data.pairs && data.pairs.length > 0) {
                  setPairs(data.pairs)
                } else {
                  setPairs([
                    { en: 'Apple', pt: 'Maçã' },
                    { en: 'Book', pt: 'Livro' },
                    { en: 'House', pt: 'Casa' },
                    { en: 'Car', pt: 'Carro' },
                    { en: 'Table', pt: 'Mesa' },
                    { en: 'Chair', pt: 'Cadeira' },
                    { en: 'Phone', pt: 'Telefone' },
                    { en: 'Computer', pt: 'Computador' },
                    { en: 'Lamp', pt: 'Lâmpada' },
                    { en: 'Door', pt: 'Porta' },
                    { en: 'Window', pt: 'Janela' },
                    { en: 'Tree', pt: 'Árvore' },
                    { en: 'Flower', pt: 'Flor' },
                    { en: 'Sun', pt: 'Sol' },
                    { en: 'Moon', pt: 'Lua' },
                  ])
                }
                setIsLoading(false)
              })
              .catch(() => {
                setPairs([
                  { en: 'Apple', pt: 'Maçã' },
                  { en: 'Book', pt: 'Livro' },
                  { en: 'House', pt: 'Casa' },
                  { en: 'Car', pt: 'Carro' },
                  { en: 'Table', pt: 'Mesa' },
                  { en: 'Chair', pt: 'Cadeira' },
                  { en: 'Phone', pt: 'Telefone' },
                  { en: 'Computer', pt: 'Computador' },
                  { en: 'Lamp', pt: 'Lâmpada' },
                  { en: 'Door', pt: 'Porta' },
                  { en: 'Window', pt: 'Janela' },
                  { en: 'Tree', pt: 'Árvore' },
                  { en: 'Flower', pt: 'Flor' },
                  { en: 'Sun', pt: 'Sol' },
                  { en: 'Moon', pt: 'Lua' },
                ])
                setIsLoading(false)
              })
          }
        })
        .catch(() => {
          router.push('/premium')
        })
    }
  }, [status, router])

  useEffect(() => { if (pairs) startGame() }, [pairs])

  // Share game result to community when won
  useEffect(() => {
    if (gameState === 'won' && session?.user?.id) {
      fetch('/api/memory-game/share-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score,
          matchedCount,
          attempts,
          totalCards: pairs?.length || 15,
        }),
      }).catch(() => {})
    }
  }, [gameState, session?.user?.id, score, matchedCount, attempts, pairs?.length])

  function startGame() {
    if (!pairs) return
    const deck = buildDeck(pairs)
    setBlueCards(deck.blueCards)
    setOrangeCards(deck.orangeCards)
    setSelectedBlue(null)
    setSelectedOrange(null)
    setScore(0)
    setIsChecking(false)
    setMatchedCount(0)
    setAttempts(0)
    setGameState('playing')
    setFlashIds({ ids: [], type: 'wrong' })
    setQuitConfirm(false)
  }

  const handleBlueClick = useCallback((card: Card) => {
    if (isChecking || card.isMatched || gameState !== 'playing') return

    // Deselect if same card clicked again
    if (card.id === selectedBlue) {
      setBlueCards(prev => prev.map(c => c.id === card.id ? { ...c, isFlipped: false } : c))
      setSelectedBlue(null)
      return
    }

    // Block switching to another blue card while one is already selected
    if (selectedBlue) return

    setBlueCards(prev => prev.map(c => c.id === card.id ? { ...c, isFlipped: true } : c))
    setSelectedBlue(card.id)
  }, [isChecking, selectedBlue, gameState])

  const handleOrangeClick = useCallback((card: Card) => {
    if (isChecking || card.isMatched || !selectedBlue || gameState !== 'playing') return

    setOrangeCards(prev => prev.map(c => c.id === card.id ? { ...c, isFlipped: true } : c))
    setSelectedOrange(card.id)
    setAttempts(prev => prev + 1)

    const bCard = blueCards.find(c => c.id === selectedBlue)!

    if (bCard.pairIndex === card.pairIndex) {
      setFlashIds({ ids: [selectedBlue, card.id], type: 'correct' })
      playCorrect()
      setScore(prev => prev + 10)
      setIsChecking(true)
      setTimeout(() => {
        setBlueCards(prev  => prev.map(c => c.id === selectedBlue ? { ...c, isMatched: true } : c))
        setOrangeCards(prev => prev.map(c => c.id === card.id     ? { ...c, isMatched: true } : c))
        setMatchedCount(prev => {
          const next = prev + 1
          if (next === pairs?.length) setGameState('won')
          return next
        })
        setSelectedBlue(null)
        setSelectedOrange(null)
        setIsChecking(false)
        setFlashIds({ ids: [], type: 'correct' })
      }, 750)
    } else {
      setFlashIds({ ids: [selectedBlue, card.id], type: 'wrong' })
      playWrong()
      setScore(prev => prev - 1)
      setIsChecking(true)
      setTimeout(() => {
        setBlueCards(prev  => prev.map(c => c.id === selectedBlue ? { ...c, isFlipped: false } : c))
        setOrangeCards(prev => prev.map(c => c.id === card.id     ? { ...c, isFlipped: false } : c))
        setSelectedBlue(null)
        setSelectedOrange(null)
        setIsChecking(false)
        setFlashIds({ ids: [], type: 'wrong' })
      }, 1100)
    }
  }, [isChecking, selectedBlue, blueCards, gameState])

  if (isLoading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <p className="text-cyan-300/60 text-sm tracking-widest">CARREGANDO VOCABULÁRIO...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (!blueCards.length) return null

  const isOver = gameState === 'won' || gameState === 'quit'

  return (
    <main className="min-h-screen" style={{ background: '#060A14' }}>
      {/* scanlines */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.022]"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00FFFF 2px, #00FFFF 3px)' }}
      />

      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-2.5 border-b border-cyan-400/20 backdrop-blur-md"
        style={{ background: 'rgba(6,10,20,0.88)' }}
      >
        <div className="flex items-center gap-2.5">
          <Image src="/images/logo.png" alt="WOA" width={34} height={34} className="rounded-full border-2 border-cyan-400/50 object-cover" />
          <div>
            <p className="text-white font-black tracking-[0.18em] text-[13px] leading-none" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>
              MEMORY MATCH
            </p>
            <p className="text-cyan-400/40 text-[9px] tracking-[0.15em] font-bold leading-none mt-0.5">WOA TALK</p>
          </div>
        </div>

        {/* counters */}
        <div className="flex items-center gap-5">
          <div className="text-center">
            <p className="text-[8px] font-bold tracking-[0.2em] text-cyan-400/50 mb-0.5">PONTUAÇÃO</p>
            <p
              className="text-lg font-black leading-none"
              style={{
                color: score >= 0 ? '#00D4FF' : '#ef4444',
                textShadow: score >= 0 ? '0 0 14px rgba(0,212,255,0.6)' : '0 0 14px rgba(239,68,68,0.6)',
              }}
            >
              {score > 0 ? '+' : ''}{score}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-bold tracking-[0.2em] text-green-400/50 mb-0.5">PARES</p>
            <p className="text-lg font-black leading-none text-green-400" style={{ textShadow: '0 0 10px rgba(34,197,94,0.5)' }}>
              {matchedCount}<span className="text-white/20 text-sm">/{pairs?.length ?? 15}</span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-[8px] font-bold tracking-[0.2em] text-yellow-400/50 mb-0.5">TENTATIVAS</p>
            <p className="text-lg font-black leading-none text-yellow-400">{attempts}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOver && (
            <button
              onClick={() => setQuitConfirm(true)}
              className="px-3.5 py-1.5 text-[10px] font-black tracking-widest rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#ef4444' }}
            >
              🏳 DESISTIR
            </button>
          )}
          <Link
            href="/dashboard"
            className="px-3.5 py-1.5 text-[10px] font-black tracking-widest rounded-full transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
          >
            ← VOLTAR
          </Link>
        </div>
      </header>

      {/* ── QUIT CONFIRM MODAL ── */}
      {quitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div
            className="text-center space-y-5 p-8 rounded-2xl"
            style={{ background: '#0B1120', border: '1px solid rgba(239,68,68,0.4)', boxShadow: '0 0 40px rgba(239,68,68,0.2)' }}
          >
            <p className="text-white font-black text-lg tracking-widest">DESISTIR DO JOGO?</p>
            <p className="text-white/40 text-sm">Seu progresso atual será perdido.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setGameState('quit'); setQuitConfirm(false) }}
                className="px-6 py-2 text-xs font-black tracking-widest rounded-full transition-all hover:scale-105"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}
              >
                SIM, DESISTIR
              </button>
              <button
                onClick={() => setQuitConfirm(false)}
                className="px-6 py-2 text-xs font-black tracking-widest rounded-full transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)' }}
              >
                CONTINUAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HINT BAR ── */}
      {!isOver && (
        <div className="text-center py-2">
          <span
            className="text-[10px] font-bold tracking-[0.15em]"
            style={{ color: selectedBlue ? 'rgba(255,140,0,0.7)' : 'rgba(0,212,255,0.6)' }}
          >
            {selectedBlue ? '🟠 Escolha a tradução em LARANJA' : '🔵 Selecione uma palavra em INGLÊS'}
          </span>
        </div>
      )}

      {/* ── END SCREEN ── */}
      {isOver ? (
        <div className="flex items-center justify-center" style={{ minHeight: '78vh' }}>
          <div
            className="text-center space-y-6 px-10 py-10 rounded-2xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: gameState === 'won' ? '1px solid rgba(0,212,255,0.3)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: gameState === 'won' ? '0 0 50px rgba(0,212,255,0.12)' : 'none',
            }}
          >
            <div className="text-5xl">{gameState === 'won' ? '🏆' : '🏳️'}</div>
            <h2 className="text-2xl font-black tracking-[0.18em] text-white">
              {gameState === 'won' ? 'PARABÉNS!' : 'VOCÊ DESISTIU'}
            </h2>
            <p className="text-white/40 text-sm">
              {gameState === 'won' ? 'Você encontrou todos os 28 pares!' : 'Que tal tentar novamente?'}
            </p>
            <div className="flex gap-10 justify-center pt-2">
              <div>
                <p className="text-[9px] text-cyan-400/50 tracking-[0.2em] font-bold mb-1">PONTUAÇÃO</p>
                <p className="text-3xl font-black" style={{ color: score >= 0 ? '#00D4FF' : '#ef4444' }}>{score}</p>
              </div>
              <div>
                <p className="text-[9px] text-green-400/50 tracking-[0.2em] font-bold mb-1">PARES</p>
                <p className="text-3xl font-black text-green-400">{matchedCount}/{pairs?.length ?? 15}</p>
              </div>
              <div>
                <p className="text-[9px] text-yellow-400/50 tracking-[0.2em] font-bold mb-1">TENTATIVAS</p>
                <p className="text-3xl font-black text-yellow-400">{attempts}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={startGame}
                className="px-8 py-3 text-xs font-black tracking-widest text-white rounded-full transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #0050E0, #00C8FF)', boxShadow: '0 0 22px rgba(0,200,255,0.35)' }}
              >
                JOGAR NOVAMENTE
              </button>
              <Link
                href="/dashboard"
                className="px-8 py-3 text-xs font-black tracking-widest text-white/60 rounded-full transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                VOLTAR
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* ── GAME AREA ── */
        <div className="flex flex-col md:flex-row gap-2 md:gap-2 px-2 pb-8 pt-1">
          {/* BLUE — English */}
          <div className="flex-1 min-w-0">
            <div className="text-center mb-2.5">
              <span
                className="text-[9px] font-black tracking-[0.22em] px-3 py-1 rounded-full"
                style={{ background: 'rgba(0,70,220,0.2)', border: '1px solid rgba(0,170,255,0.35)', color: '#00AAFF' }}
              >
                🇺🇸 &nbsp;INGLÊS
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-3">
              {blueCards.map(card => (
                <MemCard
                  key={card.id}
                  card={card}
                  color="blue"
                  isSelected={selectedBlue === card.id}
                  isWrong={flashIds.type === 'wrong' && flashIds.ids.includes(card.id)}
                  isCorrect={flashIds.type === 'correct' && flashIds.ids.includes(card.id)}
                  onClick={() => handleBlueClick(card)}
                />
              ))}
            </div>
          </div>

          {/* divider */}
          <div
            className="w-px self-stretch flex-shrink-0 hidden md:block"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.12) 80%, transparent)' }}
          />

          {/* divider horizontal mobile */}
          <div
            className="h-px self-stretch flex-shrink-0 md:hidden"
            style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.12) 80%, transparent)' }}
          />

          {/* ORANGE — Portuguese */}
          <div className="flex-1 min-w-0">
            <div className="text-center mb-2.5">
              <span
                className="text-[9px] font-black tracking-[0.22em] px-3 py-1 rounded-full"
                style={{ background: 'rgba(180,50,0,0.2)', border: '1px solid rgba(255,120,0,0.35)', color: '#FF7A00' }}
              >
                🇧🇷 &nbsp;PORTUGUÊS
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-3">
              {orangeCards.map(card => (
                <MemCard
                  key={card.id}
                  card={card}
                  color="orange"
                  isSelected={selectedOrange === card.id}
                  isWrong={flashIds.type === 'wrong' && flashIds.ids.includes(card.id)}
                  isCorrect={flashIds.type === 'correct' && flashIds.ids.includes(card.id)}
                  onClick={() => handleOrangeClick(card)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
