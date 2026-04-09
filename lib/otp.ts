/**
 * Sistema de OTP (One-Time Password) para validação de email
 * Armazena códigos no Supabase (funciona em produção serverless)
 * Código de 6 dígitos válido por 10 minutos
 */

import { supabase } from '@/src/lib/supabaseClient'

/**
 * Gera um código OTP de 6 dígitos
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Armazena o código OTP para um email no banco de dados
 */
export async function storeOTP(email: string, code: string, expirationMinutes: number = 10): Promise<void> {
  if (!supabase) {
    console.error('Supabase not configured for OTP storage')
    return
  }

  const normalizedEmail = email.toLowerCase().trim()
  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('otp_codes')
    .upsert(
      {
        email: normalizedEmail,
        code,
        expires_at: expiresAt,
        attempts: 0,
      },
      { onConflict: 'email' }
    )

  if (error) {
    console.error('Failed to store OTP:', error)
  }
}

/**
 * Verifica se o código OTP é válido
 */
export async function verifyOTP(email: string, code: string): Promise<{ valid: boolean; message: string }> {
  if (!supabase) {
    return { valid: false, message: 'Sistema indisponível' }
  }

  const normalizedEmail = email.toLowerCase().trim()

  const { data: storedOTP, error } = await supabase
    .from('otp_codes')
    .select('code, expires_at, attempts')
    .eq('email', normalizedEmail)
    .single()

  if (error || !storedOTP) {
    return { valid: false, message: 'Nenhum código enviado para este email' }
  }

  // Verifica expiração
  if (new Date() > new Date(storedOTP.expires_at)) {
    await deleteOTP(normalizedEmail)
    return { valid: false, message: 'Código expirado. Solicite um novo código' }
  }

  // Verifica tentativas máximas (5 tentativas)
  if (storedOTP.attempts >= 5) {
    await deleteOTP(normalizedEmail)
    return { valid: false, message: 'Muitas tentativas. Solicite um novo código' }
  }

  // Valida o código
  if (storedOTP.code === code) {
    await deleteOTP(normalizedEmail)
    return { valid: true, message: 'Email verificado com sucesso' }
  }

  // Incrementa tentativas
  await supabase
    .from('otp_codes')
    .update({ attempts: storedOTP.attempts + 1 })
    .eq('email', normalizedEmail)

  const remainingAttempts = 5 - (storedOTP.attempts + 1)

  return {
    valid: false,
    message: `Código inválido. ${remainingAttempts} tentativa(s) restante(s)`,
  }
}

/**
 * Remove OTP de um email
 */
export async function deleteOTP(email: string): Promise<void> {
  if (!supabase) return
  const normalizedEmail = email.toLowerCase().trim()
  await supabase.from('otp_codes').delete().eq('email', normalizedEmail)
}

/**
 * Verifica se há OTP pendente para um email.
 * Retorna true apenas se o código foi gerado há menos de 1 minuto (anti-spam).
 * Após 1 minuto o usuário pode re-solicitar (o upsert substituirá o registro).
 */
export async function hasOTPPending(email: string): Promise<boolean> {
  if (!supabase) return false
  const normalizedEmail = email.toLowerCase().trim()

  const { data, error } = await supabase
    .from('otp_codes')
    .select('created_at, expires_at')
    .eq('email', normalizedEmail)
    .single()

  if (error || !data) return false

  // OTP já expirou — não bloquear
  if (new Date() > new Date(data.expires_at)) return false

  // Bloquear re-envio apenas dentro do cooldown de 60 segundos
  const createdAt = new Date(data.created_at)
  const cooldownMs = 60 * 1000
  return Date.now() - createdAt.getTime() < cooldownMs
}

/**
 * Verifica se o email do usuário ainda não foi confirmado.
 * Retorna true se houver um OTP não expirado no banco (indica que não verificou).
 */
export async function hasUnverifiedEmail(email: string): Promise<boolean> {
  if (!supabase) return false
  const normalizedEmail = email.toLowerCase().trim()

  const { data, error } = await supabase
    .from('otp_codes')
    .select('expires_at')
    .eq('email', normalizedEmail)
    .single()

  if (error || !data) return false
  return new Date() <= new Date(data.expires_at)
}
