'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { playClick, playPoints } from '@/lib/sounds'

interface CheckpointCelebrationProps {
  checkpoint: number        // 1-10
  xpEarned: number
  missionsCompleted: number // 10
  onContinue: () => void
  onLater?: () => void
}

export function CheckpointCelebration({
  checkpoint,
  xpEarned,
  missionsCompleted,
  onContinue,
  onLater,
}: CheckpointCelebrationProps) {
  const [show, setShow]             = useState(false)
  const [xpDisplay, setXpDisplay]   = useState(0)
  const [coinPop, setCoinPop]       = useState(false)
  const [particles, setParticles]   = useState<{ id: number; x: number; y: number; color: string; angle: number }[]>([])
  const rafRef                      = useRef<number | null>(null)

  // Fade in on mount + play points sound
  useEffect(() => {
    const t = setTimeout(() => { setShow(true); playPoints() }, 30)
    return () => clearTimeout(t)
  }, [])

  // Confetti particles
  useEffect(() => {
    const COLORS = ['#0043BB', '#CC4A00', '#facc15', '#22c55e', '#e879f9', '#38bdf8']
    const pts = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: 35 + Math.random() * 30,   // roughly center
      y: 10 + Math.random() * 20,
      color: COLORS[i % COLORS.length],
      angle: Math.random() * 360,
    }))
    setParticles(pts)
  }, [])

  // Animated XP counter
  useEffect(() => {
    if (!show) return
    const duration = 1600
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setXpDisplay(Math.round(eased * xpEarned))
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [show, xpEarned])

  // Coin pop after slight delay
  useEffect(() => {
    if (!show) return
    const t = setTimeout(() => setCoinPop(true), 900)
    return () => clearTimeout(t)
  }, [show])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(6px)',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.45s ease',
      }}
    >
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute w-2.5 h-2.5 rounded-sm"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              backgroundColor: p.color,
              transform: `rotate(${p.angle}deg)`,
              animation: `confettiFall ${1.8 + (p.id % 6) * 0.25}s ease-in forwards`,
              animationDelay: `${(p.id % 8) * 0.08}s`,
              opacity: show ? 1 : 0,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="relative mx-3 sm:mx-4 w-full max-w-sm rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(155deg, #001a5c 0%, #0043BB 60%, #002a80 100%)',
          transform: show ? 'scale(1) translateY(0)' : 'scale(0.88) translateY(32px)',
          transition: 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Top glow bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #CC4A00, #facc15, #CC4A00)' }} />

        <div className="px-4 sm:px-8 pt-6 sm:pt-8 pb-6 sm:pb-10 flex flex-col items-center gap-4 sm:gap-6 text-center">

          {/* Ocean icon */}
          <div
            style={{
              animation: show ? 'iconFloat 3s ease-in-out infinite' : 'none',
            }}
          >
            <Image
              src="/images/icon_atlantico.png"
              alt="Atlantic Ocean"
              width={80}
              height={80}
              className="object-contain drop-shadow-xl sm:w-[100px] sm:h-[100px]"
            />
          </div>

          {/* Checkpoint label */}
          <div>
            <p className="text-[9px] sm:text-xs font-bold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-blue-300 mb-1">
              Checkpoint {checkpoint} / 10
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              Atlantic<br />
              Ocean
            </h2>
          </div>

          {/* Stats row */}
          <div className="w-full grid grid-cols-3 gap-2 sm:gap-3">
            {/* Missions */}
            <div className="bg-white/10 rounded-xl sm:rounded-2xl px-2 py-3 sm:py-4 flex flex-col items-center gap-0.5 sm:gap-1">
              <span className="text-lg sm:text-2xl">🎯</span>
              <span
                className="text-lg sm:text-2xl font-black text-white"
                style={{ animation: show ? 'popIn 0.4s ease 0.3s both' : 'none' }}
              >
                {missionsCompleted}
              </span>
              <span className="text-[8px] sm:text-[10px] font-semibold text-blue-200 uppercase tracking-wide">missões</span>
            </div>

            {/* XP */}
            <div className="bg-white/10 rounded-xl sm:rounded-2xl px-2 py-3 sm:py-4 flex flex-col items-center gap-0.5 sm:gap-1">
              <span className="text-lg sm:text-2xl">⚡</span>
              <span className="text-lg sm:text-2xl font-black" style={{ color: '#facc15' }}>
                +{xpDisplay}
              </span>
              <span className="text-[8px] sm:text-[10px] font-semibold text-blue-200 uppercase tracking-wide">XP</span>
            </div>

            {/* WOA Coin */}
            <div
              className="bg-white/10 rounded-xl sm:rounded-2xl px-2 py-3 sm:py-4 flex flex-col items-center gap-0.5 sm:gap-1"
              style={{
                transform: coinPop ? 'scale(1)' : 'scale(0.6)',
                opacity: coinPop ? 1 : 0,
                transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
              }}
            >
              <Image src="/images/woa_coin.png" alt="WOA Coin" width={24} height={24} className="object-contain sm:w-8 sm:h-8" />
              <span className="text-lg sm:text-2xl font-black text-yellow-300">+1</span>
              <span className="text-[8px] sm:text-[10px] font-semibold text-blue-200 uppercase tracking-wide">WOA Coin</span>
            </div>
          </div>

          {/* Motivational message */}
          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed px-1">
            {checkpoint < 5
              ? 'Você está descendo nas profundezas. Continue mergulhando!'
              : checkpoint < 9
              ? 'Mais da metade. O fundo está próximo — você está dominando!'
              : checkpoint === 10
              ? '🏆 Você conquistou o Atlantic Ocean! Incrível!'
              : 'Quase lá! Um último mergulho e você chega ao fundo!'}
          </p>

          <p className="text-blue-200 text-xs sm:text-sm font-semibold px-1">Deseja continuar ou prefere voltar mais tarde?</p>

          {/* CTA */}
          <button
            onClick={() => { playClick(); onContinue() }}
            className="w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-white text-base sm:text-lg tracking-wide transition-all active:scale-95 hover:opacity-90"
            style={{
              background: 'linear-gradient(90deg, #CC4A00, #e85d00)',
              boxShadow: '0 6px 24px rgba(204,74,0,0.45)',
              animation: show ? 'popIn 0.4s ease 1.2s both' : 'none',
            }}
          >
            Continuar →
          </button>

          {onLater && (
            <button
              onClick={() => { playClick(); onLater() }}
              className="w-full py-2 sm:py-3 rounded-xl sm:rounded-2xl font-bold text-blue-200 text-sm sm:text-base tracking-wide transition-all active:scale-95 hover:bg-white/10"
              style={{
                border: '2px solid rgba(255,255,255,0.2)',
                animation: show ? 'popIn 0.4s ease 1.4s both' : 'none',
              }}
            >
              Mais tarde
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
