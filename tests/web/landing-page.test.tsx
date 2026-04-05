import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: authMocks.useAuth,
}))

import { LandingPage } from '../../src/pages/LandingPage'

describe('Landing page', () => {
  beforeEach(() => {
    class MockIntersectionObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
      takeRecords() {
        return []
      }
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    authMocks.useAuth.mockReset()
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
  })

  test('points the Android download CTA at the bundled apk asset', () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    )

    const downloadLink = screen.getByRole('link', { name: /download app \(android\)/i })

    expect(downloadLink).toHaveAttribute('href', '/downloads/kavach-android.apk')
    expect(downloadLink).toHaveAttribute('download')

    expect(screen.getByRole('link', { name: /returning worker login/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: /visit help center/i })).toHaveAttribute('href', '/help')
    expect(screen.getByText(/recent payout examples and trust signals/i)).toBeInTheDocument()
  })
})
