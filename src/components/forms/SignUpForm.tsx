'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'

import { signUpSchema, type SignUpInput } from '@/lib/validation'
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
import { EmailVerification } from './EmailVerification'
import { playClick } from '@/lib/sounds'

/** Altere para `true` para ativar verificação de email com código de 6 dígitos */
const ENABLE_EMAIL_VERIFICATION = true

export function SignUpForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<'supabase' | 'fallback' | 'unknown'>('unknown')
  const [step, setStep] = useState<'signup' | 'verify'>('signup') // signup ou verify
  const [registeredEmail, setRegisteredEmail] = useState<string>('')

  useEffect(() => {
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

    // Se vier de /auth/signin via redirect de e-mail não verificado, pular para step verify
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    const verifyParam = params.get('verify')
    if (emailParam && verifyParam === '1') {
      setRegisteredEmail(decodeURIComponent(emailParam))
      setStep('verify')
    }
  }, [])

  const form = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: SignUpInput) {
    playClick()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        setError(errorData.error || 'Erro ao criar conta')
        return
      }

      const responseData = await response.json()

      // Conta criada — ir para verificação de email (se habilitado)
      if (ENABLE_EMAIL_VERIFICATION && responseData.requiresVerification) {
        setRegisteredEmail(data.email)
        setStep('verify')
      } else {
        // Desativado temporariamente: pula direto para signin
        router.push('/auth/signin?registered=true')
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerificationComplete = () => {
    // Email verificado — redirecionar para signin
    router.push('/auth/signin?registered=true')
  }

  const handleBackToSignUp = () => {
    setStep('signup')
    setRegisteredEmail('')
    setError(null)
  }

  // Etapa 1: Formulário de Signup
  if (step === 'signup') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>CRIAR CONTA</CardTitle>
          <CardDescription>Comece sua jornada no WOA Talk</CardDescription>
        </CardHeader>
        <CardContent>
          {dbStatus === 'fallback' && (
            <div className="mb-4 p-3 rounded-md bg-yellow-500 bg-opacity-10 border border-yellow-500 text-yellow-400 text-sm">
              ⚠️ Usando banco de dados em memória. Configure Supabase em .env.local para persistência.
            </div>
          )}

          <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
            {error && (
              <div className="p-3 rounded-md bg-red-500 bg-opacity-10 border border-red-500 text-red-400 text-sm">
                {error}
              </div>
            )}

            <FormField
              name="name"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Seu nome"
                      error={fieldState.error?.message}
                    />
                  </FormControl>
                  <FormMessage>{fieldState.error?.message}</FormMessage>
                </FormItem>
              )}
            />

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

            <FormField
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Confirmar Senha</FormLabel>
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
              🌊 INICIAR JORNADA
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-blue-300/40 tracking-widest">OU</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google Sign-Up */}
            <button
              type="button"
              onClick={() => { playClick(); signIn('google', { callbackUrl: '/dashboard' }) }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-bold tracking-widest text-sm text-white/90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.1-11.4-7.6L6 33.7C9.4 39.8 16.2 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C37.1 38.4 44 33 44 24c0-1.3-.1-2.6-.4-3.9z"/>
              </svg>
              CADASTRAR COM GOOGLE
            </button>

            <p className="text-center text-sm text-blue-300/70">
              Já tem uma conta?{' '}
              <a href="/auth/signin" className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                Faça login
              </a>
            </p>
          </Form>
        </CardContent>
      </Card>
    )
  }

  // Etapa 2: Verificação de Email
  if (step === 'verify') {
    return (
      <EmailVerification
        email={registeredEmail}
        onVerificationComplete={handleVerificationComplete}
        onBackClick={handleBackToSignUp}
      />
    )
  }
}
