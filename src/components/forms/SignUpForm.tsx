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

export function SignUpForm() {
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

      router.push('/auth/signin?registered=true')
    } catch (err) {
      setError('Erro ao conectar ao servidor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Criar Conta</CardTitle>
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
            Criar Conta
          </Button>

          <p className="text-center text-sm text-blue-300">
            Já tem uma conta?{' '}
            <a href="/auth/signin" className="text-orange-500 hover:text-orange-400 font-semibold">
              Faça login
            </a>
          </p>
        </Form>
      </CardContent>
    </Card>
  )
}
