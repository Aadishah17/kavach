import { existsSync } from 'node:fs'
import type { Server } from 'node:http'
import path from 'node:path'
import express from 'express'
import { profileSettingsPayloadSchema, signupSchema } from '../packages/shared/src/contracts.js'
import { buildSignupUser, staticAppData } from './seed.js'
import { SqliteStore } from './store.js'
import type { StoredUser } from './types.js'

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

  const store = new SqliteStore(dbPath, { legacyJsonPath })
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

    const session = await store.createSession(user.id)
    const currentUser = await store.getUserById(user.id)
    res.status(201).json(buildAuthResponse(currentUser ?? user, session.token))
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
    })
  }))

  app.get('/api/app-data/policy', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    res.json({
      user: publicUser(auth.user),
      policyCoverage: staticAppData.policyCoverage,
      premiumHistory: staticAppData.premiumHistory,
      triggerCards: staticAppData.triggerCards,
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

    const settings = await store.updateProfileSettings(auth.user.id, parsed.data.settings)
    res.json({ settings })
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

async function authenticateRequest(store: SqliteStore, req: express.Request) {
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

async function requireAuth(store: SqliteStore, req: express.Request, res: express.Response) {
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

async function buildAppData(store: SqliteStore, user: StoredUser) {
  const settings = await store.getProfileSettings(user.id)

  return {
    user: publicUser(user),
    dashboard: buildDashboardData(user),
    claims: {
      activeAlert: staticAppData.activeAlert,
      verificationSignals: staticAppData.verificationSignals,
      payoutHistory: staticAppData.payoutHistory,
      premiumHistory: staticAppData.premiumHistory,
    },
    policy: {
      coverage: staticAppData.policyCoverage,
      triggers: staticAppData.triggerCards,
      premiumHistory: staticAppData.premiumHistory,
    },
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
        }
      : undefined,
  }
}

function buildDashboardData(user: StoredUser) {
  return {
    dateRange: staticAppData.dateRange,
    coverageStatus: staticAppData.coverageStatus,
    kpis: [
      {
        label: 'Payout this week',
        value: `₹${staticAppData.activeAlert.payoutAmount}`,
        hint: '↑ Tuesday rain event',
        accent: 'green' as const,
      },
      {
        label: 'Trust score',
        value: `${user.trustScore}`,
        hint: '↑ Excellent',
        accent: 'sky' as const,
      },
      {
        label: 'Days protected',
        value: '3 days',
        hint: 'Mon–Wed covered',
        accent: 'gold' as const,
      },
      {
        label: 'Insured weekly income',
        value: `₹${user.iwi.toLocaleString('en-IN')}`,
        hint: user.plan.replace('Kavach ', ''),
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
  }
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

function asyncRoute(handler: express.RequestHandler) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next)
  }
}
