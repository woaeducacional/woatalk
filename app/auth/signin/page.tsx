'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'

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
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-ocean-100">🌊 WOA Talk</h1>
          <p className="text-ocean-300">Bem-vindo de volta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Fazer Login</CardTitle>
            <CardDescription>Acesse sua conta para continuar aprendendo</CardDescription>
          </CardHeader>
          <CardContent>
            <Form form={form} onSubmit={form.handleSubmit(onSubmit)}>
              {error && (
                <div className="p-3 rounded-md bg-red-500 bg-opacity-10 border border-red-500 text-red-400 text-sm">
                  {error}
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

              <p className="text-center text-sm text-ocean-300">
                Não tem uma conta?{' '}
                <a href="/auth/signup" className="text-ocean-400 hover:text-ocean-300">
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
