'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

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
