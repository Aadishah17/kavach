import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: authMocks.useAuth,
}))

import { LoginPage } from '../../src/pages/LoginPage'

describe('Login page', () => {
  beforeEach(() => {
    authMocks.useAuth.mockReset()
  })

  test('shows the sign-in form before the marketing banner on mobile-first layout', () => {
    authMocks.useAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      loginWithIdentifier: vi.fn(),
      loginAsDemo: vi.fn(),
      completeOnboarding: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    const signInHeading = screen.getByRole('heading', { name: /welcome back/i })
    const marketingBanner = screen.getByText(/returning workers/i)

    expect(signInHeading.compareDocumentPosition(marketingBanner) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('logs in with phone and returns to the requested route', async () => {
    const loginWithIdentifier = vi.fn().mockResolvedValue({
      token: 'worker-token',
      user: {
        id: 'user-1',
        name: 'Aman Singh',
      },
    })
    const user = userEvent.setup()

    authMocks.useAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      loginWithIdentifier,
      loginAsDemo: vi.fn(),
      completeOnboarding: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/login?redirect=/claims']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/claims" element={<div>Claims destination</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.clear(screen.getByLabelText(/phone number/i))
    await user.type(screen.getByLabelText(/phone number/i), '9876543210')
    await user.click(screen.getByRole('button', { name: /continue to my dashboard/i }))

    await waitFor(() => {
      expect(loginWithIdentifier).toHaveBeenCalledWith('9876543210')
    })

    await waitFor(() => {
      expect(screen.getByText('Claims destination')).toBeInTheDocument()
    })
  })

  test('switches to email login and submits the selected identity method', async () => {
    const loginWithIdentifier = vi.fn().mockResolvedValue({
      token: 'admin-token',
      user: {
        id: 'user-demo',
        name: 'Rahul Kumar',
      },
    })
    const user = userEvent.setup()

    authMocks.useAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      loginWithIdentifier,
      loginAsDemo: vi.fn(),
      completeOnboarding: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/login?redirect=/analytics']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/analytics" element={<div>Analytics destination</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /^email$/i }))
    await user.clear(screen.getByLabelText(/email address/i))
    await user.type(screen.getByLabelText(/email address/i), 'demo@kavach.local')
    await user.click(screen.getByRole('button', { name: /continue to my dashboard/i }))

    await waitFor(() => {
      expect(loginWithIdentifier).toHaveBeenCalledWith('demo@kavach.local')
    })

    await waitFor(() => {
      expect(screen.getByText('Analytics destination')).toBeInTheDocument()
    })
  })

  test('routes emergency support to the public help page', async () => {
    authMocks.useAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      loginWithIdentifier: vi.fn(),
      loginAsDemo: vi.fn(),
      completeOnboarding: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: /emergency support/i })).toHaveAttribute('href', '/help')
  })
})
