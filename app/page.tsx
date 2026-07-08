'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { playBubble } from '@/lib/sounds'

const badges = [
  { icon: '👥', value: '10.000+', label: 'Estudantes' },
  { icon: '', imgSrc: '/images/foto-oliver.png', value: 'Mr. Oliver', label: 'Criado por' },
  { icon: '🏆', value: '18+ Anos', label: 'de Experiência' },
  { icon: '🌍', value: '6 Idiomas', label: 'Fluente' },
]

const phases = [
  {
    number: 'FASE 1',
    name: 'OCEANOS',
    level: 'Iniciante (A1 → A2)',
    levelColor: '#00D4FF',
    nameColor: '#00D4FF',
    bg: '/images/plano-de-fundo-mar.png',
    description: 'Do Zero à Comunicação Básica. Aprenda as palavras, expressões e diálogos essenciais para sobreviver em inglês.',
  },
  {
    number: 'FASE 2',
    name: 'TERRA',
    level: 'Intermediário (B1 → B2)',
    levelColor: '#FFD700',
    nameColor: '#FFD700',
    bg: '/images/plano-de-fundo-terra.png',
    description: 'Da Comunicação à Confiança. Viaje, trabalhe, socialize e compreenda conteúdos reais.',
  },
  {
    number: 'FASE 3',
    name: 'GALÁXIAS',
    level: 'Avançado (C1 → C2)',
    levelColor: '#A855F7',
    nameColor: '#A855F7',
    bg: '/images/plano-de-fundo-espaço.png',
    description: 'Da Confiança à Fluência. Domine debates, negócios, apresentações e conversas complexas.',
  },
]

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <main className="overflow-x-hidden" style={{ background: '#050E1A' }}>

      {/* ── NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 py-3 border-b border-white/10 backdrop-blur-md bg-[#050E1A]/70">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 shrink-0">
            <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/50" />
            <Image
              src="/images/logo.png"
              alt="WOA Talk"
              fill
              className="relative rounded-full border-2 border-cyan-400/70 object-cover"
            />
          </div>
          <span className="text-sm sm:text-base font-black tracking-[0.2em] text-white"
            style={{ textShadow: '0 0 12px rgba(0,212,255,0.6)' }}>
            WOA TALK
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-blue-200/70 text-xs font-semibold tracking-widest hover:text-white transition-colors">RECURSOS</Link>
          <Link href="/community" className="text-blue-200/70 text-xs font-semibold tracking-widest hover:text-white transition-colors">COMUNIDADE</Link>
          <Link href="/premium" className="text-blue-200/70 text-xs font-semibold tracking-widest hover:text-white transition-colors">PLANOS</Link>
          <div className="w-px h-4 bg-white/20" />
          <Link href="/auth/signin" onClick={() => playBubble()} className="text-cyan-300 text-xs font-semibold tracking-widest hover:text-white transition-colors">ENTRAR</Link>
          <Link
            href="/auth/signup"
            onClick={() => playBubble()}
            className="px-5 py-2 rounded-lg font-black text-xs tracking-widest text-white transition-all hover:scale-105 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #FF6B00, #FF9A00)', boxShadow: '0 4px 20px rgba(255,107,0,0.45)' }}
          >
            COMEÇAR AGORA
          </Link>
        </nav>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/auth/signin" onClick={() => playBubble()} className="text-cyan-300 text-xs font-semibold px-3 py-1.5 rounded border border-cyan-500/30 hover:bg-cyan-500/10 transition-all">ENTRAR</Link>
          <Link href="/auth/signup" onClick={() => playBubble()} className="text-xs font-black px-3 py-1.5 rounded text-white" style={{ background: 'linear-gradient(135deg, #FF6B00, #FF9A00)' }}>COMEÇAR</Link>
          {/* Hamburger */}
          <button
            onClick={() => setMenuOpen(o => !o)}
            className="flex flex-col justify-center items-center w-8 h-8 gap-1.5 rounded transition-all"
            aria-label="Menu"
          >
            <span className={`block w-5 h-0.5 bg-white/80 transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white/80 transition-all duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-white/80 transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div
          className="fixed top-[52px] left-0 right-0 z-40 md:hidden flex flex-col py-3 border-b border-white/10 backdrop-blur-md"
          style={{ background: 'rgba(5,14,26,0.97)' }}
        >
          {[
            { label: 'RECURSOS', href: '/dashboard' },
            { label: 'COMUNIDADE', href: '/community' },
            { label: 'PLANOS', href: '/premium' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => { playBubble(); setMenuOpen(false) }}
              className="px-6 py-3.5 text-xs font-black tracking-widest text-blue-200/70 hover:text-white hover:bg-white/5 transition-all border-b border-white/5 last:border-0"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 pt-20 pb-20">
        <div className="absolute inset-0 z-0">
          <Image src="/images/plano-de-fundo-mar.png" alt="Oceano" fill className="object-cover object-center" priority />
          {/* general dim */}
          <div className="absolute inset-0" style={{ background: 'rgba(5,14,26,0.30)' }} />
          {/* top fade */}
          <div className="absolute top-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to bottom, #050E1A, transparent)' }} />
          {/* bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: 'linear-gradient(to top, #050E1A, transparent)' }} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-4 text-white drop-shadow-2xl">
            SUA JORNADA<br />
            <span style={{ color: '#00D4FF', textShadow: '0 0 40px #00D4FF, 0 0 80px rgba(0,212,255,0.5)' }}>ÉPICA</span>
            {' '}NO INGLÊS
          </h1>

          <p className="text-base md:text-lg text-blue-100/85 mb-6 drop-shadow-lg">
            Comece nas profundezas e evolua até a fluência.
          </p>

          {/* Badges */}
          <div className="flex flex-wrap md:flex-nowrap justify-center gap-3 sm:gap-4 mb-8">
            {badges.map((b, i) => (
              <div key={i} className="flex items-center gap-3 px-7 py-3 rounded-xl backdrop-blur-md border border-white/15 whitespace-nowrap shrink-0"
                style={{ background: 'rgba(5,14,26,0.70)' }}>
                {(b as any).imgSrc ? (
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shrink-0 border-2 border-cyan-400/40">
                    <Image src={(b as any).imgSrc} alt={b.value} width={40} height={40} className="object-cover w-full h-full" />
                  </div>
                ) : (
                  <span className="text-2xl sm:text-3xl">{b.icon}</span>
                )}
                <div className="text-left">
                  <p className="text-white font-black text-sm sm:text-base leading-tight">{b.value}</p>
                  <p className="text-blue-200/55 text-sm leading-tight">{b.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tagline */}
          <p className="text-lg sm:text-xl md:text-2xl font-black text-white mb-2 drop-shadow-lg">
            Você não aprende inglês estudando.<br />Você aprende inglês falando.
          </p>
          <p className="text-sm text-blue-200/70 mb-8 drop-shadow">
            Por isso o Método WOA coloca você para conversar desde o primeiro dia.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center gap-3">
            <Link
              href="/auth/signup"
              onClick={() => playBubble()}
              className="w-full max-w-sm px-8 py-4 font-black text-sm sm:text-base tracking-widest rounded-lg text-white transition-all hover:scale-105 active:scale-95 text-center"
              style={{
                background: 'linear-gradient(135deg, #FF6B00, #FF9A00)',
                boxShadow: '0 6px 30px rgba(255,107,0,0.55)',
              }}
            >
              🔑 COMEÇAR MINHA JORNADA
            </Link>
            <a
              href="#fases"
              className="w-full max-w-sm px-8 py-4 font-bold text-sm sm:text-base tracking-widest rounded-lg text-white transition-all hover:bg-white/10 backdrop-blur-sm text-center"
              style={{ border: '2px solid rgba(255,255,255,0.35)' }}
            >
              ▶ VER COMO FUNCIONA
            </a>
          </div>
        </div>

      </section>

      {/* ── FASES ── */}
      <div id="fases">
        {phases.map((phase, i) => (
          <section key={i} className="relative min-h-[52vh] sm:min-h-[65vh] flex items-center">
              <div className="absolute inset-0 z-0">
                <Image src={phase.bg} alt={phase.name} fill className="object-cover object-center" />
                {/* right-side dim for text legibility */}
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(to right, rgba(5,14,26,0.80) 0%, rgba(5,14,26,0.45) 55%, rgba(5,14,26,0.05) 100%)'
                }} />
                {/* top fade from previous section */}
                <div className="absolute top-0 left-0 right-0 h-48" style={{ background: 'linear-gradient(to bottom, #050E1A, transparent)' }} />
                {/* bottom fade into next section */}
                <div className="absolute bottom-0 left-0 right-0 h-48" style={{ background: 'linear-gradient(to top, #050E1A, transparent)' }} />
              </div>

              <div className="relative z-10 px-5 sm:px-16 md:px-36 py-14 sm:py-20 md:py-24 max-w-2xl">
                <span className="inline-block text-sm sm:text-base md:text-xl font-black tracking-[0.2em] px-3 py-1 sm:px-4 sm:py-1.5 rounded mb-4"
                  style={{ background: phase.nameColor, color: '#050E1A' }}>
                  {phase.number}
                </span>
                <h2 className="text-5xl sm:text-7xl md:text-9xl font-black mb-3"
                  style={{ color: phase.nameColor, textShadow: `0 0 60px ${phase.nameColor}80` }}>
                  {phase.name}
                </h2>
                <p className="text-base sm:text-xl md:text-2xl font-bold tracking-wide mb-4"
                  style={{ color: phase.levelColor }}>
                  {phase.level}
                </p>
                <p className="text-blue-100/85 text-sm sm:text-lg md:text-2xl leading-relaxed">
                  {phase.description}
                </p>
              </div>
            </section>
        ))}
      </div>

      {/* ── TESTIMONIALS ── */}
      <section style={{ background: '#050E1A' }} className="px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center text-3xl sm:text-4xl font-black text-white mb-12" style={{ textShadow: '0 0 30px rgba(0,212,255,0.2)' }}>
            O que dizem os nossos <span style={{ color: '#00D4FF' }}>exploradores</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                name: 'Mariana Araújo',
                photo: '/images/depoimento-mariana.png',
                stars: 5,
                text: 'Estou gostando muito da metodologia do curso porque ela é muito prática e eficaz. As aulas e materiais que são disponibilizados são de fácil compreensão, o que torna o estudo mais tranquilo. Além disso, o Prof Oliver é muito prestativo e se disponibiliza para tirar qualquer dúvida que ocorrer.',
              },
              {
                name: 'Michelle Prata',
                photo: '/images/depoimento-michele.png',
                stars: 5,
                text: 'Estou muito feliz de ser aluna do Prof Oliver no método WOA Language Hacking porque eu descobri o meu propósito de aprender inglês. Hoje com a metodologia da WOA Idiomas eu vejo que eu posso aprender inglês me divertindo, de maneira leve e descontraída e conectada ao meu propósito que é me comunicar com as pessoas de uma maneira mais fluida.',
              },
              {
                name: 'Lutigart Lima',
                photo: '/images/depoimento-lutigart.png',
                stars: 5,
                text: 'Sou aluno do Prof Oliver do método WOA Language Hacking e estou gostando bastante da metodologia, porque tenho adquirido muito novo vocabulário, também tenho melhorado e aprendido a forma correta de pronunciar as palavras. E principalmente sentir a melhora constante na pronúncia é o que mais me motiva dentro da metodologia.',
              },
              {
                name: 'Vitor Santos',
                photo: '/images/depoimento-vitor.png',
                stars: 5,
                text: 'Eu escolhi intensificar os estudos em inglês com o método da WOA Idiomas em função de toda a estrutura que este método tem a nos oferecer. Estou muito feliz com as mentorias e com a possibilidade de participação nas salas de conversação. É toda uma estrutura que favorece bastante nosso aprendizado.',
              },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl p-6 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex text-yellow-400 text-sm gap-0.5">
                  {'★'.repeat(t.stars)}
                </div>
                <p className="text-blue-100/80 text-sm leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-cyan-400/30">
                    <Image src={t.photo} alt={t.name} width={40} height={40} className="object-cover w-full h-full" />
                  </div>
                  <p className="text-white font-black text-sm">{t.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/10" style={{ background: 'rgba(5,14,26,0.98)' }}>
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Col 1 — Brand */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="relative w-8 h-8 shrink-0">
                <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/40" />
                <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border border-cyan-400/50 object-cover" />
              </div>
              <span className="text-sm font-black tracking-[0.2em] text-white" style={{ textShadow: '0 0 10px rgba(0,212,255,0.5)' }}>WOA TALK</span>
            </div>
            <div className="text-xs text-blue-200/45 leading-relaxed">
              <p>SQN 409, Bloco J, Sala 305</p>
              <p>Asa Norte, Brasília – DF</p>
              <p>70857-100</p>
              <p className="mt-2">CNPJ 54.717.782/0001-03</p>
            </div>
          </div>

          {/* Col 2 — Contact */}
          <div className="flex flex-col gap-3">
            <h6 className="text-[11px] font-black tracking-[0.2em] text-blue-200/60 uppercase mb-1">Enviar mensagem</h6>
            <p className="text-xs text-blue-200/45 mb-1">Entre em contato conosco:</p>
            <a href="tel:+5561981176884" className="flex items-center gap-2 text-xs text-blue-200/60 hover:text-white transition-colors">
              <span>📱</span> +55 61 981176884
            </a>
            <a href="mailto:contato@woaeducacional.com.br" className="flex items-center gap-2 text-xs text-blue-200/60 hover:text-white transition-colors">
              <span>✉️</span> contato@woaeducacional.com.br
            </a>
          </div>

          {/* Col 3 — Pages */}
          <div className="flex flex-col gap-3">
            <h6 className="text-[11px] font-black tracking-[0.2em] text-blue-200/60 uppercase mb-1">Páginas</h6>
            {[
              { label: 'Cursos', href: '/premium' },
              { label: 'Comunidade', href: '/community' },
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'FAQ', href: '#faq' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="text-xs text-blue-200/60 hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
          </div>

          {/* Col 4 — Social */}
          <div className="flex flex-col gap-3">
            <h6 className="text-[11px] font-black tracking-[0.2em] text-blue-200/60 uppercase mb-1">Redes Sociais</h6>
            {[
              { label: 'WOA Education', href: 'https://www.instagram.com/woaeducation', icon: '📷' },
              { label: 'Facebook', href: 'https://www.facebook.com/share/18pZtCivaM/?mibextid=wwXIfr', icon: '�' },
              { label: 'YouTube', href: 'https://youtube.com/@woaeducacional?si=a8pxOxo1LKGCpod2', icon: '▶️' },
            ].map(s => (
              <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-200/60 hover:text-white transition-colors">
                <span>{s.icon}</span> {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 px-6 py-4 flex flex-col items-center gap-1">
          <p className="text-[11px] text-blue-200/70 tracking-widest">WOA Idiomas | Todos os direitos reservados</p>
          <p className="text-[11px] text-blue-200/50">Design: H5 Criativo</p>
        </div>
      </footer>
    </main>
  )
}