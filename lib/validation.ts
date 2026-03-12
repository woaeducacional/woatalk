import { z } from 'zod'

export const signUpSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter um número'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não correspondem',
  path: ['confirmPassword'],
})

export const signInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const verifyEmailSchema = z.object({
  email: z.string().email('Email inválido'),
  code: z
    .string()
    .trim()
    .length(6, 'Código deve ter 6 dígitos')
    .regex(/^\d{6}$/, 'Código deve conter apenas dígitos'),
})

export const sendCodeSchema = z.object({
  email: z.string().email('Email inválido'),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type SignInInput = z.infer<typeof signInSchema>
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>
export type SendCodeInput = z.infer<typeof sendCodeSchema>
