import axios, { type AxiosInstance } from 'axios'
import { getCookie } from '@/lib/utils'
import {
  PermissionError,
  NotFoundError,
  ValidationError,
  NetworkError,
} from './types'

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete'])

function parseFieldErrors(data: unknown): Record<string, string> | undefined {
  if (typeof data !== 'object' || data === null) return undefined
  const d = data as Record<string, unknown>
  // Frappe sometimes embeds field errors in exc or _server_messages
  if (typeof d.exc === 'string') {
    try {
      // exc is a JSON-serialized Python traceback string — not structured field errors
      // field-level errors come via the message field
    } catch {
      // ignore
    }
  }
  return undefined
}

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: '/',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  // Attach CSRF token to every mutating request
  instance.interceptors.request.use((config) => {
    const method = config.method?.toLowerCase() ?? ''
    if (MUTATING_METHODS.has(method)) {
      const csrf = getCookie('X-Frappe-CSRF-Token')
      if (csrf) {
        config.headers['X-Frappe-CSRF-Token'] = csrf
      }
    }
    return config
  })

  // Handle error responses
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!error.response) {
        // Network / timeout error
        throw new NetworkError(error.message)
      }

      const { status, data } = error.response as { status: number; data: unknown }
      const message =
        typeof data === 'object' && data !== null && 'message' in data
          ? String((data as Record<string, unknown>).message)
          : undefined

      if (status === 401) {
        const redirect = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?redirect=${redirect}`
        return new Promise(() => {
          // Never resolves — navigation is in progress
        })
      }

      if (status === 403) {
        throw new PermissionError(message)
      }

      if (status === 404) {
        throw new NotFoundError(message)
      }

      if (status === 417) {
        // Frappe validation error
        const fieldErrors = parseFieldErrors(data)
        throw new ValidationError(message ?? 'Validation failed', fieldErrors)
      }

      // Re-throw other errors as-is
      throw error
    }
  )

  return instance
}

const apiClient = createClient()

export default apiClient
