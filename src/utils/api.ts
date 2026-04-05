import type {
  AppBootstrap,
  AuthResponse,
  DashboardData,
  PlanName,
  PolicyData,
  ProfileSetting,
  SignupPayload,
  WorkerProfile,
} from '../types'

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

function buildHeaders(options: RequestOptions) {
  const headers = new Headers(options.headers)
  const token = options.token ?? getStoredToken()

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return headers
}

async function readErrorMessage(response: Response) {
  const fallback = response.statusText || 'Something went wrong.'

  try {
    const raw = await response.text()

    if (!raw) {
      return fallback
    }

    try {
      const payload = JSON.parse(raw) as { error?: string | { message?: string } }

      if (typeof payload.error === 'string') {
        return payload.error
      }

      if (payload.error?.message) {
        return payload.error.message
      }
    } catch {
      return raw
    }
  } catch {
    return fallback
  }

  return fallback
}

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  })

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function requestText(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  })

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status)
  }

  return await response.text()
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
  return requestJson<AuthResponse>('/api/auth/demo', { method: 'POST' })
}

export async function loginWithIdentifier(identifier: string) {
  return requestJson<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier }),
  })
}

export async function signup(payload: SignupPayload) {
  return requestJson<AuthResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getSession(token: string) {
  return requestJson<{ user: WorkerProfile }>('/api/auth/session', {
    method: 'GET',
    token,
  })
}

export async function logoutSession(token: string | null) {
  return requestJson('/api/auth/logout', {
    method: 'POST',
    token,
  })
}

export async function getAppBootstrap(token: string | null) {
  return requestJson<AppBootstrap>('/api/app-data', {
    method: 'GET',
    token,
  })
}

export async function updateProfileSettings(
  token: string | null,
  settings: ProfileSetting[],
) {
  return requestJson<{ settings: ProfileSetting[] }>('/api/profile/settings', {
    method: 'PATCH',
    token,
    body: JSON.stringify({ settings }),
  })
}

export async function simulatePayout(
  token: string | null,
  provider: 'upi_mock' | 'razorpay_test' | 'stripe_test' = 'upi_mock',
) {
  return requestJson<{ payout: { reference: string; amount: number; status: string; provider: string; rail: string; etaMinutes: number; updatedAt: string }; message: string }>(
    '/api/payouts/simulate',
    {
      method: 'POST',
      token,
      body: JSON.stringify({ provider }),
    },
  )
}

export async function getPayoutReceipt(token: string | null, reference: string) {
  return requestText(`/api/payouts/${encodeURIComponent(reference)}/receipt`, {
    method: 'GET',
    token,
  })
}

export async function requestEmergencySupport(
  token: string | null,
  channel: 'callback' | 'chat' | 'phone' = 'callback',
) {
  return requestJson<{
    ticketId: string
    status: string
    channel: 'callback' | 'chat' | 'phone'
    callbackEtaMinutes: number
    hotline: string
    message: string
  }>('/api/support/emergency', {
    method: 'POST',
    token,
    body: JSON.stringify({ channel }),
  })
}

export async function exportAnalytics(token: string | null) {
  return requestText('/api/analytics/export', {
    method: 'GET',
    token,
  })
}

export async function upgradePolicy(token: string | null, plan: PlanName) {
  return requestJson<{ message: string; user: WorkerProfile; dashboard: DashboardData; policy: PolicyData }>(
    '/api/policy/upgrade',
    {
      method: 'POST',
      token,
      body: JSON.stringify({ plan }),
    },
  )
}

export async function manageAutopay(token: string | null, enabled: boolean) {
  return requestJson<{ message: string; user: WorkerProfile; policy: PolicyData; profile: { settings: ProfileSetting[] } }>(
    '/api/policy/autopay/manage',
    {
      method: 'POST',
      token,
      body: JSON.stringify({ enabled }),
    },
  )
}
