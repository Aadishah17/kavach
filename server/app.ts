import { existsSync } from 'node:fs'
import type { Server } from 'node:http'
import path from 'node:path'
import express from 'express'
import {
  autopayManagementSchema,
  loginSchema,
  payoutSimulationSchema,
  policyUpgradeSchema,
  profileSettingsPayloadSchema,
  signupSchema,
  supportRequestSchema,
} from '../packages/shared/src/contracts.js'
import { buildSignupUser, planCatalog, staticAppData } from './seed.js'
import { SqliteStore } from './store.js'
import { FirestoreStore } from './firestore-store.js'
import {
  buildAnalyticsExportCsv,
  buildAnalyticsIntelligence,
  buildDashboardIntelligence,
  buildFraudAssessment,
  buildPayoutState,
  buildRiskOutlook,
  simulateInstantPayout,
} from './intelligence.js'
import type { PlanName, ProfileSetting, StoredUser } from './types.js'

type Store = SqliteStore | FirestoreStore

export type KavachServerPaths = {
  rootPath: string
  dbPath: string
  legacyJsonPath: string
  webDistPath: string
}

export type KavachServerOptions = {
  port?: number
  dbPath?: string
  legacyJsonPath?: string | null
  webDistPath?: string
  serveStatic?: boolean
}

export function resolveServerPaths(rootPath = process.cwd()): KavachServerPaths {
  return {
    rootPath,
    dbPath: path.resolve(rootPath, 'server', 'data', 'db.sqlite'),
    legacyJsonPath: path.resolve(rootPath, 'server', 'data', 'db.json'),
    webDistPath: path.resolve(rootPath, 'dist'),
  }
}

