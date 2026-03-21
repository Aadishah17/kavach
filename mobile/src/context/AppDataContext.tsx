/* eslint-disable react-refresh/only-export-components */
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ApiError, getAppBootstrap, updateProfileSettings } from '../lib/api'
import { useAuth } from './AuthContext'
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
  const { token, isAuthenticated, isLoading: authLoading, logout } = useAuth()
  const [data, setData] = useState<AppBootstrap | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshData = useCallback(async () => {
    if (!token) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const payload = await getAppBootstrap(token)
      setData(payload)
    } catch (refreshError) {
      if (refreshError instanceof ApiError && refreshError.status === 401) {
        await logout()
        return
      }

      setError(
        refreshError instanceof Error ? refreshError.message : 'Unable to refresh app data.',
      )
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
        setError(null)
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Unable to save profile settings.',
        )
        throw saveError
      }
    },
    [token],
  )

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!isAuthenticated || !token) {
      setData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    void refreshData()
  }, [authLoading, isAuthenticated, refreshData, token])

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
