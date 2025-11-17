import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  withCredentials: true, // Required to send cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Auth API functions
export const signup = async (email, password) => {
  const response = await api.post('/api/auth/signup', { email, password })
  return response.data
}

export const login = async (email, password) => {
  const response = await api.post('/api/auth/login', { email, password })
  return response.data
}

export const logout = async () => {
  const response = await api.post('/api/auth/logout')
  return response.data
}

export const getMe = async () => {
  const response = await api.get('/api/auth/me')
  return response.data
}

// Dashboard API functions
export const getDashboardData = async () => {
  const response = await api.get('/api/dashboard/data')
  return response.data
}

export default api
