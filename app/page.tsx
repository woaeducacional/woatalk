'use client'

import Link from 'next/link'
import Image from 'next/image'
import { playBubble } from '@/lib/sounds'

const badges = [
  { icon: '👥', value: '5.000+', label: 'Estudantes' },
  { icon: '', imgSrc: '/images/foto-oliver.png', value: 'Mr. Oliver', label: 'Criado por' },
  { icon: '🏆', value: '10+ Anos', label: 'de Experiência' },
  { icon: '🌍', value: '6 Idiomas', label: 'Fluente' },
]

const phases = [
  {
    number: 'FASE 1',
    name: 'OCEANOS',
    level: 'Iniciante (A0 → A2)',
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
        </div>
      </header>

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
          <section key={i} className="relative min-h-[65vh] flex items-center">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Ana Clara S.', role: 'Estudante universitária', avatar: '👩‍🎓', stars: 5, text: 'Em 3 meses de WOA Talk já consigo assistir séries sem legenda e conversar com nativos. O método é completamente diferente do que eu aprendi na escola. Recomendo demais!' },
              { name: 'Rafael M.', role: 'Desenvolvedor de software', avatar: '👨‍💻', stars: 5, text: 'Precisava do inglês para reuniões com clientes internacionais. O WOA Play e as aulas ao vivo me deram a confiança que faltava. Em 6 meses passei de B1 para C1 no teste de empresa.' },
              { name: 'Juliana K.', role: 'Profissional de marketing', avatar: '👩‍💼', stars: 5, text: 'O Oliver AI Tutor é incrível! Pratico conversação a qualquer hora, sem vergonha de errar. A gamificação me mantém motivada todos os dias. É viciante da melhor forma possível.' },
              { name: 'Pedro H.', role: 'Médico residente', avatar: '👨‍⚕️', stars: 5, text: 'Tentei vários cursos antes e desisti de todos. Com o WOA Talk pela primeira vez senti evolução real. A jornada em fases faz tudo parecer um jogo, e quando percebi já estava falando fluente.' },
              { name: 'Mariana L.', role: 'Estudante do ensino médio', avatar: '👩‍🏫', stars: 5, text: 'Minha filha de 16 anos usa e adora. Em menos de 4 meses ela passou na prova de inglês da faculdade com a maior nota da turma. Agradeço demais ao Método WOA!' },
              { name: 'Carlos F.', role: 'Empreendedor', avatar: '🧑‍💼', stars: 5, text: 'Fechei um contrato com uma empresa americana depois de 4 meses no programa premium. O investimento no WOA Talk se pagou na primeira reunião. Valeu cada centavo.' },
            ].map((t, i) => (
              <div key={i} className="rounded-2xl p-6 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex text-yellow-400 text-sm gap-0.5">
                  {'★'.repeat(t.stars)}
                </div>
                <p className="text-blue-100/80 text-sm leading-relaxed flex-1">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="text-white font-black text-sm">{t.name}</p>
                    <p className="text-blue-200/45 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ── */}
      <section style={{ background: 'linear-gradient(180deg, #050E1A 0%, #080F1E 100%)' }} className="px-4 py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-[11px] font-black tracking-[0.3em] mb-2" style={{ color: 'rgba(255,215,0,0.5)' }}>— ESCOLHA SEU PLANO —</p>
          <h2 className="text-center text-3xl sm:text-4xl font-black text-white mb-3" style={{ textShadow: '0 0 30px rgba(255,215,0,0.15)' }}>
            Comece <span style={{ color: '#FFD700' }}>grátis</span>, evolua quando quiser
          </h2>
          <p className="text-center text-blue-200/55 text-sm mb-12">Sem cartão de crédito para começar. Cancele quando quiser.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {/* FREE */}
            <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'rgba(5,14,26,0.80)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <p className="text-[10px] font-black tracking-widest text-white/40 mb-1">EXPLORADOR</p>
                <p className="text-3xl font-black text-white">Grátis</p>
                <p className="text-xs text-white/40 mt-1">para sempre</p>
              </div>
              <ul className="flex flex-col gap-2 flex-1">
                {['Acesso às fases oceânicas', 'Jogo de memória básico', 'Comunidade WOA Talk', '2 jornadas por dia', 'XP e conquistas'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-blue-100/70">
                    <span className="text-green-400 text-sm">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" onClick={() => playBubble()} className="block w-full py-3 text-center text-xs font-black tracking-widest rounded-xl text-white transition-all hover:scale-[1.02]" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                COMEÇAR GRÁTIS
              </Link>
            </div>

            {/* PREMIUM — destaque */}
            <div className="rounded-2xl p-6 flex flex-col gap-4 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, rgba(88,28,135,0.6), rgba(59,7,100,0.7))', border: '2px solid rgba(168,85,247,0.5)', boxShadow: '0 0 40px rgba(168,85,247,0.2)' }}>
              <div className="absolute top-3 right-3 text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full" style={{ background: 'rgba(168,85,247,0.3)', border: '1px solid rgba(168,85,247,0.5)', color: '#c084fc' }}>MAIS POPULAR</div>
              <div>
                <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: '#c084fc' }}>PREMIUM</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-black text-white">R$ 47</p>
                  <span className="text-white/40 text-sm">/mês</span>
                </div>
                <p className="text-xs text-white/40 mt-1">ou R$ 397/ano (economize 30%)</p>
              </div>
              <ul className="flex flex-col gap-2 flex-1">
                {['Tudo do plano grátis', 'Oliver AI Tutor ilimitado', 'Conversação com IA', 'Aulas ao vivo semanais', 'WOA Play (cursos em vídeo)', 'Missões avançadas', 'Certificados de conclusão'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-purple-100/80">
                    <span className="text-purple-400 text-sm">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/premium" onClick={() => playBubble()} className="block w-full py-3 text-center text-xs font-black tracking-widest rounded-xl text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)', boxShadow: '0 4px 20px rgba(168,85,247,0.4)' }}>
                ASSINAR PREMIUM
              </Link>
            </div>

            {/* ANUAL */}
            <div className="rounded-2xl p-6 flex flex-col gap-4" style={{ background: 'linear-gradient(160deg, rgba(20,14,0,0.8), rgba(40,28,0,0.6))', border: '1px solid rgba(255,215,0,0.25)' }}>
              <div>
                <p className="text-[10px] font-black tracking-widest mb-1" style={{ color: '#FFD700' }}>ELITE ANUAL</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-black text-white">R$ 33</p>
                  <span className="text-white/40 text-sm">/mês</span>
                </div>
                <p className="text-xs text-white/40 mt-1">cobrado anualmente — R$ 397/ano</p>
              </div>
              <ul className="flex flex-col gap-2 flex-1">
                {['Tudo do Premium', 'Mentoria em grupo mensal', 'Acesso antecipado a novidades', 'Suporte prioritário', 'Badge Elite exclusivo'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-yellow-100/80">
                    <span className="text-yellow-400 text-sm">✓</span>{f}
                  </li>
                ))}
              </ul>
              <Link href="/premium" onClick={() => playBubble()} className="block w-full py-3 text-center text-xs font-black tracking-widest rounded-xl text-black transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #FFD700, #CC8800)' }}>
                ASSINAR ELITE
              </Link>
            </div>
          </div>

          {/* Single CTA button */}
          <div className="text-center">
            <Link
              href="/premium"
              onClick={() => playBubble()}
              className="inline-block px-10 py-4 font-black text-sm tracking-widest rounded-xl text-white transition-all hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              VER TODOS OS PLANOS E DETALHES →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-6 text-center border-t border-white/10" style={{ background: 'rgba(5,14,26,0.98)' }}>
        <p className="text-[11px] text-blue-200/35 tracking-[0.2em]">
          WOA TALK © 2026 — SUA JORNADA ÉPICA NO INGLÊS
        </p>
      </footer>
    </main>
  )
}