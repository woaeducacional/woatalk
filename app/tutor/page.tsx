'use client'

/**
 * /tutor — Tutor de Pronúncia
 * Ao abrir: inicia automaticamente uma sessão de prática com 1-3 palavras aleatórias.
 * Após a sessão: exibe o histórico completo de erros com dicas da IA.
 */
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { PracticeSession } from '@/src/components/tutor/PracticeSession'
import { ErrorWordCard } from '@/src/components/tutor/ErrorWordCard'
import type { PronunciationError } from '@/src/services/pronunciation.service'

// ── Subcomponente: estado vazio ────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-5 text-center">
      <div
        className="w-24 h-24 relative"
        style={{ animation: 'owlBob 3s ease-in-out infinite', filter: 'drop-shadow(0 0 16px rgba(168,85,247,0.5))' }}
      >
        <Image src="/images/aguia-corretora.png" alt="Coruja" fill className="object-contain" />
      </div>
      <div className="space-y-2">
        <p className="text-xl font-black text-white">Sem erros registrados ainda!</p>
        <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Pratique o Listen &amp; Repeat e a coruja começará a registrar as palavras que precisam de atenção.
        </p>
      </div>
    </div>
  )
}

// ── Subcomponente: skeleton de loading ─────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl p-5 animate-pulse"
          style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)', height: '160px' }}
        />
      ))}
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────

export default function TutorPage() {
  const { status } = useSession()
  const router = useRouter()

  const [errors, setErrors]       = useState<PronunciationError[]>([])
  const [isLoading, setIsLoading] = useState(true)
  /** Controla se mostra sessão de prática (false) ou histórico (true) */
  const [showHistory, setShowHistory] = useState(false)
  /** Incrementar para reiniciar PracticeSession sem navegar */
  const [sessionKey, setSessionKey] = useState(0)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status !== 'authenticated') return
    fetch('/api/pronunciation/errors')
      .then(r => r.json())
      .then(data => setErrors(data.errors ?? []))
      .catch(() => setErrors([]))
      .finally(() => setIsLoading(false))
  }, [status])

  /** Chamado pelo PracticeSession ao terminar uma sessão */
  const handleSessionEnd = () => setShowHistory(true)

  /** Inicia nova sessão */
  const handleRestart = () => {
    setShowHistory(false)
    setSessionKey(k => k + 1)
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(to bottom, #0a0018 0%, #12002a 50%, #0a0018 100%)' }}
    >
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(circle, #a855f7 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-10 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-xs font-black tracking-widest px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
            style={{ border: '1px solid rgba(168,85,247,0.35)', color: '#a855f7', background: 'rgba(168,85,247,0.08)' }}
          >
            ← VOLTAR
          </button>

          {/* Toggle praticar / histórico (só aparece quando há dados) */}
          {!isLoading && errors.length > 0 && (
            <button
              onClick={() => showHistory ? handleRestart() : setShowHistory(true)}
              className="text-xs font-black tracking-widest px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.04)' }}
            >
              {showHistory ? '🎤 PRATICAR' : '📋 HISTÓRICO'}
            </button>
          )}
        </div>

        {/* ── Título mini ── */}
        {!isLoading && errors.length > 0 && (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 relative flex-shrink-0"
              style={{ animation: 'owlBob 3s ease-in-out infinite', filter: 'drop-shadow(0 0 10px rgba(168,85,247,0.6))' }}
            >
              <Image src="/images/aguia-corretora.png" alt="Coruja" fill className="object-contain" />
            </div>
            <div>
              <p className="text-[10px] font-black tracking-[0.25em] uppercase" style={{ color: '#a855f7' }}>
                Tutor de Pronúncia
              </p>
              <p className="text-lg font-black text-white">
                {showHistory ? 'Seu histórico de erros' : 'Sessão de prática'}
              </p>
            </div>
          </div>
        )}

        {/* ── Conteúdo principal ── */}
        {isLoading ? (
          <div className="rounded-2xl animate-pulse" style={{ background: 'rgba(168,85,247,0.06)', border: '1px solid rgba(168,85,247,0.12)', height: '580px' }} />
        ) : errors.length === 0 ? (
          <EmptyState />
        ) : showHistory ? (
          /* ── Histórico de erros ── */
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              {errors.map(err => (
                <ErrorWordCard
                  key={err.id}
                  word={err.word}
                  errorCount={err.error_count}
                  sentence={err.sentence}
                  aiTip={err.ai_tip}
                />
              ))}
            </div>
            <button
              onClick={handleRestart}
              className="w-full py-3 rounded-xl font-black text-sm tracking-widest transition-all hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff' }}
            >
              🎤 NOVA SESSÃO DE PRÁTICA
            </button>
          </div>
        ) : (
          /* ── Sessão de prática ── */
          <PracticeSession
            key={sessionKey}
            errors={errors}
            onEnd={handleSessionEnd}
          />
        )}
      </div>

      <style>{`
        @keyframes owlBob {
          0%, 100% { transform: translateY(0px) rotate(-4deg); }
          50%       { transform: translateY(-8px) rotate(4deg); }
        }
      `}</style>
    </div>
  )
}
