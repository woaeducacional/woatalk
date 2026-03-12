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

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dbStatus, setDbStatus] = useState<'supabase' | 'fallback' | 'unknown'>('unknown')

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

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  async function onSubmit(data: SignInInput) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (!result?.ok) {
        setError('Email ou senha incorretos')
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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-b from-blue-950 to-blue-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <Image 
              src="/images/logo.png" 
              alt="WOA Talk Logo" 
              width={180} 
              height={180}
              priority
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fazer Login</CardTitle>
            <CardDescription>Acesse sua conta para continuar aprendendo</CardDescription>
          </CardHeader>
          <CardContent>
            {dbStatus === 'fallback' && (
              <div className="mb-4 p-3 rounded-md bg-yellow-500 bg-opacity-10 border border-yellow-500 text-yellow-400 text-sm">
                ⚠️ Usando banco de dados em memória. Configure Supabase em .env.local para persistência.
              </div>
            )}

            <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
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
                Entrar
              </Button>

              <p className="text-center text-sm text-blue-300">
                Não tem uma conta?{' '}
                <a href="/auth/signup" className="text-orange-500 hover:text-orange-400 font-semibold">
                  Cadastrar-se
                </a>
              </p>
            </Form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
