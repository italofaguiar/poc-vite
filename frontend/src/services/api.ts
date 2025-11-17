import axios from 'axios'
import type { AuthResponse, MeResponse, DashboardData } from '../types/api'
import { dashboardDataSchema, userResponseSchema } from '../schemas/dashboard'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: '/', // Proxy handles routing to backend
  withCredentials: true, // Required to send cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth API functions
export const signup = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/signup', { email, password })
  return response.data
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/login', { email, password })
  return response.data
}

export const logout = async (): Promise<{ message: string }> => {
  const response = await api.post<{ message: string }>('/api/auth/logout')
  return response.data
}

export const getMe = async (): Promise<MeResponse> => {
  const response = await api.get<MeResponse>('/api/auth/me')
  // Validate response with Zod
  const validatedData = userResponseSchema.parse(response.data)
  return validatedData
}

// Dashboard API functions
export const getDashboardData = async (): Promise<DashboardData> => {
  const response = await api.get<DashboardData>('/api/dashboard/data')
  // Validate response with Zod
  const validatedData = dashboardDataSchema.parse(response.data)
  return validatedData
}

export default api
