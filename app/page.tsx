'use client'

import Link from 'next/link'
import Image from 'next/image'
import { playBubble } from '@/lib/sounds'

const skills = [
  { icon: '🎮', title: 'Gamificado', desc: 'XP, Streaks, Badges e WOA Coins', color: '#00D4FF' },
  { icon: '🌊', title: 'Método WOA', desc: 'Descubra, pratique e domine', color: '#00F0C8' },
  { icon: '🏆', title: 'Missões', desc: '100+ desafios épicos', color: '#FFD700' },
  { icon: '🌍', title: 'Comunidade', desc: 'Heróis ao redor do mundo', color: '#FF6B35' },
]

const stats = [
  { value: '20', label: 'FASES', color: '#00D4FF' },
  { value: '100+', label: 'DESAFIOS', color: '#00F0C8' },
  { value: 'FREE', label: 'PARA TODOS', color: '#FFD700' },
  { value: '24/7', label: 'ACESSO', color: '#FF6B35' },
]

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-x-hidden" style={{ background: '#050E1A' }}>

      {/* ── Background ── */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/fundo_do_mar.png"
          alt="Fundo do Mar"
          fill
          className="object-cover object-bottom"
          priority
        />
        {/* gradient overlay — top darker so text is legible, bottom fades to dark */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(5,14,26,0.82) 0%, rgba(5,14,26,0.55) 40%, rgba(5,14,26,0.75) 80%, rgba(5,14,26,0.95) 100%)'
        }} />
        {/* subtle scanline texture for that game feel */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)'
        }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* NAV */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-cyan-400/20 backdrop-blur-md bg-[#050E1A]/50">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11">
              <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/50" />
              <Image
                src="/images/logo.png"
                alt="WOA Talk"
                fill
                className="relative rounded-full border-2 border-cyan-400/70 object-cover"
              />
            </div>
            <span className="text-lg font-black tracking-[0.2em] text-white"
              style={{ textShadow: '0 0 12px rgba(0,212,255,0.6)' }}>
              WOA TALK
            </span>
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              onClick={() => playBubble()}
              className="text-cyan-300 text-sm font-semibold tracking-widest px-4 py-2 rounded border border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all"
            >
              ENTRAR
            </Link>
            <Link
              href="/auth/signup"
              onClick={() => playBubble()}
              className="text-sm font-black tracking-widest px-5 py-2 rounded border-2 transition-all"
              style={{
                borderColor: '#FFD700',
                color: '#FFD700',
                textShadow: '0 0 10px #FFD700',
                boxShadow: '0 0 16px rgba(255,215,0,0.2)',
              }}
            >
              ▶ JOGAR
            </Link>
          </nav>
        </header>

        {/* HERO */}
        <section className="flex-1 flex flex-col items-center text-center px-4 pt-16 pb-10">

          {/* badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-cyan-400/30 backdrop-blur-sm"
            style={{ background: 'rgba(0,212,255,0.08)' }}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-300 text-xs font-bold tracking-[0.18em]">AVENTURA EM INGLÊS</span>
          </div>

          {/* title */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight mb-5 text-white"
            style={{ textShadow: '0 0 40px rgba(0,212,255,0.35)' }}>
            SUA JORNADA<br />
            <span style={{ color: '#00D4FF', textShadow: '0 0 30px #00D4FF, 0 0 60px rgba(0,212,255,0.4)' }}>
              ÉPICA
            </span>
            {' '}NO INGLÊS
          </h1>

          <p className="text-base md:text-lg text-blue-200/75 max-w-lg mb-10 leading-relaxed">
            Mergulhe nas profundezas do oceano e conquiste o inglês
            através de missões, batalhas e recompensas épicas.
          </p>

          {/* XP bar */}
          <div className="w-full max-w-xs mb-10">
            <div className="flex justify-between text-[11px] font-semibold tracking-widest text-cyan-400/60 mb-1.5">
              <span>LVL 1 · MERGULHADOR</span>
              <span>0 / 100 XP</span>
            </div>
            <div className="h-2.5 rounded-full border border-cyan-500/30 overflow-hidden"
              style={{ background: 'rgba(0,212,255,0.08)' }}>
              <div className="h-full w-px rounded-full"
                style={{ background: 'linear-gradient(90deg, #00D4FF, #00F0C8)' }} />
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/auth/signup"
              onClick={() => playBubble()}
              className="px-10 py-4 font-black text-lg tracking-widest rounded-lg text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #003AB0 0%, #0066FF 100%)',
                border: '2px solid #00D4FF',
                boxShadow: '0 0 30px rgba(0,102,255,0.45), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              ⚔️ INICIAR MISSÃO
            </Link>
            <Link
              href="/auth/signin"
              onClick={() => playBubble()}
              className="px-10 py-4 font-bold text-lg tracking-widest rounded-lg text-cyan-300 transition-all hover:bg-cyan-500/10 hover:scale-105"
              style={{ border: '2px solid rgba(0,212,255,0.35)' }}
            >
              JÁ TENHO CONTA
            </Link>
          </div>

          {/* Skill cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl w-full">
            {skills.map((skill, i) => (
              <div
                key={i}
                className="relative p-5 rounded-2xl backdrop-blur-md hover:scale-105 transition-transform cursor-default"
                style={{
                  background: 'rgba(5,14,26,0.65)',
                  border: `1px solid ${skill.color}35`,
                  boxShadow: `0 4px 24px ${skill.color}12`,
                }}
              >
                <div className="text-3xl mb-3">{skill.icon}</div>
                <h3 className="font-black text-sm mb-1 tracking-wide" style={{ color: skill.color }}>
                  {skill.title}
                </h3>
                <p className="text-blue-200/55 text-xs leading-relaxed">{skill.desc}</p>
                {/* bottom glow line */}
                <div className="absolute bottom-0 left-6 right-6 h-px rounded-full"
                  style={{ background: `linear-gradient(90deg, transparent, ${skill.color}80, transparent)` }} />
              </div>
            ))}
          </div>
        </section>

        {/* STATS HUD */}
        <section className="border-t border-cyan-400/15 backdrop-blur-md py-6"
          style={{ background: 'rgba(5,14,26,0.80)' }}>
          <div className="max-w-3xl mx-auto px-4 grid grid-cols-4 gap-4 text-center">
            {stats.map((s, i) => (
              <div key={i}>
                <p className="text-2xl md:text-3xl font-black"
                  style={{ color: s.color, textShadow: `0 0 14px ${s.color}` }}>
                  {s.value}
                </p>
                <p className="text-[10px] md:text-xs text-blue-200/50 tracking-[0.15em] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-5 text-center border-t border-cyan-400/10">
          <p className="text-[11px] text-blue-200/35 tracking-[0.2em]">
            WOA TALK © 2026 — SUA JORNADA ÉPICA NO INGLÊS
          </p>
        </footer>
      </div>
    </main>
  )
}