export function createKavachServer(options: KavachServerOptions = {}) {
  const paths = resolveServerPaths()
  const port = options.port ?? Number(process.env.PORT ?? 8787)
  const dbPath = options.dbPath ?? paths.dbPath
  const legacyJsonPath = options.legacyJsonPath ?? paths.legacyJsonPath
  const webDistPath = options.webDistPath ?? paths.webDistPath
  const serveStatic = options.serveStatic ?? true

  const useFirestore = process.env.USE_FIRESTORE === 'true'
  const store: Store = useFirestore
    ? new FirestoreStore()
    : new SqliteStore(dbPath, { legacyJsonPath })
  const simulatedPayouts = new Map<string, { userId: string; payout: ReturnType<typeof buildPayoutState> }>()
  const app = express()

  app.use(express.json({ limit: '1mb' }))
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Session-Token')
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS')
    if (req.method === 'OPTIONS') {
      res.sendStatus(204)
      return
    }
    next()
  })

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'kavach-api',
      timestamp: new Date().toISOString(),
    })
  })

  app.post('/api/auth/demo', asyncRoute(async (_req, res) => {
    const user = await store.getUserById('user-demo')
    if (!user) {
      throw new Error('Demo user could not be initialized')
    }

    res.status(201).json(await issueSession(store, user))
  }))

  app.post('/api/auth/signup', asyncRoute(async (req, res) => {
    const parsed = signupSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_signup_payload',
          message: parsed.error.issues[0]?.message ?? 'Invalid signup payload',
        },
      })
      return
    }

    const existing = await store.getUserByPhone(parsed.data.phone)
    const built = buildSignupUser(parsed.data)
    const user = existing
      ? await store.upsertUser({
          ...existing,
          ...built,
          id: existing.id,
          email: existing.email ?? built.email,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
          lastLoginAt: existing.lastLoginAt,
        })
      : await store.upsertUser(built)

    res.status(201).json(await issueSession(store, user))
  }))

  app.post('/api/auth/login', asyncRoute(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_login_payload',
          message: parsed.error.issues[0]?.message ?? 'Invalid login payload',
        },
      })
      return
    }

    const user = await store.getUserByPhone(parsed.data.phone)

    if (!user) {
      res.status(404).json({
        error: {
          code: 'user_not_found',
          message: 'No Kavach account was found for that phone number.',
        },
      })
      return
    }

    const session = await store.createSession(user.id)
    const currentUser = await store.getUserById(user.id)
    res.status(201).json(buildAuthResponse(currentUser ?? user, session.token))
  }))

  app.get('/api/auth/session', asyncRoute(async (req, res) => {
    const auth = await authenticateRequest(store, req)
    if (!auth) {
      res.status(401).json({
        error: {
          code: 'unauthorized',
          message: 'Missing or invalid session token',
        },
      })
      return
    }

    await store.touchSession(auth.token)
    res.json(buildAuthResponse(auth.user, auth.token))
  }))

  app.post('/api/auth/logout', asyncRoute(async (req, res) => {
    const auth = await authenticateRequest(store, req)
    if (!auth) {
      res.status(204).send()
      return
    }

    await store.revokeSession(auth.token)
    res.status(204).send()
  }))

  app.get('/api/app-data', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    res.json(await buildAppData(store, auth.user))
  }))

  app.get('/api/app-data/dashboard', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    res.json({
      user: publicUser(auth.user),
      ...buildDashboardData(auth.user),
    })
  }))

  app.get('/api/app-data/claims', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    res.json({
      user: publicUser(auth.user),
      activeAlert: staticAppData.activeAlert,
      payoutHistory: staticAppData.payoutHistory,
      premiumHistory: staticAppData.premiumHistory,
      verificationSignals: staticAppData.verificationSignals,
      payoutState: buildPayoutState(auth.user),
      fraudAssessment: buildFraudAssessment(auth.user),
    })
  }))

  app.get('/api/app-data/analytics', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    if (!requireAdmin(auth.user, res)) {
      return
    }

    res.json({
      user: publicUser(auth.user),
      analyticsKpis: staticAppData.analyticsKpis,
      weeklyChartData: staticAppData.weeklyChartData,
      claimsBreakdown: staticAppData.claimsBreakdown,
      fraudSignals: staticAppData.fraudSignals,
      financialHealth: staticAppData.financialHealth,
      unitEconomics: staticAppData.unitEconomics,
      ...buildAnalyticsIntelligence(auth.user),
    })
  }))

  app.get('/api/app-data/policy', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    res.json({
      user: publicUser(auth.user),
      ...(await buildPolicyRouteData(store, auth.user)),
    })
  }))

  app.get('/api/app-data/alerts', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    res.json({
      user: publicUser(auth.user),
      alertsFeed: staticAppData.alertsFeed,
      emergencyResources: staticAppData.emergencyResources,
      supportContacts: staticAppData.supportContacts,
    })
  }))

  app.get('/api/app-data/profile', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    const settings = await store.getProfileSettings(auth.user.id)
    res.json({
      user: publicUser(auth.user),
      profileDocuments: staticAppData.profileDocuments,
      profileSettings: settings,
      onboardingZones: staticAppData.onboardingZones,
      onboardingChecklist: staticAppData.onboardingChecklist,
    })
  }))

  app.patch('/api/profile/settings', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    const parsed = profileSettingsPayloadSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_profile_settings',
          message: parsed.error.issues[0]?.message ?? 'Invalid profile settings payload',
        },
      })
      return
    }

    const currentSettings = await store.getProfileSettings(auth.user.id)
    const settings = await store.updateProfileSettings(
      auth.user.id,
      preserveManagedSettings(currentSettings, parsed.data.settings),
    )
    res.json({ settings })
  }))

  app.post('/api/payouts/simulate', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    const parsed = payoutSimulationSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_payout_request',
          message: parsed.error.issues[0]?.message ?? 'Invalid payout simulation request',
        },
      })
      return
    }

    const simulation = simulateInstantPayout(auth.user, parsed.data.provider)
    simulatedPayouts.set(simulation.payout.reference, {
      userId: auth.user.id,
      payout: simulation.payout,
    })
    res.status(201).json(simulation)
  }))

  app.get('/api/payouts/:reference/receipt', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    const reference = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference
    const payoutRecord = reference ? simulatedPayouts.get(reference) : undefined
    if (!payoutRecord || payoutRecord.userId !== auth.user.id) {
      res.status(404).json({
        error: {
          code: 'receipt_not_found',
          message: 'No payout receipt exists for that reference.',
        },
      })
      return
    }
    const payout = payoutRecord.payout

    const receipt = [
      'Kavach Instant Payout Receipt',
      `Reference: ${payout.reference}`,
      `Worker: ${auth.user.name}`,
      `Zone: ${auth.user.zone}`,
      `Amount: ₹${payout.amount}`,
      `Provider: ${payout.provider}`,
      `Rail: ${payout.rail}`,
      `Updated: ${payout.updatedAt}`,
      '',
      'This is a simulated payout receipt generated for demo verification.',
    ].join('\n')

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${payout.reference}.txt"`)
    res.send(receipt)
  }))

  app.post('/api/support/emergency', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    const parsed = supportRequestSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_support_request',
          message: parsed.error.issues[0]?.message ?? 'Invalid support request',
        },
      })
      return
    }

    res.status(201).json({
      ticketId: `support-${auth.user.id}-${Date.now()}`,
      status: 'queued',
      channel: parsed.data.channel,
      callbackEtaMinutes: 2,
      hotline: '1800-313-KAVACH',
      message: 'Guardian support has been queued and will contact the worker shortly.',
    })
  }))

  app.post('/api/policy/upgrade', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    if (!requireWorker(auth.user, res)) {
      return
    }

    const parsed = policyUpgradeSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_policy_upgrade',
          message: parsed.error.issues[0]?.message ?? 'Invalid policy upgrade request',
        },
      })
      return
    }

    const updatedUser = await updateUserProfile(store, auth.user, applyPlanUpgrade(auth.user, parsed.data.plan))
    const settings = await store.getProfileSettings(updatedUser.id)
    const policy = buildPolicySnapshot(updatedUser, settings)

    res.json({
      message: `Plan upgraded to Kavach ${parsed.data.plan}.`,
      user: publicUser(updatedUser),
      dashboard: buildDashboardData(updatedUser),
      policy,
    })
  }))

  app.post('/api/policy/autopay/manage', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    if (!requireWorker(auth.user, res)) {
      return
    }

    const parsed = autopayManagementSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_autopay_request',
          message: parsed.error.issues[0]?.message ?? 'Invalid AutoPay management request',
        },
      })
      return
    }

    const currentSettings = await store.getProfileSettings(auth.user.id)
    const settings = await store.updateProfileSettings(
      auth.user.id,
      upsertAutopaySetting(currentSettings, parsed.data.enabled),
    )

    const updatedUser = await updateUserProfile(store, auth.user, {
      nextDeduction: parsed.data.enabled ? defaultNextDeduction() : 'AutoPay paused until you resume weekly deductions',
    })

    res.json({
      message: parsed.data.enabled
        ? 'Weekly AutoPay mandate resumed.'
        : 'Weekly AutoPay mandate paused for future deductions.',
      user: publicUser(updatedUser),
      policy: buildPolicySnapshot(updatedUser, settings),
      profile: {
        settings,
      },
    })
  }))

  app.get('/api/analytics/export', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    if (!requireAdmin(auth.user, res)) {
      return
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="kavach-zone-forecast.csv"')
    res.send(buildAnalyticsExportCsv())
  }))

  app.get('/api/app-data/landing', asyncRoute(async (_req, res) => {
    res.json({
      platformPartners: staticAppData.platformPartners,
      landingStats: staticAppData.landingStats,
      problemCards: staticAppData.problemCards,
      howItWorksSteps: staticAppData.howItWorksSteps,
      triggerCards: staticAppData.triggerCards,
      pricingTiers: staticAppData.pricingTiers,
    })
  }))

  if (serveStatic && existsSync(webDistPath)) {
    app.use(express.static(webDistPath))
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(webDistPath, 'index.html'))
    })
  }

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    void next
    const message = err instanceof Error ? err.message : 'Internal server error'
    console.error(err)
    res.status(500).json({
      error: {
        code: 'internal_error',
        message,
      },
    })
  })

  async function init() {
    await store.init()
  }

  async function close() {
    store.close()
  }

  async function start() {
    await init()

    return await new Promise<Server>((resolve) => {
      const server = app.listen(port, () => {
        console.log(`Kavach API listening on http://localhost:${port}`)
        resolve(server)
      })
    })
  }

  return {
    app,
    store,
    init,
    close,
    start,
    config: {
      port,
      dbPath,
      legacyJsonPath,
      webDistPath,
      serveStatic,
    },
  }
}

