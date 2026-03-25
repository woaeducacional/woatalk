'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { playClick } from '@/lib/sounds'

type Step = 'email' | 'code'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const codeRefs = useRef<Array<HTMLInputElement | null>>([])

  /* ── Step 1: send code ── */
  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    playClick()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao enviar código.')
        return
      }
      setStep('code')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  /* ── OTP input handling ── */
  function handleCodeChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[i] = digit
    setCode(next)
    if (digit && i < 5) codeRefs.current[i + 1]?.focus()
  }

  function handleCodeKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      codeRefs.current[i - 1]?.focus()
    }
  }

  function handleCodePaste(e: React.ClipboardEvent) {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('')
    if (digits.length === 6) {
      setCode(digits)
      codeRefs.current[5]?.focus()
      e.preventDefault()
    }
  }

  /* ── Step 2: verify code + set new password ── */
  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    playClick()
    setError(null)

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.join(''), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erro ao redefinir senha.')
        return
      }
      setSuccess(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12" style={{ background: '#050E1A' }}>

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image src="/images/fundo_do_mar.png" alt="" fill className="object-cover object-bottom" priority />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(5,14,26,0.88) 0%, rgba(5,14,26,0.65) 40%, rgba(5,14,26,0.85) 100%)' }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)' }} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-block relative mb-3">
            <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ background: 'rgba(0,212,255,0.35)' }} />
            <Image src="/images/logo.png" alt="WOA Talk" width={80} height={80} className="relative rounded-full border-2 border-cyan-400/60" priority />
          </div>
          <h1 className="text-2xl font-black tracking-[0.2em] text-white mt-3" style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>WOA TALK</h1>
          <p className="text-xs text-cyan-400/60 tracking-[0.15em] mt-1">SUA JORNADA ÉPICA NO INGLÊS</p>
        </div>

        <div
          className="rounded-2xl p-6 sm:p-8 space-y-6"
          style={{ background: 'rgba(5,14,26,0.85)', border: '1px solid rgba(0,212,255,0.18)', backdropFilter: 'blur(20px)', boxShadow: '0 0 40px rgba(0,212,255,0.06)' }}
        >
          {success ? (
            /* ── Success ── */
            <div className="text-center space-y-4">
              <div className="text-5xl">✅</div>
              <h2 className="text-xl font-black text-white tracking-wide">Senha redefinida!</h2>
              <p className="text-blue-200/70 text-sm">Sua senha foi atualizada com sucesso. Faça login com a nova senha.</p>
              <Link
                href="/auth/signin"
                onClick={() => playClick()}
                className="block w-full text-center py-3 rounded-lg font-black text-sm tracking-widest text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #003AB0, #00D4FF)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
              >
                ⚔️ FAZER LOGIN
              </Link>
            </div>
          ) : step === 'email' ? (
            /* ── Step 1: Email ── */
            <form onSubmit={handleSendCode} className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white tracking-wide">ESQUECI MINHA SENHA</h2>
                <p className="text-blue-200/60 text-sm mt-1">Digite seu email e enviaremos um código de 6 dígitos para você.</p>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm font-medium" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', color: '#fca5a5' }}>
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-widest text-cyan-400/70">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/25 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,255,0.25)', }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.6)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.25)')}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-black text-sm tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #003AB0, #00D4FF)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
              >
                {loading ? 'ENVIANDO...' : '📧 ENVIAR CÓDIGO'}
              </button>

              <p className="text-center text-sm text-blue-300/70">
                Lembrou a senha?{' '}
                <Link href="/auth/signin" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                  Fazer login
                </Link>
              </p>
            </form>
          ) : (
            /* ── Step 2: Code + New Password ── */
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-white tracking-wide">REDEFINIR SENHA</h2>
                <p className="text-blue-200/60 text-sm mt-1">
                  Enviamos um código para <span className="text-cyan-400 font-semibold">{email}</span>. Digite-o abaixo com sua nova senha.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-lg text-sm font-medium" style={{ background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.4)', color: '#fca5a5' }}>
                  ⚠️ {error}
                </div>
              )}

              {/* 6-digit code input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-widest text-cyan-400/70">CÓDIGO DE 6 DÍGITOS</label>
                <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { codeRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      className="w-12 h-14 text-center text-2xl font-black text-white rounded-lg outline-none transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: `2px solid ${digit ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'}`,
                        boxShadow: digit ? '0 0 16px rgba(255,255,255,0.5), inset 0 0 8px rgba(255,255,255,0.1)' : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-widest text-cyan-400/70">NOVA SENHA</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 pr-12 rounded-lg text-sm text-white placeholder-white/25 outline-none transition-all"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,255,0.25)' }}
                    onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.6)')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.25)')}
                  />
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-sm">
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold tracking-widest text-cyan-400/70">CONFIRMAR SENHA</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-lg text-sm text-white placeholder-white/25 outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,212,255,0.25)' }}
                  onFocus={e => (e.target.style.borderColor = 'rgba(0,212,255,0.6)')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,212,255,0.25)')}
                />
              </div>

              <button
                type="submit"
                disabled={loading || code.some(d => !d)}
                className="w-full py-3 rounded-lg font-black text-sm tracking-widest text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #003AB0, #00D4FF)', boxShadow: '0 0 20px rgba(0,212,255,0.3)' }}
              >
                {loading ? 'SALVANDO...' : '🔐 REDEFINIR SENHA'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('email'); setError(null); setCode(['','','','','','']) }}
                className="w-full text-xs text-blue-200/50 hover:text-blue-200/80 transition-colors py-1"
              >
                ← Usar outro email
              </button>
            </form>
          )}
        </div>

        <p className="text-center">
          <Link href="/" className="text-xs text-blue-200/40 hover:text-blue-200/70 tracking-widest transition-colors">
            ← VOLTAR AO INÍCIO
          </Link>
        </p>
      </div>
    </main>
  )
}
