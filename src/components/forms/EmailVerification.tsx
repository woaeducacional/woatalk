'use client'

import { useState, useRef } from 'react'
import { Button } from '@/src/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/src/components/ui/Card'
import { Input } from '@/src/components/ui/Input'

interface EmailVerificationProps {
  email: string
  onVerificationComplete: () => void
  onBackClick?: () => void
}

export function EmailVerification({ email, onVerificationComplete, onBackClick }: EmailVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCodeSent, setIsCodeSent] = useState(true)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Lidar com mudanças nos inputs
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Apenas números

    const newCode = [...code]
    newCode[index] = value

    // Se digitou um número e não é o último input, move para próximo
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    setCode(newCode)
  }

  // Lidar com backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const newCode = [...code]
      newCode[index] = ''
      setCode(newCode)

      // Move para input anterior se estiver vazio
      if (index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  // Verificar código
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullCode = code.join('')

    if (fullCode.length !== 6) {
      setError('Por favor, insira o código completo')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: fullCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erro ao verificar código')
        // Limpar inputs em caso de erro
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
        return
      }

      // Sucesso!
      onVerificationComplete()
    } catch (err) {
      setError('Erro ao conectar ao servidor')
    } finally {
      setIsLoading(false)
    }
  }

  // Reenviar código
  const handleResendCode = async () => {
    setResendLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Erro ao reenviar código')
        return
      }

      // Iniciar cooldown de 60 segundos
      setResendCooldown(60)
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } catch (err) {
      setError('Erro ao conectar ao servidor')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Verifique seu Email</CardTitle>
        <CardDescription>
          Enviamos um código de 6 dígitos para <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="p-3 rounded-md bg-red-500 bg-opacity-10 border border-red-500 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Inputs para OTP */}
          <div className="flex gap-2 justify-center">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                placeholder="0"
                className="w-12 h-12 text-center text-2xl font-bold border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-400"
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Botão de verificação */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || code.some((digit) => !digit)}
          >
            {isLoading ? 'Verificando...' : 'Verificar Código'}
          </Button>

          {/* Reenviar código */}
          <div className="text-center space-y-2">
            <p className="text-sm text-blue-300">Não recebeu o código?</p>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resendLoading || resendCooldown > 0}
              className="text-blue-400 hover:text-blue-300 disabled:text-blue-600 text-sm font-medium transition-colors"
            >
              {resendCooldown > 0
                ? `Reenviar em ${resendCooldown}s`
                : resendLoading
                  ? 'Reenviando...'
                  : 'Reenviar código'}
            </button>
          </div>

          {/* Voltar */}
          {onBackClick && (
            <button
              type="button"
              onClick={onBackClick}
              className="w-full text-center text-sm text-blue-300 hover:text-blue-200 transition-colors"
            >
              Voltar
            </button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
