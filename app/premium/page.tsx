'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { playClick } from '@/lib/sounds'

export default function PremiumPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isPremium, setIsPremium] = useState(false)
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [loadingPortal, setLoadingPortal] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/subscription')
        .then(r => r.json())
        .then(d => setIsPremium(d.isPremium === true))
        .catch(() => {})
    }
  }, [status])

  async function handlePremiumCheckout() {
    setLoadingCheckout(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erro ao iniciar checkout.')
      }
    } catch {
      alert('Erro ao iniciar checkout. Tente novamente.')
    } finally {
      setLoadingCheckout(false)
    }
  }

  async function handleManageSubscription() {
    setLoadingPortal(true)
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Erro ao abrir portal.')
      }
    } catch {
      alert('Erro ao abrir portal. Tente novamente.')
    } finally {
      setLoadingPortal(false)
    }
  }

  const plans = [
    {
      name: 'FREE',
      price: '0',
      period: '— Forever',
      features: [
        'Acesso a 3 jornadas iniciais',
        'Você pode desbloquear novas jornadas com base na sua evolução',
        'Desafios básicos',
        'Comunidade limitada',
        'Rastreamento de progresso'
      ],
      gradient: 'linear-gradient(135deg, #003AB0, #0066FF)',
      border: '#00D4FF',
      cta: 'Já estou nesse plano',
      ctaDisabled: true
    },
    {
      name: 'PREMIUM',
      price: '29,90',
      period: '/ mês',
      features: [
        'Módulos Especiais',
        'Tutor com IA',
        'Prática de Conversação guiada',
        'Desbloqueio total do app',
        'Sem anúncios',
        'Técnicas WOA integradas'
      ],
      gradient: 'linear-gradient(135deg, #B05000, #FF6B00)',
      border: '#FF9A00',
      cta: isPremium ? (loadingPortal ? 'Aguarde...' : 'Gerenciar Assinatura') : (loadingCheckout ? 'Aguarde...' : 'Ativar Premium'),
      ctaDisabled: false,
      popular: true
    },
    {
      name: 'WOA TALK CLUB',
      price: '129,90',
      period: '/ mês',
      features: [
        'Acesso VIP a tudo',
        '1000 XP por dia',
        'Desafios supremos exclusivos',
        'Comunidade elite',
        'Mentoria personalizada',
        '3000 moedas mensais',
        'Badge exclusivo de club'
      ],
      gradient: 'linear-gradient(135deg, #1a0533, #3b0764)',
      border: '#A855F7',
      cta: 'Em Breve',
      ctaDisabled: true,
      comingSoon: true
    }
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #050E1A 0%, #0a1929 50%, #050E1A 100%)' }}>
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)' }} />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-cyan-400/20 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.72)' }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { playClick(); router.push('/dashboard') }}
              className="relative w-9 h-9 hover:scale-110 transition-transform"
            >
              <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/30" />
              <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/50 object-cover" />
            </button>
            <div>
              <h1 className="text-base font-black tracking-[0.18em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>PREMIUM</h1>
              <p className="text-[10px] text-cyan-400/50 tracking-widest">UPGRADE SUA JORNADA</p>
            </div>
          </div>
          <button
            onClick={() => { playClick(); router.push('/dashboard') }}
            className="px-4 py-2 rounded border border-cyan-400/30 text-cyan-300/70 text-xs font-bold tracking-widest hover:border-cyan-400/60 hover:text-cyan-300 transition-all"
          >
            ← VOLTAR
          </button>
        </header>

        {/* Main content */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-12 space-y-12">
          {/* Hero */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
              Escolha seu plano
            </h2>
            <p className="text-blue-200/70 text-lg max-w-2xl mx-auto">
              Desbloqueie todo o potencial do WOA Talk e domine o inglês de forma épica
            </p>
          </div>

          {/* Premium active banner */}
          {isPremium && (
            <div
              className="flex items-center gap-4 px-6 py-4 rounded-2xl border"
              style={{
                background: 'linear-gradient(135deg, rgba(176,80,0,0.2), rgba(255,107,0,0.1))',
                border: '2px solid #FF9A00',
                boxShadow: '0 0 30px rgba(255,154,0,0.2)',
              }}
            >
              <span className="text-3xl">👑</span>
              <div className="flex-1">
                <p className="text-white font-black tracking-wide">VOCÊ JÁ É PREMIUM!</p>
                <p className="text-orange-200/70 text-sm">Sua assinatura está ativa. Gerencie ou cancele a qualquer momento.</p>
              </div>
              <button
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="px-4 py-2 rounded-xl font-black tracking-widest text-xs transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #B05000, #FF6B00)', color: 'white' }}
              >
                {loadingPortal ? 'Aguarde...' : 'Gerenciar'}
              </button>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-6 relative">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl overflow-hidden backdrop-blur-md transition-all hover:scale-105 flex flex-col"
                style={{
                  background: plan.popular ? 'rgba(168,85,247,0.08)' : 'rgba(5,14,26,0.65)',
                  border: `2px solid ${plan.popular ? plan.border : 'rgba(' + (plan.border === '#00D4FF' ? '0,212,255' : plan.border === '#FF9A00' ? '255,154,0' : '168,85,247') + ',0.25)'}`,
                  boxShadow: plan.popular ? `0 0 30px ${plan.border}40` : 'none',
                  opacity: (plan as { comingSoon?: boolean }).comingSoon ? 0.65 : 1,
                }}
              >
                {(plan as { comingSoon?: boolean }).comingSoon && (
                  <div
                    className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-black tracking-widest"
                    style={{ background: 'linear-gradient(135deg, #1a0533, #3b0764)', border: '1px solid #A855F7', color: '#A855F7' }}
                  >
                    EM BREVE
                  </div>
                )}
                {isPremium && plan.name === 'PREMIUM' && (
                  <div
                    className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-xs font-black tracking-widest"
                    style={{ background: 'linear-gradient(135deg, #B05000, #FF6B00)', color: 'white' }}
                  >
                    ATIVO 👑
                  </div>
                )}
                <div className="p-8 space-y-6 flex-1">
                  {/* Plan header */}
                  <div className="space-y-2">
                    <h3
                      className="text-2xl font-black tracking-wider"
                      style={{ color: plan.border }}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">R$ {plan.price}</span>
                      <span className="text-blue-200/60 text-sm">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="text-base mt-0.5">✓</span>
                        <p className="text-blue-200/80 text-sm">{feature}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-8 pb-8">
                  {/* CTA Button */}
                  <button
                    onClick={() => {
                      playClick()
                      if (plan.name === 'PREMIUM') {
                        if (isPremium) handleManageSubscription()
                        else handlePremiumCheckout()
                      }
                    }}
                    disabled={plan.ctaDisabled || (plan.name === 'PREMIUM' && (loadingCheckout || loadingPortal))}
                    className="w-full py-3 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: plan.ctaDisabled
                        ? 'rgba(255,255,255,0.1)'
                        : plan.name === 'PREMIUM' && (loadingCheckout || loadingPortal)
                        ? 'rgba(255,255,255,0.15)'
                        : plan.gradient,
                      color: plan.ctaDisabled ? 'rgba(255,255,255,0.4)' : 'white',
                      cursor: (plan.ctaDisabled || (plan.name === 'PREMIUM' && (loadingCheckout || loadingPortal))) ? 'not-allowed' : 'pointer',
                      border: `1px solid ${plan.border}40`,
                      boxShadow: !plan.ctaDisabled ? `0 0 20px ${plan.border}30` : 'none',
                    }}
                  >
                    {plan.name === 'PREMIUM' && isPremium && '✓ '}{plan.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits showcase */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-white text-center">Por que fazer upgrade?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  title: 'Jornadas Ilimitadas',
                  desc: 'Acesso a todas as jornadas temáticas disponíveis e futuras'
                },
                {
                  title: 'XP Turbinado',
                  desc: 'Ganhe até 10x mais XP nos desafios premium'
                },
                {
                  title: 'Comunidade Elite',
                  desc: 'Conecte-se com players de alto nível em uma comunidade premium'
                },
                {
                  title: 'Recompensas Exclusivas',
                  desc: 'Badges, bônus de moedas e eventos privados todos os meses'
                }
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl backdrop-blur-md border border-cyan-400/20"
                  style={{ background: 'rgba(5,14,26,0.65)' }}
                >
                  <h4 className="font-black text-white mb-2">{benefit.title}</h4>
                  <p className="text-blue-200/70 text-sm">{benefit.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-white text-center">Dúvidas frequentes</h3>
            <div className="space-y-4 max-w-3xl mx-auto">
              {[
                {
                  q: 'Posso cancelar a qualquer momento?',
                  a: 'Sim! Você pode cancelar sua assinatura quando quiser, sem cobranças adicionais.'
                },
                {
                  q: 'Qual a diferença entre Premium e CLUB?',
                  a: 'CLUB oferece o dobro de XP diário, acesso a desafios supremos exclusivos, mentoria personalizada e muito mais.'
                },
                {
                  q: 'Como recebo meus bônus de moedas?',
                  a: 'Os bônus são creditados automaticamente no primeiro dia de cada mês da sua assinatura.'
                }
              ].map((faq, i) => (
                <div
                  key={i}
                  className="p-6 rounded-xl backdrop-blur-md border border-cyan-400/20"
                  style={{ background: 'rgba(5,14,26,0.65)' }}
                >
                  <h4 className="font-black text-white mb-2">{faq.q}</h4>
                  <p className="text-blue-200/70 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-cyan-400/10 mt-12">
          <p className="text-[11px] text-blue-200/30 tracking-[0.2em]">WOA TALK © 2026 — SUA JORNADA ÉPICA NO INGLÊS</p>
        </footer>
      </div>
    </div>
  )
}
