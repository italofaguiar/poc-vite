import { z } from 'zod'
import type { TFunction } from 'i18next'

// Factory function to create email schema with i18n messages
export const createEmailSchema = (t: TFunction) =>
  z
    .string()
    .min(1, t('auth.validation.emailRequired'))
    .email(t('auth.validation.emailInvalid'))

// Factory function to create password schema with i18n messages
export const createPasswordSchema = (t: TFunction) =>
  z
    .string()
    .min(6, t('auth.validation.passwordMinLength'))

// Factory function to create signup schema with i18n messages
export const createSignupSchema = (t: TFunction) => z.object({
  email: createEmailSchema(t),
  password: createPasswordSchema(t),
})

// Factory function to create login schema with i18n messages
export const createLoginSchema = (t: TFunction) => z.object({
  email: createEmailSchema(t),
  password: z.string().min(1, t('auth.validation.passwordRequired')),
})

// Legacy schemas (without i18n) - kept for backward compatibility
export const emailSchema = z
  .string()
  .min(1, 'Email e obrigatorio')
  .email('Email invalido')

export const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter no minimo 6 caracteres')

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha e obrigatoria'),
})

// Types inferred from schemas
export type SignupFormData = z.infer<typeof signupSchema>
export type LoginFormData = z.infer<typeof loginSchema>
