/* eslint-disable react-refresh/only-export-components */
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { getSession, getStoredToken, loginDemo, logoutSession, setStoredToken, signup } from '../lib/api'
import type { SignupPayload, WorkerProfile } from '../types'

type AuthContextValue = {
  user: WorkerProfile | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  loginAsDemo: () => Promise<void>
  completeOnboarding: (payload: SignupPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<WorkerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const restoreSession = async () => {
      setIsLoading(true)

      try {
        const storedToken = await getStoredToken()
        if (!storedToken) {
          setToken(null)
          setUser(null)
          setError(null)
          return
        }

        const response = await getSession(storedToken)
        setToken(storedToken)
        setUser(response.user)
        setError(null)
      } catch (restoreError) {
        setToken(null)
        setUser(null)
        setError(
          restoreError instanceof Error ? restoreError.message : 'Unable to restore session.',
        )
        await setStoredToken(null)
      } finally {
        setIsLoading(false)
      }
    }

    void restoreSession()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      loginAsDemo: async () => {
        setIsLoading(true)
        try {
          const response = await loginDemo()
          setUser(response.user)
          setToken(response.token)
          setError(null)
          await setStoredToken(response.token)
        } catch (loginError) {
          setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.')
          throw loginError
        } finally {
          setIsLoading(false)
        }
      },
      completeOnboarding: async (payload) => {
        setIsLoading(true)
        try {
          const response = await signup(payload)
          setUser(response.user)
          setToken(response.token)
          setError(null)
          await setStoredToken(response.token)
        } catch (signupError) {
          setError(
            signupError instanceof Error ? signupError.message : 'Unable to complete onboarding.',
          )
          throw signupError
        } finally {
          setIsLoading(false)
        }
      },
      logout: async () => {
        const currentToken = token
        setUser(null)
        setToken(null)
        setError(null)
        await setStoredToken(null)

        if (currentToken) {
          try {
            await logoutSession(currentToken)
          } catch {
            // Best-effort remote logout only.
          }
        }
      },
    }),
    [error, isLoading, token, user],
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
