/**
 * Centralized type exports for the application.
 *
 * This file serves as the single source of truth for all TypeScript types
 * used throughout the frontend application.
 */

// Re-export all API-related types
export type {
  User,
  AuthResponse,
  ChartDataPoint,
  TableRow,
  DashboardData,
  MeResponse,
} from './api'

/**
 * Represents the possible states of an asynchronous operation.
 *
 * @template T - The type of data returned on success
 *
 * @example
 * ```typescript
 * const [state, setState] = useState<AsyncState<DashboardData>>({ status: 'idle' })
 * ```
 */
export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

/**
 * Represents the structure of API error responses from FastAPI.
 *
 * FastAPI returns errors in a consistent format with a 'detail' field
 * that can be either a string or an array of validation errors.
 */
export interface ApiError {
  detail: string | Array<{
    loc: string[]
    msg: string
    type: string
  }>
}

/**
 * Type guard to check if an error is an API error from Axios.
 *
 * @param error - The error object to check
 * @returns true if the error is an Axios error with a response
 *
 * @example
 * ```typescript
 * try {
 *   await login(email, password)
 * } catch (err) {
 *   if (isApiError(err)) {
 *     console.error(err.response.data.detail)
 *   }
 * }
 * ```
 */
export function isApiError(error: unknown): error is {
  response: {
    status: number
    data: ApiError
  }
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as { response?: unknown }).response === 'object' &&
    (error as { response: object }).response !== null &&
    'data' in (error as { response: object }).response
  )
}

/**
 * Helper function to extract error message from various error types.
 *
 * @param error - The error object
 * @param fallback - Fallback message if error cannot be parsed
 * @returns A user-friendly error message
 */
export function getErrorMessage(error: unknown, fallback = 'Erro desconhecido'): string {
  if (isApiError(error)) {
    const { detail } = error.response.data
    if (typeof detail === 'string') {
      return detail
    }
    // If detail is an array of validation errors, return the first one
    if (Array.isArray(detail) && detail.length > 0 && detail[0]) {
      return detail[0].msg
    }
  }
  return fallback
}
