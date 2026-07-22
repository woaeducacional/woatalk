'use client'

import { Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { playClick } from '@/lib/sounds'

type PlanId = 'starter_monthly' | 'starter_yearly' | 'premium_monthly' | 'premium_yearly'
type BillingType = 'CREDIT_CARD' | 'PIX' | 'BOLETO'

interface SubscriptionInfo {
  status: string
  plan: string | null
  currentPeriodEnd: string | null
  isPremium: boolean
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
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
  }
  return planId ? (map[planId] ?? planId) : ''
}

function PremiumPageInner() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [subInfo, setSubInfo] = useState<SubscriptionInfo | null>(null)
  const [loadingCancel, setLoadingCancel] = useState(false)

  // Affiliate ref code
  const [refCode, setRefCode] = useState<string | null>(null)
  const [refDiscount, setRefDiscount] = useState<number | null>(null)

  // Checkout modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [billingType, setBillingType] = useState<BillingType>('PIX')
  const [cpf, setCpf] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  // Card form state
  const [cardNumber, setCardNumber] = useState('')
  const [cardHolder, setCardHolder] = useState('')
  const [expiryRaw, setExpiryRaw] = useState('')
  const [ccv, setCcv] = useState('')
  const [phone, setPhone] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [addressStreet, setAddressStreet] = useState('')
  const [addressNumber, setAddressNumber] = useState('')
  const [addressComplement, setAddressComplement] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [addressProvince, setAddressProvince] = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError] = useState('')
  // Success state
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false)
  const [successTrialDate, setSuccessTrialDate] = useState('')

  // Coupon state
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount_percent: number } | null>(null)
  const [couponValidating, setCouponValidating] = useState(false)
  const [couponMsg, setCouponMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
  }, [status, router])

  useEffect(() => {
    const code = searchParams.get('ref')?.trim().toUpperCase()
    if (!code) return
    fetch(`/api/affiliates/validate?code=${encodeURIComponent(code)}`)
      .then(r => r.ok ? r.json() : { valid: false })
      .then(d => {
        if (d.valid) { setRefCode(d.code); setRefDiscount(d.discount_percent) }
      })
      .catch(() => {})
  }, [searchParams])

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

  // Close modal on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModalOpen(false)
      }
    }
    if (modalOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [modalOpen])

  async function lookupCep(cep: string) {
    const clean = cep.replace(/\D/g, '')
    if (clean.length !== 8) return
    setCepLoading(true)
    setCepError('')
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`)
      const data = await res.json()
      if (data.erro) {
        setCepError('CEP não encontrado.')
      } else {
        setAddressStreet(data.logradouro ?? '')
        setAddressCity(data.localidade ?? '')
        setAddressProvince(data.uf ?? '')
      }
    } catch {
      setCepError('Erro ao buscar CEP.')
    } finally {
      setCepLoading(false)
    }
  }

  function openCheckout(planId: PlanId) {
    playClick()
    setSelectedPlan(planId)
    setBillingType('PIX')
    setCpf('')
    setCheckoutError('')
    setCouponInput('')
    setAppliedCoupon(null)
    setCouponMsg(null)
    setCardNumber('')
    setCardHolder('')
    setExpiryRaw('')
    setCcv('')
    setPhone('')
    setPostalCode('')
    setAddressStreet('')
    setAddressNumber('')
    setAddressComplement('')
    setAddressCity('')
    setAddressProvince('')
    setCepError('')
    setSubscriptionSuccess(false)
    setSuccessTrialDate('')
    setModalOpen(true)
  }

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponValidating(true)
    setCouponMsg(null)
    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}`)
      const data = await res.json()
      if (data.valid) {
        setAppliedCoupon({ code: data.code, discount_percent: data.discount_percent })
        setCouponMsg({ type: 'ok', text: `Cupom aplicado: ${data.discount_percent}% de desconto!` })
      } else {
        setAppliedCoupon(null)
        setCouponMsg({ type: 'err', text: 'Cupom inválido ou inativo.' })
      }
    } catch {
      setCouponMsg({ type: 'err', text: 'Erro ao validar cupom.' })
    } finally {
      setCouponValidating(false)
    }
  }

  async function handleCreditCardDirect() {
    if (!selectedPlan) return
    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setCheckoutError('Informe um CPF válido com 11 dígitos.')
      return
    }
    const cardDigits = cardNumber.replace(/\D/g, '')
    if (cardDigits.length < 13) {
      setCheckoutError('Número do cartão inválido.')
      return
    }
    if (!cardHolder.trim()) {
      setCheckoutError('Informe o nome impresso no cartão.')
      return
    }
    const expiryDigits = expiryRaw.replace(/\D/g, '')
    if (expiryDigits.length !== 4) {
      setCheckoutError('Data de validade inválida (MM/AA).')
      return
    }
    if (ccv.length < 3) {
      setCheckoutError('CVV inválido.')
      return
    }
    const phoneDigits = phone.replace(/\D/g, '')
    if (phoneDigits.length < 10) {
      setCheckoutError('Informe um telefone válido.')
      return
    }
    if (postalCode.replace(/\D/g, '').length !== 8) {
      setCheckoutError('CEP inválido.')
      return
    }
    if (!addressStreet.trim() || !addressNumber.trim() || !addressCity.trim() || !addressProvince.trim()) {
      setCheckoutError('Preencha todos os campos de endereço.')
      return
    }

    let finalCoupon = appliedCoupon
    const rawInput = couponInput.trim().toUpperCase()
    if (rawInput && !appliedCoupon) {
      try {
        const vRes = await fetch(`/api/coupons/validate?code=${encodeURIComponent(rawInput)}`)
        const vData = await vRes.json()
        if (vData.valid) {
          finalCoupon = { code: vData.code, discount_percent: vData.discount_percent }
          setAppliedCoupon(finalCoupon)
          setCouponMsg({ type: 'ok', text: `Cupom aplicado: ${vData.discount_percent}% de desconto!` })
        } else {
          setCouponMsg({ type: 'err', text: 'Cupom inválido ou inativo.' })
          return
        }
      } catch {
        setCouponMsg({ type: 'err', text: 'Erro ao validar cupom.' })
        return
      }
    }

    setCheckoutLoading(true)
    setCheckoutError('')

    try {
      const expiryM = expiryDigits.slice(0, 2)
      const expiryY = expiryDigits.slice(2)
      const res = await fetch('/api/asaas/credit-card-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          cpf: cpfDigits,
          phone: phoneDigits,
          cardNumber: cardDigits,
          cardHolder: cardHolder.trim(),
          expiryMonth: expiryM,
          expiryYear: expiryY.length === 2 ? `20${expiryY}` : expiryY,
          ccv,
          postalCode: postalCode.replace(/\D/g, ''),
          address: addressStreet.trim(),
          addressNumber: addressNumber.trim(),
          addressComplement: addressComplement.trim(),
          city: addressCity.trim(),
          province: addressProvince.trim(),
          ...(refCode ? { ref_code: refCode } : {}),
          ...(finalCoupon ? { coupon_code: finalCoupon.code } : {}),
        }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        // Strip raw Asaas internals from error for friendlier display
        const rawMsg: string = data.error || 'Erro ao processar cartão. Verifique os dados e tente novamente.'
        const friendly = rawMsg.includes('creditCard') || rawMsg.includes('Cartão') || rawMsg.includes('cartão')
          ? rawMsg
          : rawMsg.includes('|') ? rawMsg.split('|')[0].trim() : rawMsg
        setCheckoutError(friendly)
        setCheckoutLoading(false)
        return
      }

      // Success — update local state immediately
      const trialDate = new Date(data.trialEndDate)
      setSuccessTrialDate(trialDate.toLocaleDateString('pt-BR'))
      setSubscriptionSuccess(true)
      setSubInfo({
        status: 'trial',
        plan: selectedPlan,
        currentPeriodEnd: data.trialEndDate,
        isPremium: true,
      })
    } catch {
      setCheckoutError('Erro de conexão. Tente novamente.')
      setCheckoutLoading(false)
    }
  }

  async function handleCheckout() {
    if (billingType === 'CREDIT_CARD') {
      return handleCreditCardDirect()
    }

    if (!selectedPlan) return
    const cpfDigits = cpf.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setCheckoutError('Informe um CPF válido com 11 dígitos.')
      return
    }

    // Auto-validate coupon if user typed but didn't click "Aplicar"
    let finalCoupon = appliedCoupon
    const rawInput = couponInput.trim().toUpperCase()
    if (rawInput && !appliedCoupon) {
      try {
        const vRes = await fetch(`/api/coupons/validate?code=${encodeURIComponent(rawInput)}`)
        const vData = await vRes.json()
        if (vData.valid) {
          finalCoupon = { code: vData.code, discount_percent: vData.discount_percent }
          setAppliedCoupon(finalCoupon)
          setCouponMsg({ type: 'ok', text: `Cupom aplicado: ${vData.discount_percent}% de desconto!` })
        } else {
          setCouponMsg({ type: 'err', text: 'Cupom inválido ou inativo.' })
          return
        }
      } catch {
        setCouponMsg({ type: 'err', text: 'Erro ao validar cupom.' })
        return
      }
    }

    setCheckoutLoading(true)
    setCheckoutError('')

    try {
      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan,
          billingType,
          cpf: cpfDigits,
          ...(refCode ? { ref_code: refCode } : {}),
          ...(finalCoupon ? { coupon_code: finalCoupon.code } : {}),
        }),
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
      id: 'starter_monthly' as PlanId,
      name: 'STARTER',
      badge: 'MENSAL',
      price: '29,90',
      period: '/ mês',
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
      id: 'starter_yearly' as PlanId,
      name: 'STARTER',
      badge: 'ANUAL',
      price: '287,00',
      period: '/ ano',
      savingsBadge: 'Economize ~20%',
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
      id: 'premium_monthly' as PlanId,
      name: 'PREMIUM',
      badge: 'MENSAL',
      price: '89,90',
      period: '/ mês',
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
      id: 'premium_yearly' as PlanId,
      name: 'PREMIUM',
      badge: 'ANUAL',
      price: '867,00',
      period: '/ ano',
      savingsBadge: 'Economize ~20%',
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
  const isTrial = subInfo?.status === 'trial'

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
        <div className="flex-1 max-w-screen-xl mx-auto w-full px-6 py-12 space-y-12">

          {/* Hero */}
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black text-white" style={{ textShadow: '0 0 20px rgba(0,212,255,0.4)' }}>
              Escolha seu plano
            </h2>
            {refCode && refDiscount && (
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-black tracking-wide" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#22c55e' }}>
                🎁 Código <span className="font-black">{refCode}</span> aplicado — {refDiscount}% de desconto!
              </div>
            )}
            <p className="text-blue-200/70 text-lg max-w-2xl mx-auto">
              Desbloqueie todo o potencial do WOA Talk e domine o inglês de forma épica
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black tracking-wide" style={{ background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.35)', color: '#00D4FF' }}>
              🎁 30 dias grátis no cartão e Pix Automático — sem cobrança agora
            </div>
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
                <p className="text-white font-black tracking-wide">
                    {isTrial ? 'TRIAL ATIVO — 30 DIAS GRÁTIS' : 'ASSINATURA ATIVA'} — {planLabel(subInfo?.plan ?? null).toUpperCase()}
                  </p>
                <p className="text-orange-200/70 text-sm">
                  {isTrial
                    ? 'Você está no período gratuito. A primeira cobrança ocorrerá em 30 dias.'
                    : subInfo?.currentPeriodEnd
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
                  {plan.popular && !isCurrentPlan && (
                    <div
                      className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest"
                      style={{ background: plan.gradient, color: 'white' }}
                    >
                      POPULAR
                    </div>
                  )}
                  {/* Savings badge or affiliate discount badge */}
                  {!isCurrentPlan && (refDiscount ? (
                    <div
                      className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest"
                      style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.5)', color: '#22c55e' }}
                    >
                      -{refDiscount}% cód. afiliado
                    </div>
                  ) : plan.savingsBadge ? (
                    <div
                      className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest"
                      style={{ background: `${plan.border}22`, border: `1px solid ${plan.border}80`, color: plan.border }}
                    >
                      {plan.savingsBadge}
                    </div>
                  ) : null)}
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
                      {refDiscount && (
                        <p className="text-white/40 text-sm line-through">R$ {plan.price}</p>
                      )}
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">
                          {refDiscount
                            ? `R$ ${(parseFloat(plan.price.replace(',', '.')) * (1 - refDiscount / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : `R$ ${plan.price}`
                          }
                        </span>
                        <span className="text-blue-200/60 text-sm">{plan.period}</span>
                      </div>
                      {!isCurrentPlan && !refDiscount && (
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider" style={{ background: 'rgba(0,212,255,0.10)', border: '1px solid rgba(0,212,255,0.30)', color: '#00D4FF' }}>
                          🎁 30 dias grátis
                        </div>
                      )}
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

          {/* ── HUMAN COACHING PLANS ── */}
          <div className="space-y-6 pt-4">
            <div className="text-center space-y-2">
              <p className="text-[11px] font-black tracking-[0.3em] text-yellow-400/60">— ACOMPANHAMENTO HUMANO —</p>
              <h3 className="text-2xl font-black text-white">Aprenda com suporte de professores</h3>
              <p className="text-blue-200/55 text-sm">Planos com mentoria e aulas ao vivo. Pagamento via WhatsApp.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">

              {/* WOA TALK CLUB */}
              <div
                className="relative rounded-2xl overflow-hidden backdrop-blur-md flex flex-col"
                style={{ background: 'rgba(20,30,10,0.70)', border: '2px solid rgba(134,239,172,0.35)', boxShadow: '0 0 30px rgba(134,239,172,0.08)' }}
              >
                <div className="p-7 space-y-5 flex-1">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black tracking-wider" style={{ color: '#86efac' }}>WOA TALK CLUB</h3>
                      <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded" style={{ background: 'rgba(134,239,172,0.12)', color: '#86efac', border: '1px solid rgba(134,239,172,0.3)' }}>MENTORIA MENSAL</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">R$ 97,94</span>
                      <span className="text-blue-200/60 text-sm">/ mês (12x)</span>
                    </div>
                    <p className="text-blue-200/50 text-xs">ou R$ 947,00 à vista</p>
                    <p className="text-[11px] leading-relaxed pt-1" style={{ color: 'rgba(134,239,172,0.8)' }}>
                      🎯 Ideal para quem deseja orientação humana durante a jornada, com mentorias mensais para manter a constância e evoluir com segurança.
                    </p>
                  </div>
                  <div className="text-xs text-green-300/60 font-bold">🎁 Bônus: 1 ano de acesso ao App WOA Talk (Plano Starter)</div>
                  <div className="space-y-2.5">
                    {[
                      'Mentoria ao vivo mensal para direcionamento e dúvidas',
                      'Prática diária com o App WOA Talk (Plano Starter)',
                      'Acesso à WOA Play com mais de 400 aulas e materiais',
                      'Método WOA: simples, prático e eficiente',
                      'Comunidade e grupo exclusivo para praticar',
                      'Situações reais do dia a dia',
                      '1 ano de acesso ao WOA Talk Club + App',
                    ].map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-sm mt-0.5" style={{ color: '#86efac' }}>✓</span>
                        <p className="text-blue-200/80 text-sm">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-7 pb-7">
                  <a
                    href="https://wa.me/556181176884"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playClick()}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white', boxShadow: '0 0 18px rgba(34,197,94,0.3)' }}
                  >
                    <span>💬</span> Falar no WhatsApp
                  </a>
                </div>
              </div>

              {/* WOA EXCLUSIVE */}
              <div
                className="relative rounded-2xl overflow-hidden backdrop-blur-md flex flex-col"
                style={{ background: 'rgba(30,15,5,0.70)', border: '2px solid rgba(251,191,36,0.45)', boxShadow: '0 0 30px rgba(251,191,36,0.10)' }}
              >
                <div
                  className="absolute top-4 right-4 z-10 px-3 py-1 rounded-full text-[10px] font-black tracking-widest"
                  style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000' }}
                >
                  🚀 EXCLUSIVO
                </div>
                <div className="p-7 space-y-5 flex-1">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-black tracking-wider" style={{ color: '#fbbf24' }}>WOA EXCLUSIVE</h3>
                      <span className="text-[10px] font-black tracking-widest px-2 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>AULAS SEMANAIS</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-white">R$ 196,19</span>
                      <span className="text-blue-200/60 text-sm">/ mês (12x)</span>
                    </div>
                    <p className="text-blue-200/50 text-xs">ou R$ 1.897,00 à vista</p>
                    <p className="text-[11px] leading-relaxed pt-1" style={{ color: 'rgba(251,191,36,0.85)' }}>
                      🎯 Ideal para quem deseja acompanhamento próximo com professores e prática semanal de conversação para acelerar sua evolução.
                    </p>
                  </div>
                  <div className="text-xs text-yellow-300/60 font-bold">🎁 Bônus: 1 ano de acesso ao App WOA Talk (Plano Starter)</div>
                  <div className="space-y-2.5">
                    {[
                      'Aulas semanais de conversação ao vivo em turmas exclusivas',
                      'Prática diária com o App WOA Talk (Plano Starter)',
                      'Acesso à WOA Play com mais de 400 aulas e materiais',
                      'Método WOA: simples, prático e eficiente',
                      'Comunidade e grupo exclusivo para praticar',
                      'Situações reais do dia a dia',
                      '1 ano de acesso ao WOA Exclusive + App',
                    ].map((f, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-sm mt-0.5" style={{ color: '#fbbf24' }}>✓</span>
                        <p className="text-blue-200/80 text-sm">{f}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-7 pb-7">
                  <a
                    href="https://wa.me/556181176884"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => playClick()}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000', boxShadow: '0 0 18px rgba(251,191,36,0.35)' }}
                  >
                    <span>💬</span> Falar no WhatsApp
                  </a>
                </div>
              </div>

            </div>
          </div>

          {/* Payment methods note */}
          <div className="text-center py-4 space-y-2">
            <p className="text-blue-200/40 text-xs">Pagamentos processados com segurança pela <span className="text-blue-200/60 font-bold">Asaas</span></p>
            <p className="text-blue-200/30 text-xs">Pix Automático: após a primeira autorização no seu banco, as mensalidades são debitadas automaticamente.</p>
          </div>

          {/* Benefits */}
          <div className="space-y-6">
            <h3 className="text-2xl font-black text-white text-center">Por que fazer upgrade?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Jornadas Ilimitadas', desc: 'Acesso a todas as jornadas temáticas disponíveis e futuras' },
                { title: 'XP Turbinado', desc: 'Ganhe até 10x mais XP nos desafios premium' },
                { title: 'Comunidade Elite', desc: 'Conecte-se com players de alto nível em uma comunidade premium' },
                { title: 'Recompensas Exclusivas', desc: 'Badges, bônus de moedas e eventos privados todos os meses' },
              ].map((benefit, i) => (
                <div key={i} className="p-6 rounded-xl backdrop-blur-md border border-cyan-400/20" style={{ background: 'rgba(5,14,26,0.65)' }}>
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
                { q: 'Posso cancelar a qualquer momento?', a: 'Sim! Você pode cancelar sua assinatura quando quiser diretamente nessa página, sem cobranças adicionais.' },
                { q: 'Como funciona o Pix Automático?', a: 'No primeiro pagamento, você autoriza o débito no app do seu banco. A partir daí, as mensalidades são debitadas automaticamente sem que você precise pagar um novo QR Code.' },
                { q: 'Quais formas de pagamento são aceitas?', a: 'Cartão de Crédito, Pix Automático e Boleto Bancário. Todos os pagamentos são processados com segurança pela Asaas.' },
                { q: 'Como funciona o trial de 30 dias?', a: 'Ao assinar via Cartão de Crédito ou Pix Automático, você ganha 30 dias grátis com acesso completo. Nenhum valor é debitado agora. A primeira cobrança ocorre automaticamente após 30 dias. Você pode cancelar a qualquer momento antes disso sem custo algum.' },
                { q: 'Qual a diferença entre Starter e Premium?', a: 'O Premium inclui XP turbinado, módulos especiais avançados, moedas mensais extras e comunidade elite.' },
              ].map((faq, i) => (
                <div key={i} className="p-6 rounded-xl backdrop-blur-md border border-cyan-400/20" style={{ background: 'rgba(5,14,26,0.65)' }}>
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

      {/* Checkout Modal */}
      {modalOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)' }}>
          <div
            ref={modalRef}
            className="w-full max-w-lg rounded-2xl overflow-y-auto"
            style={{ background: 'linear-gradient(135deg, #0a1929 0%, #050E1A 100%)', border: '1.5px solid rgba(0,212,255,0.25)', boxShadow: '0 0 60px rgba(0,212,255,0.12)', maxHeight: '92vh' }}
          >

            {/* ── SUCCESS SCREEN ── */}
            {subscriptionSuccess ? (
              <div className="flex flex-col items-center justify-center text-center p-10 space-y-6">
                {/* animated checkmark */}
                <div
                  className="flex items-center justify-center w-20 h-20 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.25) 0%, rgba(34,197,94,0.06) 100%)', border: '2px solid rgba(34,197,94,0.5)', boxShadow: '0 0 40px rgba(34,197,94,0.3)' }}
                >
                  <span className="text-4xl">✅</span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-white tracking-wide">Assinatura ativada!</h3>
                  <p className="text-green-400 font-bold text-sm">Bem-vindo ao {planLabel(selectedPlan)} 🎉</p>
                </div>

                <div
                  className="w-full px-5 py-4 rounded-2xl space-y-1"
                  style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)' }}
                >
                  <p className="text-cyan-300/90 text-sm font-bold">🎁 30 dias grátis ativados</p>
                  <p className="text-blue-200/60 text-xs">
                    Nenhum valor foi cobrado agora. A primeira cobrança do cartão ocorrerá em <span className="text-white font-bold">{successTrialDate}</span>.
                  </p>
                  <p className="text-blue-200/50 text-xs mt-1">Você pode cancelar a qualquer momento antes disso sem custo.</p>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full py-3.5 rounded-xl font-black tracking-widest text-sm transition-all hover:scale-[1.02] active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)', color: 'white', boxShadow: '0 0 24px rgba(34,197,94,0.35)' }}
                >
                  Começar agora →
                </button>

                <p className="text-[10px] text-blue-200/25">Pagamento seguro via Asaas · SSL</p>
              </div>
            ) : (

            /* ── CHECKOUT FORM ── */
            <div className="p-8 space-y-5">

            {/* Modal header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-white tracking-wider">FINALIZAR ASSINATURA</h3>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-cyan-400/70 text-sm">{planLabel(selectedPlan)}</p>
                  {appliedCoupon && selectedPlan && (() => {
                    const planObj = plans.find(p => p.id === selectedPlan)
                    if (!planObj) return null
                    const originalPrice = parseFloat(planObj.price.replace(',', '.'))
                    const discountedPrice = (originalPrice * (1 - appliedCoupon.discount_percent / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    return (
                      <>
                        <span className="text-white/30 text-xs line-through">R$ {planObj.price}</span>
                        <span className="text-green-400 text-sm font-black">R$ {discountedPrice}</span>
                      </>
                    )
                  })()}
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="flex items-center justify-center w-9 h-9 rounded-xl text-blue-200/50 hover:text-white hover:bg-white/10 text-lg font-bold transition-all ml-4 flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Coupon input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">Cupom de Desconto</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Digite o código"
                  value={couponInput}
                  onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponMsg(null); if (!e.target.value) setAppliedCoupon(null) }}
                  maxLength={30}
                  className="flex-1 px-4 py-2.5 rounded-xl text-white placeholder-blue-200/30 text-sm font-mono outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${
                      appliedCoupon ? 'rgba(34,197,94,0.6)'
                      : couponMsg?.type === 'err' ? 'rgba(239,68,68,0.6)'
                      : 'rgba(0,212,255,0.2)'
                    }`,
                  }}
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponValidating || !couponInput.trim()}
                  className="px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all disabled:opacity-40"
                  style={{ background: 'rgba(168,85,247,0.15)', border: '1.5px solid rgba(168,85,247,0.4)', color: '#a855f7' }}
                >
                  {couponValidating ? '...' : 'Aplicar'}
                </button>
              </div>
              {couponMsg && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold"
                  style={{
                    background: couponMsg.type === 'ok' ? 'rgba(34,197,94,0.10)' : 'rgba(239,68,68,0.10)',
                    border: `1px solid ${couponMsg.type === 'ok' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
                    color: couponMsg.type === 'ok' ? '#4ade80' : '#f87171',
                  }}
                >
                  <span>{couponMsg.type === 'ok' ? '✓' : '✕'}</span>
                  {couponMsg.text}
                </div>
              )}
            </div>

            {/* CPF input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">CPF</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => setCpf(formatCpf(e.target.value))}
                maxLength={14}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/30 text-base font-mono outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
              />
            </div>

            {/* Payment method */}
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
                    onClick={() => { setBillingType(opt.value); setCheckoutError('') }}
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
              {(billingType === 'PIX' || billingType === 'CREDIT_CARD') && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)' }}>
                  <span className="text-base">🎁</span>
                  <p className="text-[11px] text-cyan-300/80 leading-relaxed font-bold">
                    30 dias grátis — você não será cobrado agora. A primeira cobrança ocorre em 30 dias.
                  </p>
                </div>
              )}
            </div>

            {/* ── CREDIT CARD FORM ── */}
            {billingType === 'CREDIT_CARD' && (
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-2 pb-1">
                  <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.15)' }} />
                  <span className="text-[10px] font-black tracking-widest text-cyan-400/50">DADOS DO CARTÃO</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.15)' }} />
                </div>

                {/* Card number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">Número do Cartão</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                    maxLength={19}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-base font-mono outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)', letterSpacing: '0.1em' }}
                  />
                </div>

                {/* Card holder */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">Nome no Cartão</label>
                  <input
                    type="text"
                    placeholder="NOME COMO IMPRESSO NO CARTÃO"
                    value={cardHolder}
                    onChange={e => setCardHolder(e.target.value.toUpperCase())}
                    maxLength={60}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-sm font-mono outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
                  />
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">Validade</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="MM/AA"
                      value={formatExpiry(expiryRaw)}
                      onChange={e => setExpiryRaw(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={5}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-base font-mono outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">CVV</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="123"
                      value={ccv}
                      onChange={e => setCcv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      maxLength={4}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-base font-mono outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">Telefone</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={e => {
                      const d = e.target.value.replace(/\D/g, '').slice(0, 11)
                      const fmt = d.length > 6
                        ? `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
                        : d.length > 2 ? `(${d.slice(0,2)}) ${d.slice(2)}` : d
                      setPhone(fmt)
                    }}
                    maxLength={16}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-base font-mono outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
                  />
                </div>

                <div className="flex items-center gap-2 pb-1 pt-1">
                  <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.15)' }} />
                  <span className="text-[10px] font-black tracking-widest text-cyan-400/50">ENDEREÇO DE COBRANÇA</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(0,212,255,0.15)' }} />
                </div>

                {/* CEP */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">CEP</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="00000-000"
                      value={postalCode}
                      onChange={e => {
                        const d = e.target.value.replace(/\D/g, '').slice(0, 8)
                        const fmt = d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d
                        setPostalCode(fmt)
                        if (d.length === 8) lookupCep(d)
                      }}
                      maxLength={9}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-base font-mono outline-none pr-10"
                      style={{ background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${cepError ? 'rgba(239,68,68,0.5)' : 'rgba(0,212,255,0.2)'}` }}
                    />
                    {cepLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/70 text-xs animate-pulse">...</span>
                    )}
                  </div>
                  {cepError && <p className="text-red-400 text-xs font-bold">{cepError}</p>}
                </div>

                {/* Street */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">Rua / Logradouro</label>
                  <input
                    type="text"
                    placeholder="Av. Paulista"
                    value={addressStreet}
                    onChange={e => setAddressStreet(e.target.value)}
                    maxLength={100}
                    className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-sm outline-none"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
                  />
                </div>

                {/* Number + Complement */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">Número</label>
                    <input
                      type="text"
                      placeholder="1000"
                      value={addressNumber}
                      onChange={e => setAddressNumber(e.target.value)}
                      maxLength={20}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">Complemento</label>
                    <input
                      type="text"
                      placeholder="Apto 12 (opcional)"
                      value={addressComplement}
                      onChange={e => setAddressComplement(e.target.value)}
                      maxLength={60}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
                    />
                  </div>
                </div>

                {/* City + State */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">Cidade</label>
                    <input
                      type="text"
                      placeholder="São Paulo"
                      value={addressCity}
                      onChange={e => setAddressCity(e.target.value)}
                      maxLength={60}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-sm outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-blue-200/60 tracking-widest uppercase">UF</label>
                    <input
                      type="text"
                      placeholder="SP"
                      value={addressProvince}
                      onChange={e => setAddressProvince(e.target.value.toUpperCase().slice(0, 2))}
                      maxLength={2}
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-blue-200/25 text-sm font-mono outline-none"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(0,212,255,0.2)' }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {checkoutError && (
              <div
                className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
              >
                <span className="flex-shrink-0">⚠</span>
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Submit */}
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
              {checkoutLoading
                ? 'Processando...'
                : billingType === 'CREDIT_CARD'
                ? '🔒 Assinar com Cartão — 30 dias grátis'
                : 'Continuar para Pagamento →'}
            </button>

            <p className="text-center text-[10px] text-blue-200/25 pb-2">Pagamento seguro via Asaas · SSL · Dados criptografados</p>
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function PremiumPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: 'linear-gradient(to bottom, #050E1A, #0a1929)' }} />}>
      <PremiumPageInner />
    </Suspense>
  )
}
