import { useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { LandingLayout } from './layouts/LandingLayout'
import { useAuth } from './context/AuthContext'
import { AlertsPage } from './pages/AlertsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ClaimsPage } from './pages/ClaimsPage'
import { DashboardPage } from './pages/DashboardPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { PolicyPage } from './pages/PolicyPage'
import { ProfilePage } from './pages/ProfilePage'

function ScrollManager() {
  const location = useLocation()

  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.slice(1))

      if (element) {
        requestAnimationFrame(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }

      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.hash, location.pathname])

  return null
}

function ProtectedRoute() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return (
      <Navigate
        replace
        to={`/signup?redirect=${encodeURIComponent(location.pathname)}`}
      />
    )
  }

  return <Outlet />
}

function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route element={<LandingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
        <Route path="/signup" element={<OnboardingPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/claims" element={<ClaimsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/policy" element={<PolicyPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate replace to="/" />} />
      </Routes>
    </>
  )
}

export default App
