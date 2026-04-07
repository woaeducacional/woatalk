'use client'

import { useState } from 'react'

export type StreakUpdateStatus =
  | 'increased'
  | 'pending_recovery'
  | 'broken'
  | 'expired_recovery'

interface StreakModalProps {
  status: StreakUpdateStatus
  streak: number
  recoveryCost?: number
  onClose: () => void
}

export function StreakModal({ status, streak, recoveryCost = 4, onClose }: StreakModalProps) {
  const [recovering, setRecovering] = useState(false)
  const [recovered, setRecovered] = useState(false)
  const [notEnoughCoins, setNotEnoughCoins] = useState(false)

  const handleRecover = async () => {
    setRecovering(true)
    try {
      const res = await fetch('/api/user/streak-recover', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        setRecovered(true)
      } else if (data.error === 'Not enough WOA Coins') {
        setNotEnoughCoins(true)
      }
    } catch {
      // silently fail
    } finally {
      setRecovering(false)
    }
  }

  const renderContent = () => {
    if (recovered) {
      return (
        <>
          <div className="text-5xl mb-3">🔥</div>
          <h2 className="text-2xl font-black text-white mb-1">Ofensiva Recuperada!</h2>
          <p className="text-blue-200/70 text-sm mb-1">Você pagou {recoveryCost} 🪙 e manteve sua sequência!</p>
          <p className="text-4xl font-black mt-4" style={{ color: '#FF6B35', textShadow: '0 0 20px #FF6B3580' }}>
            {streak + 1} dias
          </p>
          <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #FF6B35, #d95d24)' }}>
            Continuar 🔥
          </button>
        </>
      )
    }

    if (status === 'increased') {
      return (
        <>
          <div className="text-5xl mb-3 animate-bounce">🔥</div>
          <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: '#FF6B35' }}>OFENSIVA</p>
          <h2 className="text-2xl font-black text-white mb-2">Ofensiva Aumentada!</h2>
          <p className="text-blue-200/60 text-sm mb-4">Continue assim! Você está em sequência.</p>
          <p className="text-5xl font-black mt-2" style={{ color: '#FF6B35', textShadow: '0 0 24px #FF6B3580' }}>
            {streak} 🔥
          </p>
          <p className="text-white/50 text-xs mt-1">dias consecutivos</p>
          <button onClick={onClose} className="mt-6 w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #FF6B35, #d95d24)' }}>
            Incrível! 🔥
          </button>
        </>
      )
    }

    if (status === 'pending_recovery') {
      return (
        <>
          <div className="text-5xl mb-3">😬</div>
          <p className="text-[10px] font-black tracking-widest mb-1 text-yellow-400">OFENSIVA EM RISCO</p>
          <h2 className="text-2xl font-black text-white mb-2">Você perdeu um dia!</h2>
          <p className="text-blue-200/70 text-sm mb-2">
            Sua sequência estava em <span className="text-orange-400 font-bold">{streak} dias</span>.
          </p>
          <p className="text-blue-200/70 text-sm mb-6">
            Pague <span className="text-yellow-400 font-bold">{recoveryCost} 🪙 WOA Coins</span> para reativar sua ofensiva.
          </p>
          {notEnoughCoins && (
            <p className="text-red-400 text-xs mb-3">❌ WOA Coins insuficientes.</p>
          )}
          <button
            onClick={handleRecover}
            disabled={recovering}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105 mb-3"
            style={{ background: recovering ? '#555' : 'linear-gradient(135deg, #FFD700, #d4a800)' }}
          >
            {recovering ? 'Recuperando...' : `🪙 Recuperar por ${recoveryCost} Coins`}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-white/60 transition-all hover:text-white border border-white/10 hover:border-white/30"
          >
            Perder ofensiva
          </button>
        </>
      )
    }

    // broken or expired_recovery
    return (
      <>
        <div className="text-5xl mb-3">💔</div>
        <p className="text-[10px] font-black tracking-widest mb-1 text-red-400">OFENSIVA PERDIDA</p>
        <h2 className="text-2xl font-black text-white mb-2">
          {status === 'expired_recovery' ? 'Tempo esgotado!' : 'Ofensiva Perdida!'}
        </h2>
        <p className="text-blue-200/70 text-sm mb-6">
          {status === 'expired_recovery'
            ? 'O prazo para recuperação passou. Mas você voltou — isso conta!'
            : 'Não tem problema! Uma nova sequência começa agora.'}
        </p>
        <p className="text-4xl font-black mt-2" style={{ color: '#FF6B35', textShadow: '0 0 20px #FF6B3580' }}>
          1 🔥
        </p>
        <p className="text-white/50 text-xs mt-1 mb-6">nova sequência</p>
        <button onClick={onClose} className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #FF6B35, #d95d24)' }}>
          Recomeçar! 💪
        </button>
      </>
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-8 text-center relative"
        style={{
          background: 'linear-gradient(135deg, rgba(5,14,26,0.98), rgba(20,30,50,0.98))',
          border: '1px solid rgba(255,107,53,0.35)',
          boxShadow: '0 0 60px rgba(255,107,53,0.15)',
          animation: 'streakModalIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {renderContent()}
      </div>
      <style>{`
        @keyframes streakModalIn {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
