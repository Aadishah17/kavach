import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test } from 'vitest'

import { HelpPage } from '../../src/pages/HelpPage'

describe('Help page', () => {
  test('shows public help content and routes to signup/login', () => {
    render(
      <MemoryRouter>
        <HelpPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/public help center/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start signup/i })).toHaveAttribute('href', '/signup')
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
    expect(screen.getByText(/trust proof/i)).toBeInTheDocument()
  })
})
