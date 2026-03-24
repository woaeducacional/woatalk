'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/src/components/ui/Button'
import Link from 'next/link'
import { playClick } from '@/lib/sounds'
import { EagleTip } from '@/src/components/EagleTip'
import { EnergyBar } from '@/src/components/EnergyBar'

const xpPerLevel = 250

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [atlanticCheckpoint, setAtlanticCheckpoint] = useState(0)
  const [xpTotal, setXpTotal] = useState(0)
  const [coinsBalance, setCoinsBalance] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetch('/api/progress/2')
      .then(r => r.ok ? r.json() : { checkpoint: 0 })
      .then(d => setAtlanticCheckpoint(d.checkpoint ?? 0))
      .catch(() => {})
    fetch('/api/user/stats')
      .then(r => r.ok ? r.json() : { xp_total: 0, coins_balance: 0 })
      .then(d => {
        setXpTotal(d.xp_total ?? 0)
        setCoinsBalance(d.coins_balance ?? 0)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const level = Math.floor(xpTotal / xpPerLevel) + 1
  const xpInLevel = xpTotal % xpPerLevel
  const xpProgress = Math.round((xpInLevel / xpPerLevel) * 100)
  const isAdmin = session?.user?.role === 'admin'

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050E1A' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <p className="text-cyan-300/60 text-sm tracking-widest">CARREGANDO...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen relative" style={{ background: '#050E1A' }}>

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/fundo_do_mar.png"
          alt="Fundo do Mar"
          fill
          className="object-cover object-bottom"
          priority
        />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(5,14,26,0.90) 0%, rgba(5,14,26,0.70) 40%, rgba(5,14,26,0.88) 100%)'
        }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)'
        }} />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">

        {/* ── NAV ── */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-cyan-400/20 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.72)' }}>
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/40" />
              <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/60 object-cover" />
            </div>
            <div>
              <span className="text-base font-black tracking-[0.18em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>
                WOA TALK
              </span>
              <p className="text-[10px] text-cyan-400/50 tracking-widest">SUA JORNADA ÉPICA</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Player XP badge */}
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[10px] text-cyan-400/60 tracking-widest">LVL {level} • {xpInLevel}/{xpPerLevel} XP</span>
              <div className="w-28 h-1.5 rounded-full mt-1 overflow-hidden border border-cyan-500/20" style={{ background: 'rgba(0,212,255,0.08)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${xpProgress}%`, background: 'linear-gradient(90deg,#00D4FF,#00F0C8)' }} />
              </div>
            </div>
            <EnergyBar />
            <button
              onClick={() => { playClick(); setSidebarOpen(true) }}
              className="text-xs font-black tracking-widest px-4 py-2 rounded transition-all hover:scale-105"
              style={{ border: '1px solid rgba(0,212,255,0.35)', color: '#00D4FF', background: 'rgba(0,212,255,0.08)' }}
            >
              EXPLORADOR
            </button>
            <button
              onClick={() => { playClick(); (signOut({ redirect: true }) as any) }}
              className="text-xs font-bold tracking-widest px-4 py-2 rounded border border-red-500/30 text-red-400/70 hover:border-red-400/60 hover:text-red-300 transition-all"
            >
              SAIR
            </button>
          </div>
        </header>

        <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-10 space-y-10">

          {/* ── WELCOME ── */}
          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3 border border-cyan-400/25" style={{ background: 'rgba(0,212,255,0.07)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-300/70 text-[10px] font-bold tracking-[0.18em]">BEM-VINDO DE VOLTA</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white" style={{ textShadow: '0 0 30px rgba(0,212,255,0.25)' }}>
                {session?.user?.name?.split(' ')[0] ?? 'Herói'}, <span style={{ color: '#00D4FF' }}>pronto</span> para mergulhar?
              </h2>
              <p className="text-blue-200/55 text-sm mt-2">Continue sua jornada e desbloqueie novos oceanos.</p>
            </div>
            <Link
              href="/journey"
              onClick={() => playClick()}
              className="shrink-0 px-7 py-3 font-black text-sm tracking-widest rounded-lg text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#003AB0,#0066FF)', border: '2px solid #00D4FF', boxShadow: '0 0 24px rgba(0,102,255,0.4)' }}
            >
              🗺️ MAPA DA JORNADA
            </Link>
          </section>

          {/* ── STATS HUD ── */}
          <section>
            <h3 className="text-xs font-black tracking-[0.2em] text-cyan-400/60 mb-4">— SEU PROGRESSO —</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* XP */}
              <div className="p-5 rounded-2xl backdrop-blur-md hover:scale-105 transition-transform" style={{ background: 'rgba(5,14,26,0.65)', border: '1px solid #00D4FF35', boxShadow: '0 4px 24px rgba(0,212,255,0.08)' }}>
                <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: '#00D4FF' }}>⚡ XP TOTAL</p>
                <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 14px #00D4FF' }}>{xpTotal.toLocaleString('pt-BR')}</p>
                <p className="text-[10px] text-blue-100/80 mt-2">Próx. nível em {Math.max(0, xpPerLevel - xpInLevel)} XP</p>
                <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(0,212,255,0.12)' }}>
                  <div className="h-full rounded-full" style={{ width: `${xpProgress}%`, background: '#00D4FF' }} />
                </div>
              </div>

              {/* Streaks */}
              <div className="p-5 rounded-2xl backdrop-blur-md hover:scale-105 transition-transform" style={{ background: 'rgba(5,14,26,0.65)', border: '1px solid #FF6B3535', boxShadow: '0 4px 24px rgba(255,107,53,0.06)' }}>
                <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: '#FF6B35' }}>🔥 STREAK</p>
                <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 14px #FF6B35' }}>0</p>
                <p className="text-[10px] text-blue-100/80 mt-2">Dias consecutivos</p>
              </div>

              {/* Badges */}
              <div className="p-5 rounded-2xl backdrop-blur-md hover:scale-105 transition-transform" style={{ background: 'rgba(5,14,26,0.65)', border: '1px solid #A855F735', boxShadow: '0 4px 24px rgba(168,85,247,0.06)' }}>
                <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: '#A855F7' }}>🏅 BADGES</p>
                <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 14px #A855F7' }}>0</p>
                <p className="text-[10px] text-blue-100/80 mt-2">Conquistas desbloqueadas</p>
              </div>

              {/* WOA Coins */}
              <div className="p-5 rounded-2xl backdrop-blur-md hover:scale-105 transition-transform flex items-center gap-3" style={{ background: 'rgba(5,14,26,0.65)', border: '1px solid #FFD70035', boxShadow: '0 4px 24px rgba(255,215,0,0.06)' }}>
                <div className="flex-1">
                  <p className="text-[10px] font-black tracking-widest mb-2" style={{ color: '#FFD700' }}>💰 WOA COINS</p>
                  <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 14px #FFD700' }}>{coinsBalance}</p>
                  <p className="text-[10px] text-blue-100/80 mt-2">1 coin por checkpoint</p>
                </div>
                <Image src="/images/woa_coin.png" alt="WOA Coin" width={52} height={52} className="object-contain drop-shadow-lg" />
              </div>
            </div>
          </section>

          {/* ── OCEAN PHASES ── */}
          <section>
            <h3 className="text-xs font-black tracking-[0.2em] text-cyan-400/60 mb-4">— FASES OCEÂNICAS —</h3>
            <div className="grid md:grid-cols-3 gap-5">

              {/* Pacific — LOCKED */}
              <div className="rounded-2xl overflow-hidden backdrop-blur-md opacity-50" style={{ background: 'rgba(5,14,26,0.65)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="h-28 flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)' }}>
                  <Image src="/images/icon_pacifico.png" alt="Pacific Ocean" width={70} height={70} className="object-contain grayscale opacity-60" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl">🔒</span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-black text-white/60 text-sm tracking-wider mb-1">PACIFIC OCEAN</h4>
                  <p className="text-[10px] text-blue-100/80 mb-4">4.280m de profundidade</p>
                  <button disabled className="w-full text-xs font-black tracking-widest py-2.5 rounded-lg text-white/20 cursor-not-allowed" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    BLOQUEADO
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { playClick(); router.push('/admin/journey/1') }}
                      className="w-full mt-2 text-[10px] font-black tracking-widest py-2 rounded-lg transition-all hover:scale-105 active:scale-95 uppercase"
                      style={{ background: 'linear-gradient(135deg, #FFFFFF, #E0E0E0)', color: '#111', border: '2px solid rgba(255,255,255,0.9)', boxShadow: '0 0 12px rgba(255,255,255,0.15)' }}
                    >
                      ✏️ EDITAR JORNADA
                    </button>
                  )}
                </div>
              </div>

              {/* Atlantic — ACTIVE */}
              <div className="rounded-2xl overflow-hidden backdrop-blur-md relative" style={{ background: 'rgba(5,14,26,0.75)', border: '1px solid #00D4FF50', boxShadow: '0 0 30px rgba(0,212,255,0.12), 0 8px 32px rgba(0,0,0,0.4)' }}>
                {/* active glow top line */}
                <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,#00D4FF,transparent)' }} />
                <div className="h-28 flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg,#002060,#0043BB)' }}>
                  <Image src="/images/icon_atlantico.png" alt="Atlantic Ocean" width={70} height={70} className="object-contain" />
                  <div className="absolute top-2 right-2 bg-cyan-400/20 border border-cyan-400/40 rounded px-2 py-0.5">
                    <span className="text-[9px] font-black tracking-widest text-cyan-300">ATIVO</span>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-black text-white text-sm tracking-wider mb-1" style={{ textShadow: '0 0 10px rgba(0,212,255,0.4)' }}>ATLANTIC OCEAN</h4>
                  <p className="text-[10px] text-blue-100/80 mb-3">3.339m de profundidade</p>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black tracking-widest" style={{ color: '#00D4FF' }}>CHECKPOINT {atlanticCheckpoint}/10</span>
                    <span className="text-[10px] text-blue-100/80">🌊 {Math.round(3339 * (1 - atlanticCheckpoint / 10))}m</span>
                  </div>

                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="flex-1 h-2 rounded-sm overflow-hidden" style={{ background: 'rgba(0,212,255,0.12)' }}>
                        <div className="h-full transition-all duration-500 rounded-sm" style={{ width: i < atlanticCheckpoint ? '100%' : '0%', background: 'linear-gradient(90deg,#00D4FF,#00F0C8)' }} />
                      </div>
                    ))}
                  </div>

                  <Link href="/challenge/2" onClick={() => playClick()} className="block text-center text-xs font-black tracking-widest py-2.5 rounded-lg text-white transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg,#CC4A00,#FF6B35)', boxShadow: '0 0 16px rgba(255,107,53,0.3)' }}>
                    ▶ CONTINUAR MISSÃO
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ── METHOD WOA ── */}
          <section>
            <h3 className="text-xs font-black tracking-[0.2em] text-cyan-400/60 mb-4">— MÉTODO WOA —</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: '📚', title: 'DISCOVER', desc: 'Explore conceitos e ouça exemplos reais para criar curiosidade e compreensão inicial.', color: '#00D4FF' },
                { icon: '⚡', title: 'PRACTICE', desc: 'Pratique através de exercícios: arrastar, completar, escutar e falar.', color: '#00F0C8' },
                { icon: '👑', title: 'COMMAND', desc: 'Domine com desafios avançados e aplique em contextos reais.', color: '#FFD700' },
              ].map((m, i) => (
                <div key={i} className="p-5 rounded-2xl backdrop-blur-md hover:scale-[1.02] transition-transform relative" style={{ background: 'rgba(5,14,26,0.65)', border: `1px solid ${m.color}30` }}>
                  <div className="text-3xl mb-3">{m.icon}</div>
                  <h4 className="font-black text-sm tracking-widest mb-2" style={{ color: m.color }}>{m.title}</h4>
                  <p className="text-blue-100/80 text-xs leading-relaxed">{m.desc}</p>
                  <div className="absolute bottom-0 left-6 right-6 h-px" style={{ background: `linear-gradient(90deg,transparent,${m.color}70,transparent)` }} />
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg,rgba(0,58,176,0.6),rgba(0,102,255,0.4))', border: '1px solid #00D4FF35', boxShadow: '0 0 40px rgba(0,102,255,0.15)' }}>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)' }} />
            <div className="relative px-8 py-10 text-center">
              <h3 className="text-2xl font-black text-white mb-3" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
                🌊 AVENTURA TE ESPERA
              </h3>
              <p className="text-blue-100/80 text-sm mb-6">Desbloqueie novos oceanos e conquiste novos desafios épicos</p>
              <Link
                href="/journey"
                onClick={() => playClick()}
                className="inline-block px-8 py-3 font-black text-sm tracking-widest rounded-lg text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#003AB0,#0066FF)', border: '2px solid #00D4FF', boxShadow: '0 0 24px rgba(0,102,255,0.45)' }}
              >
                IR AO MAPA DA JORNADA →
              </Link>
            </div>
          </section>

        </div>

        {/* ── FOOTER ── */}
        <footer className="py-5 text-center border-t border-cyan-400/10">
          <p className="text-[11px] text-blue-200/30 tracking-[0.2em]">WOA TALK © 2026 — SUA JORNADA ÉPICA NO INGLÊS</p>
        </footer>
      </div>
      {/* ── SIDEBAR EXPLORADOR ── */}
      {/* Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full z-50 flex flex-col"
        style={{
          width: '300px',
          background: 'rgba(5,14,26,0.97)',
          borderLeft: '1px solid rgba(0,212,255,0.2)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.6)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Close */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-[10px] font-black tracking-[0.25em]" style={{ color: 'rgba(255,255,255,0.4)' }}>EXPLORADOR</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full text-white/40 hover:text-white/80 transition-colors"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            ✕
          </button>
        </div>

        {/* Avatar placeholder */}
        <div className="flex flex-col items-center pt-8 pb-6 px-6">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(0,67,187,0.5), rgba(0,212,255,0.2))',
              border: '2px solid rgba(0,212,255,0.35)',
              boxShadow: '0 0 24px rgba(0,212,255,0.2)',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" fill="rgba(0,212,255,0.6)" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(0,212,255,0.6)" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>

          {/* Name */}
          <p className="text-base font-black text-white tracking-wide text-center">
            {session?.user?.name ?? 'Herói'}
          </p>
          <p className="text-[10px] mt-1 tracking-widest" style={{ color: 'rgba(0,212,255,0.55)' }}>
            {session?.user?.email ?? ''}
          </p>
        </div>

        <div className="flex-1 px-6 space-y-6 overflow-y-auto">
          {/* Level + XP bar */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>NÍVEL</span>
              <span className="text-2xl font-black" style={{ color: '#00D4FF', textShadow: '0 0 12px rgba(0,212,255,0.6)' }}>
                {level}
              </span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: '#00D4FF' }}>{xpInLevel} XP</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{xpPerLevel} XP</span>
            </div>
            <div
              className="w-full h-3 rounded-full overflow-hidden"
              style={{ background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.18)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${xpProgress}%`,
                  background: 'linear-gradient(90deg,#0043BB,#00D4FF,#00F0C8)',
                  boxShadow: '0 0 8px rgba(0,212,255,0.5)',
                }}
              />
            </div>
            <p className="text-[10px] mt-2 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {Math.max(0, xpPerLevel - xpInLevel)} XP para o próximo nível
            </p>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-black" style={{ color: '#00D4FF' }}>{xpTotal.toLocaleString('pt-BR')}</span>
                <span className="text-[9px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>XP TOTAL</span>
              </div>
              <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-sm font-black" style={{ color: '#FFA940' }}>{coinsBalance}</span>
                <span className="text-[9px] tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>MOEDAS</span>
              </div>
            </div>
          </div>

          {/* History rewards button */}
          <Link
            href="/history"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-between w-full rounded-xl px-4 py-3.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'rgba(192,132,252,0.1)',
              border: '1px solid rgba(192,132,252,0.25)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-sm font-black tracking-wider text-white">HISTORY REWARDS</p>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>XP, moedas e badges ganhos</p>
              </div>
            </div>
            <span style={{ color: 'rgba(192,132,252,0.7)', fontSize: '18px' }}>›</span>
          </Link>
        </div>

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
      <EagleTip
        storageKey="eagle_dashboard_welcome"
        lines={[
          '🦅 Bem-vindo ao fundo do mar, explorador!',
          'Você mergulhou fundo e agora precisa subir à superfície.',
          'Siga sua Jornada e resolva as missões para ganhar XP e voltar ao topo!',
        ]}
        buttonLabel="VAMOS COMEÇAR"
      />
    </main>
  )
}
