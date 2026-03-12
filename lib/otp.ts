/**
 * Sistema de OTP (One-Time Password) para validação de email
 * Gera código de 6 dígitos válido por 10 minutos
 */

interface OTPStore {
  [email: string]: {
    code: string
    expiresAt: number
    attempts: number
  }
}

// Usar globalThis para persistir entre hot reloads em desenvolvimento
const getOTPStorage = () => {
  if (!globalThis.otpStorage) {
    globalThis.otpStorage = {} as OTPStore
  }
  return globalThis.otpStorage as OTPStore
}

/**
 * Gera um código OTP de 6 dígitos
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Armazena o código OTP para um email
 * @param email Email do usuário
 * @param code Código OTP de 6 dígitos
 * @param expirationMinutes Tempo de expiração em minutos (padrão: 10)
 */
export function storeOTP(email: string, code: string, expirationMinutes: number = 10): void {
  const normalizedEmail = email.toLowerCase().trim()
  const otpStorage = getOTPStorage()
  
  otpStorage[normalizedEmail] = {
    code,
    expiresAt: Date.now() + expirationMinutes * 60 * 1000,
    attempts: 0,
  }
}

/**
 * Verifica se o código OTP é válido
 * @param email Email do usuário
 * @param code Código fornecido
 * @returns { valid: boolean, message: string }
 */
export function verifyOTP(email: string, code: string): { valid: boolean; message: string } {
  const normalizedEmail = email.toLowerCase().trim()
  const otpStorage = getOTPStorage()
  const storedOTP = otpStorage[normalizedEmail]

  if (!storedOTP) {
    return { valid: false, message: 'Nenhum código enviado para este email' }
  }

  // Verifica expiração
  if (Date.now() > storedOTP.expiresAt) {
    delete otpStorage[normalizedEmail]
    return { valid: false, message: 'Código expirado. Solicite um novo código' }
  }

  // Verifica tentativas máximas (5 tentativas)
  if (storedOTP.attempts >= 5) {
    delete otpStorage[normalizedEmail]
    return { valid: false, message: 'Muitas tentativas. Solicite um novo código' }
  }

  // Valida o código
  if (storedOTP.code === code) {
    delete otpStorage[normalizedEmail]
    return { valid: true, message: 'Email verificado com sucesso' }
  }

  // Incrementa tentativas
  storedOTP.attempts += 1
  const remainingAttempts = 5 - storedOTP.attempts

  return {
    valid: false,
    message: `Código inválido. ${remainingAttempts} tentativa(s) restante(s)`,
  }
}

/**
 * Remove OTP de um email (limpeza)
 */
export function deleteOTP(email: string): void {
  const normalizedEmail = email.toLowerCase().trim()
  const otpStorage = getOTPStorage()
  delete otpStorage[normalizedEmail]
}

/**
 * Verifica se há OTP pendente para um email
 */
export function hasOTPPending(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()
  const otpStorage = getOTPStorage()
  const storedOTP = otpStorage[normalizedEmail]
  if (!storedOTP) return false
  return Date.now() <= storedOTP.expiresAt
}
