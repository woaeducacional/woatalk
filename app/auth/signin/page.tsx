'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import Image from 'next/image'

import { signInSchema, type SignInInput } from '@/lib/validation'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/src/components/ui/Form'
import { Input } from '@/src/components/ui/Input'
import { playClick } from '@/lib/sounds'

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<'supabase' | 'fallback' | 'unknown'>('unknown')
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('registered') === 'true') {
      setSuccess('Conta criada com sucesso! Faça login para continuar.')
    }
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health')
        const data = await response.json()
        setDbStatus(data.database === 'supabase' ? 'supabase' : 'fallback')
      } catch (err) {
        setDbStatus('unknown')
      }
    }
    checkHealth()
  }, [])
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: SignInInput) {
    playClick()
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (!result?.ok) {
        const errMsg = result?.error ?? ''
        if (errMsg.startsWith('EMAIL_NOT_VERIFIED:')) {
          setUnverifiedEmail(errMsg.replace('EMAIL_NOT_VERIFIED:', ''))
          setError(null)
        } else {
          setError('Email ou senha incorretos')
          setUnverifiedEmail(null)
        }
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Erro ao conectar ao servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const benefits = [
    { icon: '⏱', text: 'Continue seu progresso' },
    { icon: '🏆', text: 'Salve suas conquistas' },
    { icon: '📊', text: 'Acompanhe seu XP' },
    { icon: '👥', text: 'Participe da comunidade' },
    { icon: '🌊', text: 'Desbloqueie novos oceanos' },
  ]

  return (
    <main className="min-h-screen relative overflow-x-hidden" style={{ background: '#050E1A' }}>

      {/* ── Split Background ── */}
      <div className="fixed inset-0 z-0">
        {/* Left half — ocean */}
        <div className="absolute inset-0" style={{ right: '50%' }}>
          <Image src="/images/plano-de-fundo-mar.png" alt="Oceano" fill className="object-cover object-right" priority />
        </div>
        {/* Right half — terra */}
        <div className="absolute inset-0" style={{ left: '50%' }}>
          <Image src="/images/plano-de-fundo-terra.png" alt="Terra" fill className="object-cover object-left" priority />
        </div>
        {/* Centre blend */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to right, rgba(5,14,26,0) 30%, rgba(5,14,26,0.55) 50%, rgba(5,14,26,0) 70%)'
        }} />
        {/* Bottom dark area for cards */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(5,14,26,0) 25%, rgba(5,14,26,0.80) 55%, rgba(5,14,26,0.95) 100%)'
        }} />
      </div>

      {/* ── Page content ── */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 sm:px-10 py-4">
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 shrink-0">
              <div className="absolute inset-0 rounded-full blur-lg bg-cyan-400/50" />
              <Image src="/images/logo.png" alt="WOA Talk" fill className="relative rounded-full border-2 border-cyan-400/70 object-cover" />
            </div>
            <span className="text-sm font-black tracking-[0.2em] text-white" style={{ textShadow: '0 0 12px rgba(0,212,255,0.6)' }}>
              WOA TALK
            </span>
          </div>
          <a href="/" className="text-xs text-blue-200/60 hover:text-white tracking-widest transition-colors flex items-center gap-1">
            ← VOLTAR PARA INÍCIO
          </a>
        </div>

        {/* ── Cards row — vertically centered ── */}
        <div className="flex-1 flex items-center px-4 sm:px-8 py-10">
          <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* ── LEFT: Form card ── */}
            <div className="rounded-2xl p-7 backdrop-blur-md" style={{ background: 'rgba(5,14,26,0.82)', border: '1px solid rgba(255,255,255,0.10)' }}>
              <h2 className="text-2xl font-black text-white mb-1 leading-tight">CONTINUE<br />SUA JORNADA</h2>
              <p className="text-blue-200/60 text-sm mb-6">Acesse sua conta e continue evoluindo.</p>

              {dbStatus === 'fallback' && (
                <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/40 text-yellow-400 text-xs">
                  ⚠️ Banco em memória. Configure Supabase no .env.local.
                </div>
              )}

              <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
                {success && (
                  <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-400/50 text-green-300 text-sm">
                    ✅ {success}
                  </div>
                )}
                {unverifiedEmail && (
                  <div className="mb-4 p-4 rounded-xl space-y-3" style={{ background: 'rgba(234,179,8,0.1)', border: '2px solid rgba(234,179,8,0.5)' }}>
                    <p className="font-black tracking-widest text-yellow-300 text-sm">📧 EMAIL NÃO VERIFICADO</p>
                    <p className="text-yellow-200/80 text-xs">Confirme seu email e insira o código de 6 dígitos.</p>
                    <a
                      href={`/auth/signup?email=${encodeURIComponent(unverifiedEmail)}&verify=1`}
                      className="block w-full text-center font-black tracking-widest py-3 rounded-xl text-white transition-all hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #b45309, #eab308)' }}
                    >
                      → INSERIR CÓDIGO
                    </a>
                  </div>
                )}
                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-400/50 text-white text-sm">
                    ⚠️ {error}
                  </div>
                )}

                <FormField
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="seu@email.com" error={fieldState.error?.message} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Senha</FormLabel>
                        <a href="/auth/forgot-password" className="text-[11px] text-blue-300/50 hover:text-cyan-400 transition-colors">
                          Esqueci minha senha
                        </a>
                      </div>
                      <FormControl>
                        <Input {...field} type="password" placeholder="••••••••••" error={fieldState.error?.message} />
                      </FormControl>
                      <FormMessage>{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 font-black tracking-widest text-sm rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98] mt-2"
                  style={{ background: 'linear-gradient(135deg, #FF6B00, #FF9A00)', boxShadow: '0 4px 20px rgba(255,107,0,0.4)' }}
                >
                  {isLoading ? 'ENTRANDO...' : '🔑 CONTINUAR MINHA JORNADA'}
                </button>

                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-blue-300/40">ou</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <button
                  type="button"
                  onClick={() => { playClick(); signIn('google', { callbackUrl: '/dashboard' }) }}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-bold text-sm text-white/90 transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.1-11.4-7.6L6 33.7C9.4 39.8 16.2 44 24 44z"/>
                    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C37.1 38.4 44 33 44 24c0-1.3-.1-2.6-.4-3.9z"/>
                  </svg>
                  Entrar com Google
                </button>

                <p className="text-center text-sm text-blue-300/60 mt-4">
                  Não tem uma conta?{' '}
                  <a href="/auth/signup" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                    Criar conta
                  </a>
                </p>
              </Form>
            </div>

            {/* ── RIGHT column ── */}
            <div className="flex flex-col gap-5">

              {/* Benefits card */}
              <div className="rounded-2xl p-7 backdrop-blur-md flex flex-col gap-4" style={{ background: 'rgba(5,14,26,0.82)', border: '1px solid rgba(255,255,255,0.10)' }}>
                <h3 className="text-lg font-black text-white leading-tight">POR QUE CRIAR<br />UMA CONTA?</h3>
                <ul className="flex flex-col gap-3">
                  {benefits.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 text-blue-100/80 text-sm">
                      <span className="text-lg shrink-0">{b.icon}</span>
                      {b.text}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Social proof card */}
              <div className="rounded-2xl px-6 backdrop-blur-md flex items-center gap-4" style={{ background: 'rgba(5,14,26,0.82)', border: '1px solid rgba(255,255,255,0.10)', minHeight: '7rem' }}>
                <div className="w-12 h-12 rounded-full border-2 border-cyan-400/40 overflow-hidden relative shrink-0">
                  <Image src="/images/logo.png" alt="aluno" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-white font-black text-xl leading-tight">+10.000</p>
                  <p className="text-blue-200/55 text-sm leading-snug mt-0.5">ALUNOS JÁ INICIARAM SUA JORNADA</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </div>
    </main>
  )
}

