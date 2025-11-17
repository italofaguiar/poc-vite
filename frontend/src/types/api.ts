export interface User {
  id: number
  email: string
  created_at: string
}

export interface AuthResponse {
  message: string
  user?: {
    email: string
  }
}

export interface ChartDataPoint {
  date: string
  value: number
}

export interface TableRow {
  id: number
  nome: string
  status: 'Ativo' | 'Pendente' | 'Inativo'
  valor: number
}

export interface DashboardData {
  user_email: string
  chart_data: ChartDataPoint[]
  table_data: TableRow[]
}

export interface MeResponse {
  email: string
}
