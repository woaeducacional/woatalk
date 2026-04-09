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
import { Button } from '@/src/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/src/components/ui/Card'
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

  return (
    <main className="min-h-screen relative flex flex-col items-center justify-center px-4 py-12" style={{ background: '#050E1A' }}>

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/fundo_do_mar.png"
          alt="Fundo do Mar"
          fill
          className="object-cover object-bottom"
          priority
        />
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to bottom, rgba(5,14,26,0.88) 0%, rgba(5,14,26,0.65) 40%, rgba(5,14,26,0.85) 100%)'
        }} />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00D4FF 2px, #00D4FF 3px)'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">

        {/* Logo + Title */}
        <div className="text-center">
          <div className="inline-block relative mb-3">
            <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ background: 'rgba(0,212,255,0.35)' }} />
            <Image
              src="/images/logo.png"
              alt="WOA Talk"
              width={80}
              height={80}
              className="relative rounded-full border-2 border-cyan-400/60"
              priority
            />
          </div>
          <h1 className="text-2xl font-black tracking-[0.2em] text-white mt-3"
            style={{ textShadow: '0 0 20px rgba(0,212,255,0.5)' }}>WOA TALK</h1>
          <p className="text-xs text-cyan-400/60 tracking-[0.15em] mt-1">SUA JORNADA ÉPICA NO INGLÊS</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>FAZER LOGIN</CardTitle>
            <CardDescription>Acesse sua conta e continue sua missão</CardDescription>
          </CardHeader>
          <CardContent>
            {dbStatus === 'fallback' && (
              <div className="mb-4 p-3 rounded-md bg-yellow-500 bg-opacity-10 border border-yellow-500 text-yellow-400 text-sm">
                ⚠️ Usando banco de dados em memória. Configure Supabase em .env.local para persistência.
              </div>
            )}

            <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
              {success && (
                <div className="mb-4 p-4 rounded-lg bg-green-500 bg-opacity-20 border-2 border-green-400 text-green-300 font-medium text-base">
                  ✅ {success}
                </div>
              )}
              {unverifiedEmail && (
                <div className="mb-4 p-4 rounded-xl space-y-3" style={{ background: 'rgba(234,179,8,0.1)', border: '2px solid rgba(234,179,8,0.5)' }}>
                  <p className="font-black tracking-widest text-yellow-300 text-sm">📧 EMAIL NÃO VERIFICADO</p>
                  <p className="text-yellow-200/80 text-sm">
                    Você precisa confirmar seu email antes de acessar a plataforma.<br />
                    Verifique sua caixa de entrada e insira o código de 6 dígitos.
                  </p>
                  <a
                    href={`/auth/signup?email=${encodeURIComponent(unverifiedEmail)}&verify=1`}
                    className="block w-full text-center font-black tracking-widest py-3 rounded-xl text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #b45309, #eab308)', boxShadow: '0 0 20px rgba(234,179,8,0.3)' }}
                  >
                    → INSERIR CÓDIGO DE VERIFICAÇÃO
                  </a>
                </div>
              )}
              {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-500 bg-opacity-20 border-2 border-red-400 text-red-300 font-medium text-base">
                  <div>⚠️ {error}</div>
                  <div className="text-sm text-red-200 mt-1">Verifique seus dados e tente novamente</div>
                </div>
              )}

              <FormField
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="seu@email.com"
                        error={fieldState.error?.message}
                      />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                name="password"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        error={fieldState.error?.message}
                      />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" loading={isLoading}>
                ⚔️ ENTRAR NA MISSÃO
              </Button>

              <div className="flex items-center justify-between text-sm">
                <p className="text-blue-300/70">
                  Não tem uma conta?{' '}
                  <a href="/auth/signup" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                    Criar conta
                  </a>
                </p>
                <a href="/auth/forgot-password" className="text-blue-300/50 hover:text-cyan-400 transition-colors text-xs">
                  Esqueci a senha
                </a>
              </div>
            </Form>
          </CardContent>
        </Card>

        {/* Back to home */}
        <p className="text-center">
          <a href="/" className="text-xs text-blue-200/40 hover:text-blue-200/70 tracking-widest transition-colors">
            ← VOLTAR AO INÍCIO
          </a>
        </p>
      </div>
    </main>
  )
}
