import { z } from 'zod'

// Chart data point schema
export const chartDataPointSchema = z.object({
  date: z.string(),
  value: z.number(),
})

// Table row schema
export const tableRowSchema = z.object({
  id: z.number(),
  nome: z.string(),
  status: z.enum(['Ativo', 'Pendente', 'Inativo']),
  valor: z.number(),
})

// Dashboard data schema (API response validation)
export const dashboardDataSchema = z.object({
  user_email: z.string().email(),
  chart_data: z.array(chartDataPointSchema),
  table_data: z.array(tableRowSchema),
})

// User response schema (for /api/auth/me)
export const userResponseSchema = z.object({
  email: z.string().email(),
})

// Types inferred from schemas
export type ChartDataPoint = z.infer<typeof chartDataPointSchema>
export type TableRow = z.infer<typeof tableRowSchema>
export type DashboardData = z.infer<typeof dashboardDataSchema>
export type UserResponse = z.infer<typeof userResponseSchema>
