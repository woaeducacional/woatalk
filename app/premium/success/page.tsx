'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { playClick } from '@/lib/sounds'

export default function PremiumSuccessPage() {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.push('/dashboard'), 5000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(to bottom, #050E1A 0%, #0a1929 50%, #050E1A 100%)' }}
    >
      <div className="text-center space-y-6 px-6 max-w-lg">
        <div className="text-8xl">🎉</div>
        <h1
          className="text-4xl font-black text-white"
          style={{ textShadow: '0 0 20px rgba(255,154,0,0.6)' }}
        >
          BEM-VINDO AO PREMIUM!
        </h1>
        <p className="text-blue-200/70 text-lg">
          Sua assinatura foi ativada com sucesso. Acesse todas as jornadas desbloqueadas agora!
        </p>
        <button
          onClick={() => { playClick(); router.push('/dashboard') }}
          className="px-8 py-3 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #B05000, #FF6B00)', color: 'white' }}
        >
          IR PARA O DASHBOARD
        </button>
        <p className="text-blue-200/40 text-xs">Redirecionando automaticamente em 5 segundos...</p>
      </div>
    </div>
  )
}
