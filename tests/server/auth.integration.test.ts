import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, test } from 'node:test'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createKavachServer } from '../../server/app.js'
import type { ProfileSetting, SignupPayload } from '../../packages/shared/src/types.js'

type JsonRecord = Record<string, unknown> | null

describe('Kavach API auth and session flows', () => {
  let tempDir = ''
  let baseUrl = ''
  let httpServer: Server | null = null
  let server = createKavachServer({ serveStatic: false })

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'kavach-tests-'))
    server = createKavachServer({
      dbPath: path.join(tempDir, 'db.sqlite'),
      legacyJsonPath: null,
      serveStatic: false,
    })

    await server.init()

    httpServer = await new Promise<Server>((resolve) => {
      const listener = server.app.listen(0, '127.0.0.1', () => resolve(listener))
    })

    const address = httpServer.address() as AddressInfo
    baseUrl = `http://127.0.0.1:${address.port}`
  })

  afterEach(async () => {
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer?.close((error) => {
          if (error) {
            reject(error)
            return
          }

          resolve()
        })
      })
      httpServer = null
    }

    await server.close()
    await rm(tempDir, { recursive: true, force: true })
  })

  test('issues a demo admin session and invalidates it on logout', async () => {
    const demo = await apiRequest('/api/auth/demo', { method: 'POST' })
    assert.equal(demo.response.status, 201)
    assert.equal(demo.json?.user.role, 'admin')
    assert.equal(typeof demo.json?.token, 'string')

    const session = await apiRequest('/api/auth/session', { token: String(demo.json?.token) })
    assert.equal(session.response.status, 200)
    assert.equal(session.json?.user.id, demo.json?.user.id)

    const logout = await apiRequest('/api/auth/logout', {
      method: 'POST',
      token: String(demo.json?.token),
    })
    assert.equal(logout.response.status, 204)

    const expired = await apiRequest('/api/auth/session', { token: String(demo.json?.token) })
    assert.equal(expired.response.status, 401)
  })

  test('signs up a worker, blocks analytics, and persists profile settings', async () => {
    const payload: SignupPayload = {
      name: 'Aman Singh',
      phone: '9876543210',
      platforms: ['Zomato', 'Blinkit'],
      city: 'Delhi',
      zone: 'Saket',
      plan: 'Pro',
      upi: 'aman@upi',
    }

    const signup = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: payload,
    })

    assert.equal(signup.response.status, 201)
    assert.equal(signup.json?.user.role, 'worker')
    assert.equal(signup.json?.user.plan, 'Kavach Pro')

    const analytics = await apiRequest('/api/app-data/analytics', {
      token: String(signup.json?.token),
    })
    assert.equal(analytics.response.status, 403)

    const settings: ProfileSetting[] = [
      { label: 'Smart Alerts', value: 'Peak hours only', enabled: true },
      { label: 'App Language', value: 'English', enabled: true, kind: 'link' },
      { label: 'Biometric Lock', value: 'Disabled', enabled: false },
    ]

    const saved = await apiRequest('/api/profile/settings', {
      method: 'PATCH',
      token: String(signup.json?.token),
      body: { settings },
    })
    assert.equal(saved.response.status, 200)
    assert.equal(saved.json?.settings[0].value, 'Peak hours only')

    const bootstrap = await apiRequest('/api/app-data', {
      token: String(signup.json?.token),
    })
    assert.equal(bootstrap.response.status, 200)
    assert.equal(bootstrap.json?.profile.settings[0].value, 'Peak hours only')
  })

  test('logs in an existing worker and returns intelligent dashboard data', async () => {
    const payload: SignupPayload = {
      name: 'Meera Jain',
      phone: '+91 9988776655',
      platforms: ['Swiggy'],
      city: 'Bengaluru',
      zone: 'Koramangala',
      plan: 'Standard',
      upi: 'meera@upi',
    }

    const signup = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: payload,
    })

    assert.equal(signup.response.status, 201)

    const login = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { phone: payload.phone },
    })

    assert.equal(login.response.status, 201)
    assert.equal(login.json?.user.phone, payload.phone)
    assert.equal(typeof login.json?.user.lastLoginAt, 'string')

    const dashboard = await apiRequest('/api/app-data/dashboard', {
      token: String(login.json?.token),
    })

    assert.equal(dashboard.response.status, 200)
    assert.equal(typeof dashboard.json?.riskOutlook?.level, 'string')
    assert.equal(typeof dashboard.json?.riskOutlook?.premiumDelta, 'number')
    assert.equal(typeof dashboard.json?.payoutState?.reference, 'string')
    assert.equal(typeof dashboard.json?.fraudAssessment?.score, 'number')
    assert.equal(Array.isArray(dashboard.json?.fraudAssessment?.signals), true)
    assert.equal(Array.isArray(dashboard.json?.quickActions), true)
  })

  test('upgrades worker policy and persists autopay management state', async () => {
    const signup = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: {
        name: 'Pooja Nair',
        phone: '9000011111',
        platforms: ['Swiggy'],
        city: 'Bengaluru',
        zone: 'Indiranagar',
        plan: 'Basic',
        upi: 'pooja@upi',
      } satisfies SignupPayload,
    })

    const token = String(signup.json?.token)

    const upgrade = await apiRequest('/api/policy/upgrade', {
      method: 'POST',
      token,
      body: { plan: 'Pro' },
    })
    const upgradedPolicy = upgrade.json?.policy as JsonRecord

    assert.equal(upgrade.response.status, 200)
    assert.equal(upgrade.json?.user.plan, 'Kavach Pro')
    assert.equal(upgrade.json?.user.weeklyPremium, 79)
    assert.equal((upgradedPolicy?.autopayState as JsonRecord | null)?.mandateStatus, 'active')

    const pauseAutopay = await apiRequest('/api/policy/autopay/manage', {
      method: 'POST',
      token,
      body: { enabled: false },
    })
    const autopayPolicy = pauseAutopay.json?.policy as JsonRecord
    const autopayProfile = pauseAutopay.json?.profile as JsonRecord
    const autopaySettings = autopayProfile?.settings as Array<{ label?: string; enabled?: boolean }> | undefined

    assert.equal(pauseAutopay.response.status, 200)
    assert.equal((autopayPolicy?.autopayState as JsonRecord | null)?.enabled, false)
    assert.equal((autopayPolicy?.autopayState as JsonRecord | null)?.mandateStatus, 'paused')
    assert.equal(autopaySettings?.some((setting) => setting.label === 'AutoPay Mandate' && setting.enabled === false), true)

    const overwrittenSettings = await apiRequest('/api/profile/settings', {
      method: 'PATCH',
      token,
      body: {
        settings: [
          { label: 'Smart Alerts', value: 'Peak hours only', enabled: true },
          { label: 'App Language', value: 'English', enabled: true, kind: 'link' },
        ],
      },
    })

    assert.equal(overwrittenSettings.response.status, 200)
    assert.equal(
      overwrittenSettings.json?.settings.some((setting: { label?: string; enabled?: boolean }) => setting.label === 'AutoPay Mandate' && setting.enabled === false),
      true,
    )

    const policy = await apiRequest('/api/app-data/policy', {
      token,
    })

    assert.equal(policy.response.status, 200)
    assert.equal(policy.json?.autopayState?.enabled, false)
    assert.equal(policy.json?.autopayState?.mandateStatus, 'paused')
    assert.equal(policy.json?.dynamicPremium?.coverageHours > 0, true)
    assert.equal(policy.json?.premiumHistory[0].amount, 79)
  })

  test('simulates instant payouts, returns receipts, and supports emergency escalation', async () => {
    const signup = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: {
        name: 'Tarun Das',
        phone: '9811122233',
        platforms: ['Blinkit'],
        city: 'Delhi',
        zone: 'Saket',
        plan: 'Pro',
        upi: 'tarun@upi',
      } satisfies SignupPayload,
    })

    const token = String(signup.json?.token)

    const payout = await apiRequest('/api/payouts/simulate', {
      method: 'POST',
      token,
      body: { provider: 'razorpay_test' },
    })

    assert.equal(payout.response.status, 201)
    assert.equal(payout.json?.payout?.status, 'paid')
    assert.equal(payout.json?.payout?.provider, 'razorpay_test')

    const receiptReference = String(payout.json?.payout?.reference)
    const receiptResponse = await fetch(`${baseUrl}/api/payouts/${receiptReference}/receipt`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    assert.equal(receiptResponse.status, 200)
    const receiptText = await receiptResponse.text()
    assert.match(receiptText, /Tarun Das/)
    assert.match(receiptText, /razorpay_test/)

    const emergency = await apiRequest('/api/support/emergency', {
      method: 'POST',
      token,
      body: { channel: 'callback' },
    })

    assert.equal(emergency.response.status, 201)
    assert.equal(typeof emergency.json?.ticketId, 'string')
    assert.equal(emergency.json?.status, 'queued')
  })

  test('returns richer admin analytics and exports them as csv', async () => {
    const demo = await apiRequest('/api/auth/demo', { method: 'POST' })
    const token = String(demo.json?.token)

    const analytics = await apiRequest('/api/app-data/analytics', { token })
    assert.equal(analytics.response.status, 200)
    assert.equal(typeof analytics.json?.lossRatio, 'number')
    assert.equal(typeof analytics.json?.predictedClaimsNextWeek, 'number')
    assert.equal(Array.isArray(analytics.json?.zoneForecasts), true)
    assert.equal(Array.isArray(analytics.json?.fraudQueue), true)

    const exportResponse = await fetch(`${baseUrl}/api/analytics/export`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    assert.equal(exportResponse.status, 200)
    assert.match(exportResponse.headers.get('content-type') ?? '', /csv/)
    const exportText = await exportResponse.text()
    assert.match(exportText, /zone,primaryTrigger,likelyClaims,premiumDelta,confidence/i)
  })

  async function apiRequest(
    route: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH'
      token?: string
      body?: unknown
    } = {},
  ) {
    const headers = new Headers()

    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json')
    }

    if (options.token) {
      headers.set('Authorization', `Bearer ${options.token}`)
    }

    const response = await fetch(`${baseUrl}${route}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })

    const text = await response.text()
    const json = text ? (JSON.parse(text) as JsonRecord) : null

    return { response, json }
  }
})
