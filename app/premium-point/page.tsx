'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { playClick } from '@/lib/sounds'

type PlanId = 'starter_monthly_promo' | 'starter_yearly_promo' | 'premium_monthly_promo' | 'premium_yearly_promo'
type BillingType = 'CREDIT_CARD' | 'PIX' | 'BOLETO'

interface SubscriptionInfo {
  status: string
  plan: string | null
  currentPeriodEnd: string | null
  isPremium: boolean
}

function formatCpf(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function planLabel(planId: string | null): string {
  const map: Record<string, string> = {
    starter_monthly: 'Starter Mensal',
    starter_yearly: 'Starter Anual',
    premium_monthly: 'Premium Mensal',
    premium_yearly: 'Premium Anual',
    starter_monthly_promo: 'Starter Mensal',
    starter_yearly_promo: 'Starter Anual',
    premium_monthly_promo: 'Premium Mensal',
    premium_yearly_promo: 'Premium Anual',
  }
  return planId ? (map[planId] ?? planId) : ''
}

export default function PremiumPointPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null)
  const [loadingCancel, setLoadingCancel] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [billingType, setBillingType] = useState<BillingType>('PIX')
  const [cpf, setCpf] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/user/subscription')
        .then(r => r.json())
        .then(d => setSubInfo({
          status: d.status,
          plan: d.plan ?? null,
          currentPeriodEnd: d.currentPeriodEnd ?? null,
          isPremium: d.isPremium === true,
        }))
        .catch(() => {})
    }
  }, [status])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModalOpen(false)
      }
    }
    if (modalOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [modalOpen])

  function openCheckout(planId: PlanId) {
    playClick()
    setSelectedPlan(planId)
    setBillingType('PIX')
    setCpf('')
    setCheckoutError('')
    setModalOpen(true)
  }

  async function handleCheckout() {
    if (!selectedPlan) return
    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setCheckoutError('Informe um CPF válido com 11 dígitos.')
      return
    }

    setCheckoutLoading(true)
    setCheckoutError('')

    try {
      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, billingType, cpf: cpfDigits }),
      })
      const data = await res.json()

      if (!res.ok || !data.redirectUrl) {
        setCheckoutError(data.error || 'Erro ao iniciar pagamento. Tente novamente.')
        setCheckoutLoading(false)
        return
      }

      window.location.href = data.redirectUrl
    } catch {
      setCheckoutError('Erro de conexão. Tente novamente.')
      setCheckoutLoading(false)
    }
  }

  async function handleCancel() {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? O acesso será removido imediatamente.')) return
    setLoadingCancel(true)
    try {
      const res = await fetch('/api/asaas/cancel', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSubInfo(prev => prev ? { ...prev, status: 'inactive', isPremium: false, plan: null, currentPeriodEnd: null } : null)
        alert('Assinatura cancelada com sucesso.')
      } else {
        alert(data.error || 'Erro ao cancelar assinatura.')
      }
    } catch {
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setLoadingCancel(false)
    }
  }

  const plans = [
    {
      id: 'starter_monthly_promo' as PlanId,
      name: 'STARTER',
      badge: 'MENSAL',
      price: '19,90',
      originalPrice: '29,90',
      period: '/ mês',
      savingsBadge: '33,44% OFF',
      savings: 'Economize R$ 10,00 todo mês',
      idealFor: 'Para quem está começando e quer praticar no próprio ritmo.',
      gradient: 'linear-gradient(135deg, #003AB0, #0066FF)',
      border: '#00D4FF',
      features: [
        'Todas as jornadas desbloqueadas',
        'Tutor com IA',
        'Prática de Conversação guiada',
        'Técnicas WOA integradas',
        'Sem anúncios',
      ],
    },
    {
      id: 'starter_yearly_promo' as PlanId,
      name: 'STARTER',
      badge: 'ANUAL',
      price: '238,90',
      originalPrice: '358,80',
      period: '/ ano',
      savingsBadge: '33,44% OFF',
      savings: 'Economize R$ 119,90 no ano',
      idealFor: 'Para quem já decidiu e quer economizar na jornada anual.',
      gradient: 'linear-gradient(135deg, #005090, #0080CC)',
      border: '#40BFFF',
      features: [
        'Tudo do Starter Mensal',
        'Cobrança anual única',
        'Melhor custo-benefício',
        'Suporte prioritário',
      ],
    },
    {
      id: 'premium_monthly_promo' as PlanId,
      name: 'PREMIUM',
      badge: 'MENSAL',
      price: '59,90',
      originalPrice: '89,90',
      period: '/ mês',
      savingsBadge: '33,37% OFF',
      savings: 'Economize R$ 30,00 todo mês',
      idealFor: 'Para quem tem base e quer acelerar com recursos exclusivos.',
      gradient: 'linear-gradient(135deg, #B05000, #FF6B00)',
      border: '#FF9A00',
      popular: true,
      features: [
        'Tudo do Starter',
        'Módulos Especiais Avançados',
        'XP Turbinado (10x)',
        '500 moedas mensais',
        'Comunidade Elite',
        'Badge exclusivo Premium',
      ],
    },
    {
      id: 'premium_yearly_promo' as PlanId,
      name: 'PREMIUM',
      badge: 'ANUAL',
      price: '718,00',
      originalPrice: '1.078,80',
      period: '/ ano',
      savingsBadge: '33,44% OFF',
      savings: 'Economize R$ 360,80 no ano',
      idealFor: 'Para quem quer o máximo com o melhor custo-benefício.',
      gradient: 'linear-gradient(135deg, #7c2d12, #c2410c)',
      border: '#f97316',
      features: [
        'Tudo do Premium Mensal',
        'Cobrança anual única',
        '1.000 moedas extras no ato',
        'Acesso antecipado a novidades',
      ],
    },
  ]

  const isActive = subInfo?.isPremium === true

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
              <h1 className="text-base font-black tracking-[0.18em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.5)' }}>OFERTA ESPECIAL</h1>
              <p className="text-[10px] text-cyan-400/50 tracking-widest">ACESSO EXCLUSIVO DE VENDEDORES</p>
            </div>
          </div>
          <button
            onClick={() => { playClick(); router.push('/dashboard') }}
            className="px-4 py-2 rounded border border-cyan-400/30 text-cyan-300/70 text-xs font-bold tracking-widest hover:border-cyan-400/60 hover:text-cyan-300 transition-all"
          >
            ← VOLTAR
          </button>
        </header>

        <div className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-12 space-y-12">

          {/* Promo banner */}
          <div
            className="rounded-2xl px-6 py-5 text-center space-y-1"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(0,102,255,0.08))', border: '1.5px solid rgba(0,212,255,0.3)', boxShadow: '0 0 40px rgba(0,212,255,0.06)' }}
          >
            <p className="text-[11px] font-black tracking-[0.3em] text-cyan-400/60">💙 WOA TALK — OFERTA ESPECIAL</p>
            <h2 className="text-3xl font-black text-white" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
              Preços exclusivos para você
            </h2>
            <p className="text-blue-200/60 text-sm max-w-xl mx-auto">
              Aproveite os descontos negociados. Válido apenas por este link.
            </p>
            <div className="flex items-center justify-center gap-6 pt-2 text-sm text-blue-200/50">
              <span>💳 Cartão de Crédito</span>
              <span>🟢 Pix Automático</span>
              <span>🧾 Boleto Bancário</span>
            </div>
          </div>

          {/* Active subscription banner */}
          {isActive && (
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
                <p className="text-white font-black tracking-wide">ASSINATURA ATIVA — {planLabel(subInfo?.plan ?? null).toUpperCase()}</p>
                <p className="text-orange-200/70 text-sm">
                  {subInfo?.currentPeriodEnd
                    ? `Válida até ${new Date(subInfo.currentPeriodEnd).toLocaleDateString('pt-BR')}`
                    : 'Gerencie sua assinatura abaixo.'}
                </p>
              </div>
              <button
                onClick={handleCancel}
                disabled={loadingCancel}
                className="px-4 py-2 rounded-xl font-black tracking-widest text-xs transition-all hover:scale-105 active:scale-95 border border-red-500/50 text-red-400 hover:border-red-400 hover:text-red-300"
              >
                {loadingCancel ? 'Cancelando...' : 'Cancelar'}
              </button>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isCurrentPlan = subInfo?.plan === plan.id && isActive
              return (
                <div
                  key={plan.id}
                  className="relative rounded-2xl overflow-hidden backdrop-blur-md transition-all hover:scale-[1.02] flex flex-col"
                  style={{
                    background: plan.popular ? 'rgba(255,107,0,0.07)' : 'rgba(5,14,26,0.65)',
                    border: `2px solid ${isCurrentPlan ? plan.border : plan.border + '40'}`,
                    boxShadow: plan.popular ? `0 0 30px ${plan.border}35` : 'none',
                  }}
                >
                  {/* Popular badge */}
                  {'popular' in plan && plan.popular && !isCurrentPlan && (
                    <div
                      className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest"
                      style={{ background: plan.gradient, color: 'white' }}
                    >
                      POPULAR
                    </div>
                  )}
                  {/* Savings / discount badge */}
                  {plan.savingsBadge && !isCurrentPlan && !('popular' in plan && plan.popular) && (
                    <div
                      className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest"
                      style={{ background: `${plan.border}22`, border: `1px solid ${plan.border}80`, color: plan.border }}
                    >
                      {plan.savingsBadge}
                    </div>
                  )}
                  {/* Active indicator */}
                  {isCurrentPlan && (
                    <div
                      className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest"
                      style={{ background: plan.gradient, color: 'white' }}
                    >
                      ATIVO 👑
                    </div>
                  )}

                  <div className="p-7 space-y-5 flex-1">
                    {/* Plan name */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black tracking-wider" style={{ color: plan.border }}>{plan.name}</h3>
                        <span
                          className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded"
                          style={{ background: `${plan.border}18`, color: plan.border, border: `1px solid ${plan.border}40` }}
                        >
                          {plan.badge}
                        </span>
                      </div>
                      <div className="text-sm line-through" style={{ color: `${plan.border}70` }}>
                        De R$ {plan.originalPrice}
                      </div>
                      <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${plan.border}99` }}>
                        por apenas
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">R$ {plan.price}</span>
                        <span className="text-blue-200/60 text-sm">{plan.period}</span>
                      </div>
                      <div className="text-xs font-bold" style={{ color: plan.border }}>
                        💰 {plan.savings}
                      </div>
                      {plan.idealFor && (
                        <p className="text-[11px] leading-relaxed pt-1" style={{ color: `${plan.border}cc` }}>
                          🎯 {plan.idealFor}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <span className="text-sm mt-0.5" style={{ color: plan.border }}>✓</span>
                          <p className="text-blue-200/80 text-sm">{feature}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-7 pb-7">
                    <button
                      onClick={() => { if (!isCurrentPlan) openCheckout(plan.id) }}
                      disabled={isCurrentPlan}
                      className="w-full py-3 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
                      style={{
                        background: isCurrentPlan ? 'rgba(255,255,255,0.08)' : plan.gradient,
                        color: isCurrentPlan ? 'rgba(255,255,255,0.35)' : 'white',
                        cursor: isCurrentPlan ? 'default' : 'pointer',
                        border: `1px solid ${plan.border}40`,
                        boxShadow: !isCurrentPlan ? `0 0 18px ${plan.border}28` : 'none',
                      }}
                    >
                      {isCurrentPlan ? '✓ Plano Atual' : 'Assinar Agora'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Payment methods note */}
          <div className="text-center py-4 space-y-2">
            <p className="text-blue-200/40 text-xs">Pagamentos processados com segurança pela <span className="text-blue-200/60 font-bold">Asaas</span></p>
            <p className="text-blue-200/30 text-xs">Pix Automático: após a primeira autorização no seu banco, as mensalidades são debitadas automaticamente.</p>
          </div>

        </div>

        {/* Footer */}
        <footer className="py-6 text-center border-t border-cyan-400/10 mt-12">
          <p className="text-[11px] text-blue-200/30 tracking-[0.2em]">WOA TALK © 2026 — SUA JORNADA ÉPICA NO INGLÊS</p>
        </footer>
      </div>

      {/* Checkout Modal */}
      {modalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div
            ref={modalRef}
            className="w-full max-w-md rounded-2xl p-8 space-y-6"
            style={{ background: 'linear-gradient(135deg, #0a1929 0%, #050E1A 100%)', border: '1.5px solid rgba(0,212,255,0.25)', boxShadow: '0 0 60px rgba(0,212,255,0.12)' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-white tracking-wider">FINALIZAR ASSINATURA</h3>
                <p className="text-cyan-400/70 text-sm mt-1">{planLabel(selectedPlan)} — Oferta Especial</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-blue-200/40 hover:text-blue-200/70 text-xl font-bold transition-colors ml-4"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">CPF</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                maxLength={14}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/30 text-base font-mono outline-none focus:ring-2"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">Forma de Pagamento</label>
              <div className="grid grid-cols-3 gap-3">
                {([
                  { value: 'PIX', label: '🟢 Pix Auto.' },
                  { value: 'CREDIT_CARD', label: '💳 Cartão' },
                  { value: 'BOLETO', label: '🧾 Boleto' },
                ] as { value: BillingType; label: string }[]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setBillingType(opt.value)}
                    className="py-2.5 px-2 rounded-xl text-xs font-black tracking-wide transition-all"
                    style={{
                      background: billingType === opt.value ? 'rgba(0,212,255,0.15)' : 'rgba(255,255,255,0.05)',
                      border: billingType === opt.value ? '1.5px solid rgba(0,212,255,0.6)' : '1.5px solid rgba(255,255,255,0.1)',
                      color: billingType === opt.value ? '#00D4FF' : 'rgba(255,255,255,0.5)',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {billingType === 'PIX' && (
                <p className="text-[11px] text-cyan-400/50 leading-relaxed">
                  Você será redirecionado para autorizar o Pix Automático no app do seu banco. Após isso, as mensalidades são debitadas automaticamente.
                </p>
              )}
            </div>

            {checkoutError && (
              <p className="text-red-400 text-sm font-bold text-center">{checkoutError}</p>
            )}

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full py-3.5 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95"
              style={{
                background: checkoutLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #0066FF, #00D4FF)',
                color: checkoutLoading ? 'rgba(255,255,255,0.4)' : 'white',
                cursor: checkoutLoading ? 'not-allowed' : 'pointer',
                boxShadow: !checkoutLoading ? '0 0 24px rgba(0,212,255,0.3)' : 'none',
              }}
            >
              {checkoutLoading ? 'Processando...' : 'Continuar para Pagamento →'}
            </button>

            <p className="text-center text-[10px] text-blue-200/25">Pagamento seguro via Asaas · SSL</p>
          </div>
        </div>
      )}
    </div>
  )
}
