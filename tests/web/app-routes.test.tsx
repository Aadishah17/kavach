import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Outlet } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: authMocks.useAuth,
}))

vi.mock('../../src/layouts/LandingLayout', () => ({
  LandingLayout: () => <Outlet />,
}))

vi.mock('../../src/layouts/AppLayout', () => ({
  AppLayout: () => <Outlet />,
}))

vi.mock('../../src/pages/LandingPage', () => ({
  LandingPage: () => <div>Landing screen</div>,
}))

vi.mock('../../src/pages/OnboardingPage', () => ({
  OnboardingPage: () => <div>Onboarding screen</div>,
}))

vi.mock('../../src/pages/LoginPage', () => ({
  LoginPage: () => <div>Login screen</div>,
}))

vi.mock('../../src/pages/HelpPage', () => ({
  HelpPage: () => <div>Help screen</div>,
}))

vi.mock('../../src/pages/DashboardPage', () => ({
  DashboardPage: () => <div>Dashboard screen</div>,
}))

vi.mock('../../src/pages/ClaimsPage', () => ({
  ClaimsPage: () => <div>Claims screen</div>,
}))

vi.mock('../../src/pages/AnalyticsPage', () => ({
  AnalyticsPage: () => <div>Analytics screen</div>,
}))

vi.mock('../../src/pages/PolicyPage', () => ({
  PolicyPage: () => <div>Policy screen</div>,
}))

vi.mock('../../src/pages/AlertsPage', () => ({
  AlertsPage: () => <div>Alerts screen</div>,
}))

vi.mock('../../src/pages/ProfilePage', () => ({
  ProfilePage: () => <div>Profile screen</div>,
}))

import App from '../../src/App'

describe('Protected route guards', () => {
  beforeEach(() => {
    authMocks.useAuth.mockReset()
  })

  test('redirects unauthenticated visitors to the login page', async () => {
    authMocks.useAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      loginAsDemo: vi.fn(),
      loginWithIdentifier: vi.fn(),
      completeOnboarding: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Login screen')).toBeInTheDocument()
    })
  })

  test('redirects non-admin users away from analytics', async () => {
    authMocks.useAuth.mockReturnValue({
      user: {
        id: 'user-worker',
        name: 'Aman Singh',
        email: 'aman@kavach.local',
        status: 'active',
        createdAt: '2026-03-18T08:00:00.000Z',
        updatedAt: '2026-03-18T08:00:00.000Z',
        lastLoginAt: '2026-03-18T08:00:00.000Z',
        platform: 'Zomato',
        phone: '9876543210',
        platforms: ['Zomato'],
        city: 'Delhi',
        zone: 'Saket',
        plan: 'Kavach Standard',
        weeklyPremium: 49,
        iwi: 4000,
        trustScore: 92,
        upi: 'aman@upi',
        kycVerified: true,
        nextDeduction: 'Monday, 24 March 2026',
        role: 'worker',
      },
      token: 'worker-token',
      isAuthenticated: true,
      isLoading: false,
      loginAsDemo: vi.fn(),
      loginWithIdentifier: vi.fn(),
      completeOnboarding: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Dashboard screen')).toBeInTheDocument()
    })

    expect(screen.queryByText('Analytics screen')).not.toBeInTheDocument()
  })

  test('renders the public help page', async () => {
    authMocks.useAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      loginAsDemo: vi.fn(),
      loginWithIdentifier: vi.fn(),
      completeOnboarding: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/help']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Help screen')).toBeInTheDocument()
    })
  })
})
