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

// Types inferred from schemas
export type SignupFormData = z.infer<ReturnType<typeof createSignupSchema>>
export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>