async function authenticateRequest(store: Store, req: express.Request) {
  const token = extractToken(req)
  if (!token) {
    return null
  }

  const session = await store.getSession(token)
  if (!session) {
    return null
  }

  const user = await store.getUserById(session.userId)
  if (!user) {
    return null
  }

  return {
    token,
    session,
    user,
  }
}

async function requireAuth(store: Store, req: express.Request, res: express.Response) {
  const auth = await authenticateRequest(store, req)
  if (!auth) {
    res.status(401).json({
      error: {
        code: 'unauthorized',
        message: 'Missing or invalid session token',
      },
    })
    return null
  }

  req.auth = auth
  return auth
}

function extractToken(req: express.Request) {
  const authHeader = req.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim()
  }

  const sessionToken = req.get('x-session-token')
  return sessionToken?.trim() ?? null
}

function buildAuthResponse(user: StoredUser, token: string) {
  return {
    token,
    user: publicUser(user),
  }
}

function publicUser(user: StoredUser) {
  const { id, email, status, createdAt, updatedAt, lastLoginAt, ...profile } = user
  return {
    id,
    email,
    status,
    createdAt,
    updatedAt,
    lastLoginAt,
    ...profile,
  }
}

async function buildAppData(store: Store, user: StoredUser) {
  const settings = await store.getProfileSettings(user.id)
  const dashboard = buildDashboardData(user)
  const fraudAssessment = buildFraudAssessment(user)
  const payoutState = buildPayoutState(user)

  return {
    user: publicUser(user),
    dashboard,
    claims: {
      activeAlert: staticAppData.activeAlert,
      verificationSignals: staticAppData.verificationSignals,
      payoutHistory: staticAppData.payoutHistory,
      premiumHistory: buildPremiumHistory(user),
      payoutState,
      fraudAssessment,
    },
    policy: buildPolicySnapshot(user, settings),
    alerts: {
      feed: staticAppData.alertsFeed,
      emergencyResources: staticAppData.emergencyResources,
      supportContacts: staticAppData.supportContacts,
    },
    profile: {
      documents: staticAppData.profileDocuments,
      settings,
      monthlyProtectedAmount: staticAppData.monthlyProtectedAmount,
    },
    analytics: user.role === 'admin'
      ? {
          kpis: staticAppData.analyticsKpis,
          weeklyChartData: staticAppData.weeklyChartData,
          claimsBreakdown: staticAppData.claimsBreakdown,
          fraudSignals: staticAppData.fraudSignals,
          financialHealth: staticAppData.financialHealth,
          unitEconomics: staticAppData.unitEconomics,
          ...buildAnalyticsIntelligence(user),
        }
      : undefined,
  }
}

