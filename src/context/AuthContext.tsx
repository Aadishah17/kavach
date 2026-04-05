/* eslint-disable react-refresh/only-export-components */
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import {
  getSession,
  getStoredToken,
  loginDemo,
  loginWithPhone as loginWithPhoneRequest,
  logoutSession,
  setStoredToken,
  signup,
} from '../utils/api'
import type { SignupPayload, WorkerProfile } from '../types'

type AuthContextValue = {
  user: WorkerProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  loginWithPhone: (phone: string) => Promise<void>
  loginAsDemo: () => Promise<void>
  completeOnboarding: (profile: SignupPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<WorkerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      try {
        const response = await getSession(token)
        setUser(response.user)
      } catch {
        setToken(null)
        setUser(null)
        setStoredToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    void restoreSession()
  }, [token])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      isLoading,
      loginWithPhone: async (phone) => {
        const response = await loginWithPhoneRequest(phone)
        setUser(response.user)
        setToken(response.token)
        setStoredToken(response.token)
      },
      loginAsDemo: async () => {
        const response = await loginDemo()
        setUser(response.user)
        setToken(response.token)
        setStoredToken(response.token)
      },
      completeOnboarding: async (profile) => {
        const response = await signup(profile)
        setUser(response.user)
        setToken(response.token)
        setStoredToken(response.token)
      },
      logout: async () => {
        const currentToken = token
        setUser(null)
        setToken(null)
        setStoredToken(null)
        setIsLoading(false)

        if (currentToken) {
          try {
            await logoutSession(currentToken)
          } catch {
            // Best effort logout; local session is already cleared.
          }
        }
      },
    }),
    [isLoading, token, user],
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
