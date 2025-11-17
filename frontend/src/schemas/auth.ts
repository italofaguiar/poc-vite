import { z } from 'zod'

// Email validation schema
export const emailSchema = z
  .string()
  .min(1, 'Email e obrigatorio')
  .email('Email invalido')

// Password validation schema
export const passwordSchema = z
  .string()
  .min(6, 'Senha deve ter no minimo 6 caracteres')

// Signup form validation schema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

// Login form validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Senha e obrigatoria'),
})

// Types inferred from schemas
export type SignupFormData = z.infer<typeof signupSchema>
export type LoginFormData = z.infer<typeof loginSchema>
