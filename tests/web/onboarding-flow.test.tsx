import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, beforeEach, describe, expect, test } from 'vitest'

const authMocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
}))

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: authMocks.useAuth,
}))

import { OnboardingPage } from '../../src/pages/OnboardingPage'

describe('Onboarding flow', () => {
  beforeEach(() => {
    authMocks.useAuth.mockReset()
  })

  test('submits the worker onboarding journey and redirects to the requested route', async () => {
    const completeOnboarding = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    authMocks.useAuth.mockReturnValue({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      loginAsDemo: vi.fn(),
      completeOnboarding,
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/signup?redirect=/claims']}>
        <Routes>
          <Route path="/signup" element={<OnboardingPage />} />
          <Route path="/claims" element={<div>Claims destination</div>} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByPlaceholderText('Arjun Kumar'), {
      target: { value: 'Aman Singh' },
    })
    fireEvent.change(screen.getByPlaceholderText('+91 98765 43210'), {
      target: { value: '9876543210' },
    })
    await user.click(screen.getByRole('button', { name: /next/i }))

    await user.click(screen.getByRole('button', { name: 'Zomato' }))
    await user.click(screen.getByRole('button', { name: /next/i }))

    await user.click(screen.getByRole('button', { name: /next/i }))

    await user.click(screen.getByRole('button', { name: /next/i }))

    fireEvent.change(screen.getByPlaceholderText('rahul@phonepe'), {
      target: { value: 'aman@upi' },
    })
    await user.click(screen.getByRole('button', { name: /setup autopay & activate/i }))

    await waitFor(() => {
      expect(completeOnboarding).toHaveBeenCalledWith({
        name: 'Aman Singh',
        phone: '9876543210',
        platforms: ['Zomato'],
        city: 'Bengaluru',
        zone: 'Koramangala Central',
        plan: 'Standard',
        upi: 'aman@upi',
      })
    })

    await waitFor(() => {
      expect(screen.getByText('Claims destination')).toBeInTheDocument()
    })
  })
})
