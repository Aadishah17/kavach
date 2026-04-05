import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test, vi } from 'vitest'

const appDataMocks = vi.hoisted(() => ({
  useAppData: vi.fn(),
  useAuth: vi.fn(),
}))

vi.mock('../../src/context/AppDataContext', () => ({
  useAppData: appDataMocks.useAppData,
}))

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: appDataMocks.useAuth,
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

import { AnalyticsPage } from '../../src/pages/AnalyticsPage'
import { DashboardPage } from '../../src/pages/DashboardPage'

describe('dashboard control-room layouts', () => {
  test('worker dashboard presents the live rail before the action center', () => {
    appDataMocks.useAuth.mockReturnValue({
      user: {
        plan: 'Kavach Standard',
        weeklyPremium: 49,
        role: 'worker',
      },
      token: 'worker-token',
    })

    appDataMocks.useAppData.mockReturnValue({
      data: {
        dashboard: {
          payoutState: {
            amount: 571,
            reference: 'payout-user-1-latest',
            status: 'paid',
            provider: 'upi_mock',
            rail: 'UPI payout rail is live.',
            etaMinutes: 4,
            updatedAt: 'Tue 18 Mar 2026',
          },
          riskOutlook: {
            level: 'moderate',
            summary: 'Rain risk is moderate.',
            nextLikelyTrigger: 'Heavy rain',
            premiumDelta: 1,
            protectedAmount: 2000,
            coverageHours: 48,
            confidence: 82,
          },
          fraudAssessment: {
            status: 'clear',
            summary: 'Signals look clean.',
            score: 92,
            signals: [
              { label: 'Sensor fusion confidence', score: 96, status: 'clear', reason: 'High confidence.' },
            ],
          },
          quickActions: [
            { id: 'support', label: 'Support', description: 'Request support.', action: 'support', tone: 'primary' },
          ],
          triggerEvaluations: [
            {
              id: 'trigger-1',
              name: 'Heavy Rain',
              source: 'public',
              status: 'watch',
              detail: 'IMD orange alert',
              probability: 72,
            },
          ],
          payoutHistory: [
            {
              date: 'Tue 18 Mar 2026',
              type: 'Payout',
              disruption: 'Heavy Rain',
              zone: 'Koramangala',
              amount: 571,
              status: 'Paid',
            },
          ],
          kpis: [],
          zoneMap: { cityLabel: 'Bengaluru', activeWatch: 'Koramangala', zones: [] },
          alerts: [],
          activeAlert: {
            type: 'Heavy Rain',
            emoji: '🌧️',
            zone: 'Koramangala',
            condition: 'IMD Red Alert',
            payoutAmount: 571,
            triggeredAt: 'Tue 18 Mar 2026',
            paidAt: 'Tue 18 Mar 2026',
            coverage: 100,
          },
        },
        policy: {
          autopayState: { enabled: true },
        },
      },
      refreshData: vi.fn(),
    })

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    )

    const liveRail = screen.getByText(/live payout rail/i)
    const actionCenter = screen.getByText(/do something useful now/i)

    expect(liveRail.compareDocumentPosition(actionCenter) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  test('admin analytics presents queues before charts', () => {
    appDataMocks.useAuth.mockReturnValue({
      token: 'admin-token',
      user: { role: 'admin' },
    })

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
          weeklyChartData: [{ week: 'W1', premium: 12 }],
          claimsBreakdown: [{ name: 'Rain/Flood', value: 62, fill: '#1E7E5E' }],
          fraudSignals: [],
          financialHealth: [],
          unitEconomics: [],
          lossRatio: 40,
          predictedClaimsNextWeek: 12,
          forecastSummary: 'Storm exposure is increasing.',
          zoneForecasts: [
            { zone: 'Koramangala', primaryTrigger: 'Rain', likelyClaims: 12, premiumDelta: 2, confidence: 82 },
          ],
          fraudQueue: [
            {
              id: 'fraud-1',
              workerName: 'Aman Singh',
              zone: 'Saket',
              riskLabel: 'review',
              score: 78,
              reason: 'Duplicate device pattern',
            },
          ],
          payoutOps: [
            {
              reference: 'payout-user-1',
              workerName: 'Aman Singh',
              zone: 'Saket',
              amount: 571,
              provider: 'upi_mock',
              status: 'processing',
              updatedAt: 'Tue 18 Mar 2026',
            },
          ],
          recentPayouts: [],
        },
      },
    })

    render(
      <MemoryRouter>
        <AnalyticsPage />
      </MemoryRouter>,
    )

    const zoneQueue = screen.getByText(/zones needing action/i, { selector: 'p.mono-label' })
    const chart = screen.getByRole('heading', { name: /premium inflow/i })

    expect(zoneQueue.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText(/fraud queue/i, { selector: 'p.mono-label' })).toBeInTheDocument()
    expect(screen.getByText(/payout ops/i, { selector: 'p.mono-label' })).toBeInTheDocument()
  })
})
