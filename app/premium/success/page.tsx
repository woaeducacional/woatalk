'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { playClick } from '@/lib/sounds'

type Status = 'checking' | 'confirmed' | 'pending'

const POLL_INTERVAL = 3000
const POLL_MAX = 12

export default function PremiumSuccessPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('checking')
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function check() {
      try {
        const res = await fetch('/api/user/subscription')
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        if (cancelled) return

        if (data.isPremium) {
          setStatus('confirmed')
          timer = setTimeout(() => { if (!cancelled) router.push('/dashboard') }, 2500)
          return
        }
      } catch {
        // ignore and keep polling
      }

      if (cancelled) return
      const next = attempts + 1
      setAttempts(next)

      if (next >= POLL_MAX) {
        setStatus('pending')
        return
      }

      timer = setTimeout(check, POLL_INTERVAL)
    }

    check()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(to bottom, #050E1A 0%, #0a1929 50%, #050E1A 100%)' }}
    >
      <div className="text-center space-y-6 px-6 max-w-lg">

        {status === 'checking' && (
          <>
            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-cyan-400/30 border-t-cyan-400 animate-spin" />
            </div>
            <h1 className="text-3xl font-black text-white" style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>
              VERIFICANDO PAGAMENTO...
            </h1>
            <p className="text-blue-200/60 text-base">
              Aguardando confirmação do Asaas. Isso pode levar alguns instantes.
            </p>
            <p className="text-blue-200/40 text-xs">
              Tentativa {Math.min(attempts + 1, POLL_MAX)} de {POLL_MAX}
            </p>
          </>
        )}

        {status === 'confirmed' && (
          <>
            <div className="text-8xl animate-bounce">🎉</div>
            <h1
              className="text-4xl font-black"
              style={{ color: '#00D4FF', textShadow: '0 0 24px rgba(0,212,255,0.7)' }}
            >
              ACESSO ATIVADO!
            </h1>
            <p className="text-blue-200/80 text-lg font-bold">
              Bem-vindo ao WOA Talk Premium! 👑
            </p>
            <p className="text-blue-200/50 text-sm">
              Redirecionando para o dashboard...
            </p>
            <button
              onClick={() => { playClick(); router.push('/dashboard') }}
              className="px-8 py-3 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #0043BB, #00D4FF)', color: 'white' }}
            >
              IR PARA O DASHBOARD
            </button>
          </>
        )}

        {status === 'pending' && (
          <>
            <div className="text-8xl">⏳</div>
            <h1 className="text-3xl font-black text-white" style={{ textShadow: '0 0 20px rgba(255,154,0,0.5)' }}>
              PAGAMENTO EM PROCESSAMENTO
            </h1>
            <p className="text-blue-200/70 text-base">
              Seu pagamento está sendo processado. Assim que confirmado, seu acesso será ativado automaticamente.
            </p>
            <p className="text-blue-200/50 text-sm">
              Se escolheu Pix ou Boleto, pode levar alguns minutos.
            </p>
            <button
              onClick={() => { playClick(); router.push('/dashboard') }}
              className="px-8 py-3 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #B05000, #FF6B00)', color: 'white' }}
            >
              IR PARA O DASHBOARD
            </button>
            <p className="text-blue-200/40 text-xs">
              Você pode verificar seu status em Configurações → Assinatura.
            </p>
          </>
        )}

      </div>
    </div>
  )
}