function buildDashboardData(user: StoredUser) {
  const riskOutlook = buildRiskOutlook(user)
  const payoutState = buildPayoutState(user)

  return {
    dateRange: staticAppData.dateRange,
    coverageStatus: staticAppData.coverageStatus,
    kpis: [
      {
        label: 'Earnings protected',
        value: `₹${Math.round(user.iwi * 1.4).toLocaleString('en-IN')}`,
        hint: 'Projected this week',
        accent: 'green' as const,
      },
      {
        label: 'Active coverage',
        value: `${riskOutlook.coverageHours} hrs`,
        hint: riskOutlook.nextLikelyTrigger,
        accent: 'sky' as const,
      },
      {
        label: 'Dynamic premium',
        value: `${riskOutlook.premiumDelta >= 0 ? '+' : ''}₹${riskOutlook.premiumDelta}`,
        hint: riskOutlook.summary,
        accent: 'gold' as const,
      },
      {
        label: 'Instant payout',
        value: `₹${payoutState.amount}`,
        hint: `${payoutState.provider} · ${payoutState.status}`,
        accent: 'navy' as const,
        inverse: true,
      },
    ],
    zoneMap: {
      cityLabel: staticAppData.zoneMap.cityLabel,
      activeWatch: user.zone,
      zones: staticAppData.zoneMap.zones,
    },
    alerts: staticAppData.dashboardAlerts,
    activeAlert: staticAppData.activeAlert,
    payoutHistory: staticAppData.payoutHistory,
    ...buildDashboardIntelligence(user),
  }
}

