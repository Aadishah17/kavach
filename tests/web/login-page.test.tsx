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

  test('logs in with phone and returns to the requested route', async () => {
    const loginWithPhone = vi.fn().mockResolvedValue({
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
      loginWithPhone,
      loginAsDemo: vi.fn(),
      completeOnboarding: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/login?redirect=/claims']}>
        <Routes>
          <Route
            path="/login"
            element={<LoginPage />}
          />
          <Route
            path="/claims"
            element={<div>Claims destination</div>}
          />
        </Routes>
      </MemoryRouter>,
    )

    await user.clear(screen.getByLabelText(/phone number/i))
    await user.type(screen.getByLabelText(/phone number/i), '9876543210')
    await user.click(screen.getByRole('button', { name: /continue to my dashboard/i }))

    await waitFor(() => {
      expect(loginWithPhone).toHaveBeenCalledWith('9876543210')
    })

    await waitFor(() => {
      expect(screen.getByText('Claims destination')).toBeInTheDocument()
    })
  })
})
