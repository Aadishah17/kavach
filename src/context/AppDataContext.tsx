/* eslint-disable react-refresh/only-export-components */
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { ApiError, getAppBootstrap, updateProfileSettings } from '../utils/api'
import type { AppBootstrap, ProfileSetting } from '../types'

type AppDataContextValue = {
  data: AppBootstrap | null
  isLoading: boolean
  error: string | null
  refreshData: () => Promise<void>
  saveProfileSettings: (settings: ProfileSetting[]) => Promise<void>
}

const AppDataContext = createContext<AppDataContextValue | null>(null)

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading, token, logout } = useAuth()
  const [data, setData] = useState<AppBootstrap | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshData = useCallback(async () => {
    if (!token) {
      setData(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const payload = await getAppBootstrap(token)
      setData(payload)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await logout()
        return
      }

      setError(
        error instanceof Error ? error.message : 'Unable to refresh Kavach app data.',
      )
      console.error('Unable to refresh Kavach app data', error)
    } finally {
      setIsLoading(false)
    }
  }, [logout, token])

  const saveProfileSettings = useCallback(
    async (settings: ProfileSetting[]) => {
      if (!token) {
        return
      }

      try {
        const response = await updateProfileSettings(token, settings)
        setError(null)
        setData((current) =>
          current
            ? {
                ...current,
                profile: {
                  ...current.profile,
                  settings: response.settings,
                },
              }
            : current,
        )
      } catch (error) {
        setError(
          error instanceof Error ? error.message : 'Unable to save your profile settings.',
        )
        console.error('Unable to save Kavach profile settings', error)
      }
    },
    [token],
  )

  useEffect(() => {
    if (isAuthLoading) {
      return
    }

    if (!isAuthenticated || !token) {
      setData(null)
      setIsLoading(false)
      setError(null)
      return
    }

    void refreshData()
  }, [isAuthLoading, isAuthenticated, refreshData, token])

  const value = useMemo<AppDataContextValue>(
    () => ({
      data,
      isLoading,
      error,
      refreshData,
      saveProfileSettings,
    }),
    [data, error, isLoading, refreshData, saveProfileSettings],
  )

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
}

export function useAppData() {
  const context = useContext(AppDataContext)

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider')
  }

  return context
}
