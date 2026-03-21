import type { AppBootstrap, AuthResponse, ProfileSetting, SignupPayload, WorkerProfile } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const TOKEN_STORAGE_KEY = 'kavach:token'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = RequestInit & {
  token?: string | null
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers)
  const token = options.token ?? getStoredToken()

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = 'Something went wrong.'

    try {
      const payload = (await response.json()) as { error?: string | { message?: string } }

      if (typeof payload.error === 'string') {
        message = payload.error
      } else if (payload.error?.message) {
        message = payload.error.message
      }
    } catch {
      message = response.statusText || message
    }

    throw new ApiError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function getStoredToken() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setStoredToken(token: string | null) {
  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token)
    return
  }

  window.localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export async function loginDemo() {
  return request<AuthResponse>('/api/auth/demo', { method: 'POST' })
}

export async function signup(payload: SignupPayload) {
  return request<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getSession(token: string) {
  return request<{ user: WorkerProfile }>('/api/auth/session', {
    method: 'GET',
    token,
  })
}

export async function logoutSession(token: string | null) {
  return request('/api/auth/logout', {
    method: 'POST',
    token,
  })
}

export async function getAppBootstrap(token: string | null) {
  return request<AppBootstrap>('/api/app-data', {
    method: 'GET',
    token,
  })
}

export async function updateProfileSettings(
  token: string | null,
  settings: ProfileSetting[],
) {
  return request<{ settings: ProfileSetting[] }>('/api/profile/settings', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ settings }),
  })
}
