import { Suspense, lazy, useEffect } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { useAuth } from './context/AuthContext'

const LandingLayout = lazy(() =>
  import('./layouts/LandingLayout').then((module) => ({ default: module.LandingLayout })),
)
const AppLayout = lazy(() =>
  import('./layouts/AppLayout').then((module) => ({ default: module.AppLayout })),
)
const LandingPage = lazy(() =>
  import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })),
)
const OnboardingPage = lazy(() =>
  import('./pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })),
)
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const ClaimsPage = lazy(() =>
  import('./pages/ClaimsPage').then((module) => ({ default: module.ClaimsPage })),
)
const AnalyticsPage = lazy(() =>
  import('./pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })),
)
const PolicyPage = lazy(() =>
  import('./pages/PolicyPage').then((module) => ({ default: module.PolicyPage })),
)
const AlertsPage = lazy(() =>
  import('./pages/AlertsPage').then((module) => ({ default: module.AlertsPage })),
)
const ProfilePage = lazy(() =>
  import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)

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
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-kavach px-6 text-center">
        <div>
          <p className="font-serif text-4xl text-navy">Kavach</p>
          <p className="mt-3 text-sm font-medium text-muted">Restoring your protection session…</p>
        </div>
      </div>
    )
  }

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

function AdminRoute() {
  const { isLoading, user } = useAuth()

  if (isLoading) {
    return null
  }

  if (user?.role !== 'admin') {
    return (
      <Navigate
        replace
        to="/dashboard"
      />
    )
  }

  return <Outlet />
}

function App() {
  return (
    <>
      <Suspense
        fallback={
          <div className="grid min-h-screen place-items-center bg-kavach px-6 text-center">
            <div>
              <p className="font-serif text-4xl text-navy">Kavach</p>
              <p className="mt-3 text-sm font-medium text-muted">Loading your protection layer…</p>
            </div>
          </div>
        }
      >
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
              <Route element={<AdminRoute />}>
                <Route path="/analytics" element={<AnalyticsPage />} />
              </Route>
              <Route path="/policy" element={<PolicyPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </Suspense>
      <Analytics />
    </>
  )
}

export default App
