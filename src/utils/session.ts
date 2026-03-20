export const AUTH_STORAGE_KEY = 'kavach-auth-state'

export type AuthRecord = {
  name: string
  phone: string
  zone: string
  plan: string
  platforms: string[]
  upi: string
  role: 'worker' | 'admin'
}

export function getAuthRecord() {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AuthRecord
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function setAuthRecord(auth: AuthRecord) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
}

export function clearAuthRecord() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}
