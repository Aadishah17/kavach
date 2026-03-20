import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { worker } from '../data/mockData'
import type { WorkerProfile } from '../types'

type AuthContextValue = {
  user: WorkerProfile | null
  isAuthenticated: boolean
  loginAsDemo: () => void
  completeOnboarding: (profile: WorkerProfile) => void
  logout: () => void
}

const STORAGE_KEY = 'kavach:user'

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser() {
  if (typeof window === 'undefined') {
    return null
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return null
  }

  try {
    return JSON.parse(stored) as WorkerProfile
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WorkerProfile | null>(() => readStoredUser())

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loginAsDemo: () => {
        setUser(worker)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(worker))
      },
      completeOnboarding: (profile) => {
        setUser(profile)
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
      },
      logout: () => {
        setUser(null)
        window.localStorage.removeItem(STORAGE_KEY)
      },
    }),
    [user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