async function buildPolicyRouteData(store: Store, user: StoredUser) {
  const settings = await store.getProfileSettings(user.id)
  const policy = buildPolicySnapshot(user, settings)

  return {
    policyCoverage: policy.coverage,
    premiumHistory: policy.premiumHistory,
    triggerCards: policy.triggers,
    dynamicPremium: policy.dynamicPremium,
    autopayState: policy.autopayState,
  }
}

function buildPolicySnapshot(user: StoredUser, settings: ProfileSetting[]) {
  return {
    coverage: staticAppData.policyCoverage,
    premiumHistory: buildPremiumHistory(user),
    triggers: staticAppData.triggerCards,
    dynamicPremium: buildRiskOutlook(user),
    autopayState: buildAutopayState(user, settings),
  }
}

async function issueSession(store: Store, user: StoredUser) {
  const currentUser = await updateUserProfile(store, user, {
    lastLoginAt: new Date().toISOString(),
  })
  const session = await store.createSession(currentUser.id)
  return buildAuthResponse(currentUser, session.token)
}

async function updateUserProfile(
  store: Store,
  user: StoredUser,
  updates: Partial<Omit<StoredUser, 'id' | 'createdAt'>>,
) {
  return store.upsertUser({
    ...user,
    ...updates,
    id: user.id,
    createdAt: user.createdAt,
    updatedAt: new Date().toISOString(),
  })
}

function applyPlanUpgrade(user: StoredUser, plan: PlanName): Partial<StoredUser> {
  const pricing = planCatalog[plan]

  return {
    plan: `Kavach ${plan}`,
    weeklyPremium: pricing.price,
    iwi: pricing.income,
    nextDeduction: defaultNextDeduction(),
  }
}

function buildAutopayState(user: StoredUser, settings: ProfileSetting[]) {
  const autopaySetting = settings.find((setting) => setting.label === 'AutoPay Mandate')
  const enabled = autopaySetting?.enabled ?? true

  return {
    enabled,
    mandateStatus: enabled ? 'active' as const : 'paused' as const,
    nextCharge: enabled ? user.nextDeduction : 'Paused until you re-enable weekly deductions',
    note: enabled
      ? `AutoPay is linked to ${user.upi} and will debit the active weekly premium automatically.`
      : 'Coverage for the current cycle remains active, but future deductions are paused.',
  }
}

function upsertAutopaySetting(settings: ProfileSetting[], enabled: boolean) {
  const autopaySetting: ProfileSetting = {
    label: 'AutoPay Mandate',
    value: enabled ? 'Weekly deduction active' : 'Paused by worker',
    enabled,
  }

  const nextSettings = settings.filter((setting) => setting.label !== autopaySetting.label)
  return [...nextSettings, autopaySetting]
}

function preserveManagedSettings(currentSettings: ProfileSetting[], nextSettings: ProfileSetting[]) {
  const currentAutopay = currentSettings.find((setting) => setting.label === 'AutoPay Mandate')
  if (!currentAutopay || nextSettings.some((setting) => setting.label === currentAutopay.label)) {
    return nextSettings
  }

  return [...nextSettings, currentAutopay]
}

function buildPremiumHistory(user: StoredUser) {
  return [
    {
      cycle: 'Week 14',
      paidOn: user.nextDeduction,
      amount: user.weeklyPremium,
      note: user.nextDeduction.toLowerCase().includes('paused') ? 'AutoPay paused' : 'Weekly AutoPay',
    },
    ...staticAppData.premiumHistory.slice(1).map((entry) => ({
      ...entry,
      amount: user.weeklyPremium,
    })),
  ]
}

function defaultNextDeduction() {
  return 'Monday, 13 April 2026'
}

function requireAdmin(user: StoredUser, res: express.Response) {
  if (user.role === 'admin') {
    return true
  }

  res.status(403).json({
    error: {
      code: 'forbidden',
      message: 'Admin access required',
    },
  })

  return false
}

function requireWorker(user: StoredUser, res: express.Response) {
  if (user.role === 'worker') {
    return true
  }

  res.status(403).json({
    error: {
      code: 'forbidden',
      message: 'Worker access required',
    },
  })

  return false
}

function asyncRoute(handler: express.RequestHandler) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
