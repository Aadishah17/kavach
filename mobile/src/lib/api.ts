import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import type { AppBootstrap, AuthResponse, LandingPayload, ProfileSetting, SignupPayload, WorkerProfile } from '../types'

const TOKEN_STORAGE_KEY = 'kavach-mobile:token'
// NOTE: For Production / App Store release, change DEFAULT_API_BASE to your live backend domain 
// e.g., 'https://api.kavach.app'
const DEFAULT_API_BASE =
  Platform.OS === 'android' ? 'http://10.0.2.2:8787' : 'http://127.0.0.1:8787'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE

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

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
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

export function getApiBaseUrl() {
  return API_BASE_URL
}

export async function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_STORAGE_KEY)
}

export async function setStoredToken(token: string | null) {
  if (token) {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token)
    return
  }

  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY)
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
  if (!token) {
    return
  }

  return request('/api/auth/logout', {
    method: 'POST',
    token,
  })
}

export async function getAppBootstrap(token: string) {
  return request<AppBootstrap>('/api/app-data', {
    method: 'GET',
    token,
  })
}

export async function getLandingData() {
  return request<LandingPayload>('/api/app-data/landing', {
    method: 'GET',
  })
}

export async function updateProfileSettings(token: string, settings: ProfileSetting[]) {
  return request<{ settings: ProfileSetting[] }>('/api/profile/settings', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ settings }),
  })
}
