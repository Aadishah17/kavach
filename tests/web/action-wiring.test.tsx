import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, test, vi } from 'vitest'

const appDataMocks = vi.hoisted(() => ({
  useAppData: vi.fn(),
  useAuth: vi.fn(),
}))

const apiMocks = vi.hoisted(() => ({
  exportAnalytics: vi.fn(),
  manageAutopay: vi.fn(),
}))

const downloadMocks = vi.hoisted(() => ({
  downloadTextFile: vi.fn(),
}))

vi.mock('recharts', () => {
  const passthrough = ({ children }: { children?: unknown }) => <>{children}</>
  return {
    ResponsiveContainer: passthrough,
    BarChart: passthrough,
    PieChart: passthrough,
    Bar: passthrough,
    Pie: passthrough,
    CartesianGrid: () => null,
    Cell: () => null,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  }
})

vi.mock('../../src/context/AppDataContext', () => ({
  useAppData: appDataMocks.useAppData,
}))

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: appDataMocks.useAuth,
}))

vi.mock('../../src/utils/api', () => ({
  exportAnalytics: apiMocks.exportAnalytics,
  manageAutopay: apiMocks.manageAutopay,
}))

vi.mock('../../src/utils/download', () => ({
  downloadTextFile: downloadMocks.downloadTextFile,
}))

import { AnalyticsPage } from '../../src/pages/AnalyticsPage'
import { PolicyPage } from '../../src/pages/PolicyPage'

describe('Live action wiring', () => {
  beforeEach(() => {
    appDataMocks.useAppData.mockReset()
    appDataMocks.useAuth.mockReset()
    apiMocks.exportAnalytics.mockReset()
    apiMocks.manageAutopay.mockReset()
    downloadMocks.downloadTextFile.mockReset()
  })

  test('exports analytics from the backend and downloads the CSV', async () => {
    const user = userEvent.setup()
    apiMocks.exportAnalytics.mockResolvedValue('zone,primaryTrigger\nKoramangala,Rain')

    appDataMocks.useAppData.mockReturnValue({
      data: {
        analytics: {
          kpis: {
            activeWorkers: 100,
            weeklyPremium: 1000,
            claimsPaid: 500,
            fraudDetectionRate: 90,
            avgPayoutMinutes: 4,
          },
          weeklyChartData: [],
          claimsBreakdown: [],
          fraudSignals: [],
          financialHealth: [],
          unitEconomics: [],
          lossRatio: 40,
          predictedClaimsNextWeek: 12,
          forecastSummary: 'Storm exposure is increasing.',
          zoneForecasts: [],
          fraudQueue: [],
          recentPayouts: [],
        },
      },
    })

    appDataMocks.useAuth.mockReturnValue({
      token: 'admin-token',
      user: { role: 'admin' },
    })

    render(
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /export csv/i }))

    await waitFor(() => {
      expect(apiMocks.exportAnalytics).toHaveBeenCalledWith('admin-token')
      expect(downloadMocks.downloadTextFile).toHaveBeenCalledWith(
        'zone,primaryTrigger\nKoramangala,Rain',
        'kavach-zone-forecast.csv',
        'text/csv;charset=utf-8',
      )
    })
  })

  test('toggles AutoPay through the policy backend', async () => {
    const user = userEvent.setup()

    appDataMocks.useAppData.mockReturnValue({
      data: {
        policy: {
          coverage: [],
          triggers: [],
          premiumHistory: [],
          dynamicPremium: {
            level: 'moderate',
            summary: 'Rain risk is moderate.',
            nextLikelyTrigger: 'Heavy rain',
            premiumDelta: 1,
            protectedAmount: 2000,
            coverageHours: 48,
            confidence: 80,
          },
          autopayState: {
            enabled: true,
            mandateStatus: 'active',
            nextCharge: 'Monday, 13 April 2026',
            note: 'AutoPay is linked to the UPI handle.',
          },
        },
        claims: {
          payoutState: { reference: 'payout-user-1-latest' },
        },
      },
      refreshData: vi.fn().mockResolvedValue(undefined),
    })

    appDataMocks.useAuth.mockReturnValue({
      token: 'worker-token',
      user: {
        plan: 'Kavach Standard',
        weeklyPremium: 49,
        iwi: 4000,
        trustScore: 92,
        upi: 'aman@upi',
      },
    })

    apiMocks.manageAutopay.mockResolvedValue({
      message: 'Weekly AutoPay mandate paused for future deductions.',
    })

    render(
      <MemoryRouter>
        <PolicyPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /pause autopay/i }))

    await waitFor(() => {
      expect(apiMocks.manageAutopay).toHaveBeenCalledWith('worker-token', false)
    })
  })
})
