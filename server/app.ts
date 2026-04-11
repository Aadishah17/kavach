import { existsSync } from 'node:fs'
import type { Server } from 'node:http'
import path from 'node:path'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import morgan from 'morgan'
import {
  autopayManagementSchema,
  fraudReviewActionSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
  payoutSimulationSchema,
  policyUpgradeSchema,
  profileSettingsPayloadSchema,
  signupSchema,
  supportRequestSchema,
} from '../packages/shared/src/contracts.js'
import { buildSignupUser, defaultFeatureFlags, demoProfile, planCatalog, staticAppData } from './seed.js'
import { SqliteStore } from './store.js'
import { FirestoreStore } from './firestore-store.js'
import { MongoStore } from './mongo-store.js'
import {
  buildAnalyticsExportCsv,
  buildAnalyticsIntelligence,
  buildDashboardIntelligence,
  buildFraudAssessment,
  buildPayoutState,
  buildRiskOutlook,
  simulateInstantPayout,
} from './intelligence.js'
import { buildNotificationBatch } from './providers/notifications.js'
import { requestOtpChallenge, verifyOtpChallenge } from './providers/otp.js'
import type {
  ClaimTimelineRecord,
  FraudReviewRecord,
  PayoutRecord,
  PlanName,
  ProfileSetting,
  StoredUser,
  SupportTicketRecord,
} from './types.js'

type Store = SqliteStore | FirestoreStore | MongoStore

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

function createStore({
  dbPath,
  legacyJsonPath,
}: {
  dbPath: string
  legacyJsonPath: string | null
}) {
  const storeDriver = resolveStoreDriver()

  if (storeDriver === 'mongodb') {
    const mongoUri = process.env.MONGODB_URI

    if (!mongoUri) {
      throw new Error('MONGODB_URI is required when DATA_STORE is set to mongodb.')
    }

    return new MongoStore(mongoUri, {
      dbName: process.env.MONGODB_DB_NAME ?? 'kavach',
    })
  }

  if (storeDriver === 'firestore') {
    return new FirestoreStore()
  }

  return new SqliteStore(dbPath, { legacyJsonPath })
}

function resolveStoreDriver() {
  const configured = process.env.DATA_STORE?.trim().toLowerCase()

  if (configured === 'mongodb') {
    return 'mongodb'
  }

  if (configured === 'firestore') {
    return 'firestore'
  }

  if (configured === 'sqlite') {
    return 'sqlite'
  }

  if (process.env.MONGODB_URI) {
    return 'mongodb'
  }

  if (process.env.USE_FIRESTORE === 'true') {
    return 'firestore'
  }

  return 'sqlite'
}

export function createKavachServer(options: KavachServerOptions = {}) {
  const paths = resolveServerPaths()
  const port = options.port ?? Number(process.env.PORT ?? 8787)
  const dbPath = options.dbPath ?? paths.dbPath
  const legacyJsonPath = options.legacyJsonPath ?? paths.legacyJsonPath
  const webDistPath = options.webDistPath ?? paths.webDistPath
  const serveStatic = options.serveStatic ?? true

  const store = createStore({ dbPath, legacyJsonPath })
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: '*' }))
  app.use(compression())

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'))
  }

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  })

  app.use('/api/', apiLimiter)
  app.use(express.json({ limit: '1mb' }))

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

  app.post('/api/auth/otp/request', asyncRoute(async (req, res) => {
    const parsed = otpRequestSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_otp_request',
          message: parsed.error.issues[0]?.message ?? 'Invalid OTP request',
        },
      })
      return
    }

    const requested = requestOtpChallenge({
      phone: parsed.data.phone,
      purpose: parsed.data.purpose,
      signupPayload: parsed.data.signup,
    })

    await store.createOtpChallenge(requested.challenge)

    res.status(201).json({
      challenge: {
        challengeId: requested.challenge.id,
        phone: requested.challenge.phone,
        purpose: requested.challenge.purpose,
        expiresAt: requested.challenge.expiresAt,
        resendAfterSeconds: requested.resendAfterSeconds,
        delivery: requested.delivery,
        maskedDestination: requested.maskedDestination,
        demoCode: requested.demoCode,
      },
    })
  }))

  app.post('/api/auth/otp/verify', asyncRoute(async (req, res) => {
    const parsed = otpVerifySchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_otp_verify',
          message: parsed.error.issues[0]?.message ?? 'Invalid OTP verify request',
        },
      })
      return
    }

    const challenge = await store.getOtpChallenge(parsed.data.challengeId)
    if (!challenge || challenge.phoneNormalized !== normalizePhone(parsed.data.phone)) {
      res.status(404).json({
        error: {
          code: 'otp_not_found',
          message: 'No OTP challenge exists for that phone number.',
        },
      })
      return
    }

    const verification = verifyOtpChallenge(challenge, parsed.data.code)
    await store.updateOtpChallenge(verification.challenge)

    if (!verification.ok) {
      res.status(400).json({
        error: {
          code: verification.errorCode,
          message: verification.errorMessage,
        },
      })
      return
    }

    let user: StoredUser | null = null

    try {
      user = challenge.purpose === 'signup'
        ? await upsertSignupWorker(store, verification.challenge.signupPayload)
        : await store.getUserByPhone(parsed.data.phone)
    } catch (error) {
      if (error instanceof EmailConflictError) {
        res.status(409).json({
          error: {
            code: 'email_in_use',
            message: 'That email is already linked to another Kavach account.',
          },
        })
        return
      }

      throw error
    }

    if (!user) {
      res.status(404).json({
        error: {
          code: 'user_not_found',
          message: 'No Kavach account was found for that phone number.',
        },
      })
      return
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

    let user: StoredUser

    try {
      user = await upsertSignupWorker(store, parsed.data)
    } catch (error) {
      if (error instanceof EmailConflictError) {
        res.status(409).json({
          error: {
            code: 'email_in_use',
            message: 'That email is already linked to another Kavach account.',
          },
        })
        return
      }

      throw error
    }

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

    const identifier = resolveLoginIdentifier(parsed.data)
    if (!identifier) {
      res.status(400).json({
        error: {
          code: 'invalid_login_payload',
          message: 'Phone number or email is required',
        },
      })
      return
    }

    const user = isEmailIdentifier(identifier)
      ? await store.getUserByEmail(identifier)
      : await store.getUserByPhone(identifier)

    if (!user) {
      res.status(404).json({
        error: {
          code: 'user_not_found',
          message: 'No Kavach account was found for that phone number or email.',
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
      ...(await buildDashboardRouteData(store, auth.user)),
    })
  }))

  app.get('/api/app-data/claims', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    res.json({
      user: publicUser(auth.user),
      ...(await buildClaimsRouteData(store, auth.user)),
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
      ...(await buildAnalyticsRouteData(store, auth.user)),
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
      ...(await buildAlertsRouteData(store, auth.user)),
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
    await persistSimulatedPayout(store, auth.user, simulation.payout)
    res.status(201).json(simulation)
  }))

  app.get('/api/payouts/:reference/receipt', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    const reference = Array.isArray(req.params.reference) ? req.params.reference[0] : req.params.reference
    const payoutRecord = reference ? await store.getPayoutRecord(reference) : null
    if (!payoutRecord || payoutRecord.userId !== auth.user.id) {
      res.status(404).json({
        error: {
          code: 'receipt_not_found',
          message: 'No payout receipt exists for that reference.',
        },
      })
      return
    }
    const payout = payoutRecord

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

    const ticket = await persistSupportRequest(store, auth.user, parsed.data.channel)

    res.status(201).json({
      ticketId: ticket.ticketId,
      status: ticket.status,
      channel: ticket.channel,
      callbackEtaMinutes: ticket.callbackEtaMinutes,
      hotline: ticket.hotline,
      message: ticket.message,
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

    await emitNotifications(store, {
      userId: updatedUser.id,
      kind: 'policy',
      title: `Plan upgraded to Kavach ${parsed.data.plan}`,
      body: `Weekly premium is now ₹${updatedUser.weeklyPremium} with updated earnings protection.`,
      actionLabel: 'Review coverage',
      actionHref: '/policy',
    })

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

    await emitNotifications(store, {
      userId: updatedUser.id,
      kind: 'autopay',
      title: parsed.data.enabled ? 'AutoPay resumed' : 'AutoPay paused',
      body: parsed.data.enabled
        ? `Weekly deductions will continue on ${updatedUser.nextDeduction}.`
        : 'Future weekly deductions are paused until you resume AutoPay.',
      actionLabel: 'Manage policy',
      actionHref: '/policy',
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

  app.post('/api/admin/fraud/:id/action', asyncRoute(async (req, res) => {
    const auth = await requireAuth(store, req, res)
    if (!auth) {
      return
    }

    if (!requireAdmin(auth.user, res)) {
      return
    }

    const parsed = fraudReviewActionSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'invalid_fraud_action',
          message: parsed.error.issues[0]?.message ?? 'Invalid fraud action request',
        },
      })
      return
    }

    const reviewId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const review: FraudReviewRecord | null = reviewId ? await store.applyFraudReviewAction(reviewId, parsed.data.action) : null

    if (!review) {
      res.status(404).json({
        error: {
          code: 'fraud_review_not_found',
          message: 'No fraud review exists for that id.',
        },
      })
      return
    }

    res.json({
      review,
      fraudQueue: await store.listFraudReviews(),
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
      trustProof: staticAppData.trustProof,
      faq: staticAppData.faq,
      onboardingChecklist: staticAppData.onboardingChecklist,
      heroActiveAlert: staticAppData.activeAlert,
      heroWorker: {
        zone: demoProfile.zone,
        trustScore: demoProfile.trustScore,
      },
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
    await store.close()
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
  const dashboard = await buildDashboardRouteData(store, user)
  const claims = await buildClaimsRouteData(store, user)
  const alerts = await buildAlertsRouteData(store, user)
  const analytics = user.role === 'admin'
    ? await buildAnalyticsRouteData(store, user)
    : undefined

  return {
    user: publicUser(user),
    dashboard,
    claims,
    policy: buildPolicySnapshot(user, settings),
    alerts: {
      feed: alerts.alertsFeed,
      emergencyResources: alerts.emergencyResources,
      supportContacts: alerts.supportContacts,
      notifications: alerts.notifications,
      latestTicket: alerts.latestTicket,
    },
    profile: {
      documents: staticAppData.profileDocuments,
      settings,
      monthlyProtectedAmount: staticAppData.monthlyProtectedAmount,
    },
    analytics: analytics
      ? {
          kpis: analytics.analyticsKpis,
          weeklyChartData: analytics.weeklyChartData,
          claimsBreakdown: analytics.claimsBreakdown,
          fraudSignals: analytics.fraudSignals,
          financialHealth: analytics.financialHealth,
          unitEconomics: analytics.unitEconomics,
          lossRatio: analytics.lossRatio,
          predictedClaimsNextWeek: analytics.predictedClaimsNextWeek,
          forecastSummary: analytics.forecastSummary,
          zoneForecasts: analytics.zoneForecasts,
          fraudQueue: analytics.fraudQueue,
          recentPayouts: analytics.recentPayouts,
          payoutOps: analytics.payoutOps,
          featureFlags: analytics.featureFlags,
        }
      : undefined,
  }
}

async function buildDashboardRouteData(store: Store, user: StoredUser) {
  const base = buildDashboardData(user)
  const featureFlags = await loadFeatureFlags(store)
  const notifications = await store.listNotifications(user.id)
  const payoutRecords = await store.listPayoutRecords(user.id)

  return {
    ...base,
    payoutHistory: payoutRowsFromRecords(payoutRecords, user),
    payoutState: payoutRecords[0] ? toPayoutState(payoutRecords[0]) : base.payoutState,
    notificationsUnread: notifications.filter((item) => item.readAt == null).length,
    featureFlags: featureFlags.map(toFeatureFlagPayload),
  }
}

async function buildClaimsRouteData(store: Store, user: StoredUser) {
  const payoutRecords = await store.listPayoutRecords(user.id)
  const latestPayout = payoutRecords[0] ?? null
  const timeline = latestPayout ? await store.listClaimTimeline(user.id, latestPayout.claimId) : []
  const supportTicket = await store.getLatestSupportTicket(user.id)

  return {
    activeAlert: staticAppData.activeAlert,
    verificationSignals: staticAppData.verificationSignals,
    payoutHistory: payoutRowsFromRecords(payoutRecords, user),
    premiumHistory: buildPremiumHistory(user),
    payoutState: latestPayout ? toPayoutState(latestPayout) : buildPayoutState(user),
    fraudAssessment: buildFraudAssessment(user),
    timeline: timeline.map((entry) => ({
      id: entry.id,
      claimId: entry.claimId,
      title: entry.title,
      description: entry.description,
      status: entry.status,
      createdAt: entry.createdAt,
    })),
    supportTicket: supportTicket ? toSupportTicketSummary(supportTicket) : null,
    latestReceipt: latestPayout
      ? {
          reference: latestPayout.reference,
          downloadPath: `/api/payouts/${latestPayout.reference}/receipt`,
          shareLabel: 'Share receipt',
        }
      : null,
  }
}

async function buildAlertsRouteData(store: Store, user: StoredUser) {
  const notifications = await store.listNotifications(user.id)
  const supportTicket = await store.getLatestSupportTicket(user.id)

  return {
    alertsFeed: [
      ...notifications.slice(0, 3).map((item) => ({
        id: item.id,
        category: item.kind,
        title: item.title,
        description: item.body,
        status: item.readAt ? 'Read' : 'New',
        createdAt: item.createdAt,
      })),
      ...staticAppData.alertsFeed,
    ],
    emergencyResources: staticAppData.emergencyResources,
    supportContacts: staticAppData.supportContacts,
    notifications: notifications.map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      kind: item.kind,
      channel: item.channel,
      status: item.status,
      createdAt: item.createdAt,
      readAt: item.readAt,
      actionLabel: item.actionLabel ?? undefined,
      actionHref: item.actionHref ?? undefined,
    })),
    latestTicket: supportTicket ? toSupportTicketSummary(supportTicket) : null,
  }
}

async function buildAnalyticsRouteData(store: Store, user: StoredUser) {
  await ensureFraudReviews(store, user)
  const featureFlags = await loadFeatureFlags(store)
  const payoutRecords = await store.listPayoutRecords()
  const fraudQueue = await store.listFraudReviews()
  const base = buildAnalyticsIntelligence(user)

  return {
    analyticsKpis: staticAppData.analyticsKpis,
    weeklyChartData: staticAppData.weeklyChartData,
    claimsBreakdown: staticAppData.claimsBreakdown,
    fraudSignals: staticAppData.fraudSignals,
    financialHealth: staticAppData.financialHealth,
    unitEconomics: staticAppData.unitEconomics,
    lossRatio: base.lossRatio,
    predictedClaimsNextWeek: base.predictedClaimsNextWeek,
    forecastSummary: base.forecastSummary,
    zoneForecasts: base.zoneForecasts,
    fraudQueue: fraudQueue.map((review) => ({
      id: review.id,
      workerName: review.workerName,
      zone: review.zone,
      riskLabel: review.riskLabel,
      score: review.score,
      reason: review.reason,
      status: review.status,
    })),
    recentPayouts: payoutRecords.length > 0 ? payoutRecords.slice(0, 5).map(toPayoutState) : base.recentPayouts,
    payoutOps: payoutRecords.slice(0, 8).map((record) => ({
      reference: record.reference,
      workerName: record.userId,
      zone: record.zone,
      amount: record.amount,
      provider: record.provider,
      status: record.status,
      updatedAt: record.updatedAt,
    })),
    featureFlags: featureFlags.map(toFeatureFlagPayload),
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

async function upsertSignupWorker(store: Store, payload: Parameters<typeof buildSignupUser>[0] | null) {
  if (!payload) {
    throw new Error('Signup payload missing for OTP verification')
  }

  const existing = await store.getUserByPhone(payload.phone)
  const requestedEmail = normalizeEmail(payload.email)
  if (requestedEmail) {
    const existingByEmail = await store.getUserByEmail(requestedEmail)
    if (existingByEmail && existingByEmail.id !== existing?.id) {
      throw new EmailConflictError()
    }
  }

  const built = buildSignupUser(payload)

  return existing
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
}

async function loadFeatureFlags(store: Store) {
  const existing = await store.getFeatureFlags()
  if (existing.length > 0) {
    return existing
  }

  for (const flag of defaultFeatureFlags) {
    await store.upsertFeatureFlag({
      ...flag,
      updatedAt: new Date().toISOString(),
    })
  }

  return store.getFeatureFlags()
}

async function ensureFraudReviews(store: Store, user: StoredUser) {
  const existing = await store.listFraudReviews()
  if (existing.length > 0) {
    return existing
  }

  const seeds = buildAnalyticsIntelligence(user).fraudQueue
  for (const item of seeds) {
    await store.upsertFraudReview({
      id: item.id,
      userId: user.id,
      workerName: item.workerName,
      zone: item.zone,
      riskLabel: item.riskLabel,
      score: item.score,
      reason: item.reason,
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      resolutionNote: null,
    })
  }

  return store.listFraudReviews()
}

async function emitNotifications(
  store: Store,
  input: Parameters<typeof buildNotificationBatch>[0],
) {
  const batch = buildNotificationBatch(input)
  for (const item of batch) {
    await store.createNotification(item)
  }
}

async function persistSimulatedPayout(
  store: Store,
  user: StoredUser,
  payout: ReturnType<typeof buildPayoutState>,
) {
  const claimId = `claim-${payout.reference}`
  const createdAt = new Date().toISOString()
  const record: PayoutRecord = {
    reference: payout.reference,
    claimId,
    userId: user.id,
    amount: payout.amount,
    status: payout.status,
    provider: payout.provider,
    rail: payout.rail,
    etaMinutes: payout.etaMinutes,
    updatedAt: payout.updatedAt,
    createdAt,
    triggerTitle: staticAppData.activeAlert.type,
    zone: user.zone,
  }

  await store.upsertPayoutRecord(record)

  const timeline: ClaimTimelineRecord[] = [
    {
      id: `${claimId}-trigger`,
      claimId,
      userId: user.id,
      title: 'Trigger detected',
      description: `${staticAppData.activeAlert.type} protection activated in ${user.zone}.`,
      status: 'warning',
      createdAt,
    },
    {
      id: `${claimId}-fraud`,
      claimId,
      userId: user.id,
      title: 'Fraud checks cleared',
      description: 'GPS, weather, and duplicate-claim signals support zero-touch processing.',
      status: 'success',
      createdAt: payout.updatedAt,
    },
    {
      id: `${claimId}-paid`,
      claimId,
      userId: user.id,
      title: 'Instant payout completed',
      description: `₹${payout.amount} settled via ${payout.provider} to ${payout.rail}.`,
      status: 'success',
      createdAt: payout.updatedAt,
    },
  ]

  for (const event of timeline) {
    await store.appendClaimTimeline(event)
  }

  await emitNotifications(store, {
    userId: user.id,
    kind: 'payout',
    title: 'Instant payout sent',
    body: `₹${payout.amount} has been queued to ${payout.rail} via ${payout.provider}.`,
    actionLabel: 'View receipt',
    actionHref: `/claims?receipt=${payout.reference}`,
    channels: ['in_app', 'whatsapp'],
  })

  return record
}

async function persistSupportRequest(
  store: Store,
  user: StoredUser,
  channel: SupportTicketRecord['channel'],
) {
  const createdAt = new Date().toISOString()
  const ticket: SupportTicketRecord = {
    ticketId: `support-${user.id}-${Date.now()}`,
    userId: user.id,
    status: 'queued',
    channel,
    callbackEtaMinutes: 2,
    hotline: '1800-313-KAVACH',
    message: 'Guardian support has been queued and will contact the worker shortly.',
    createdAt,
    updatedAt: createdAt,
  }

  await store.upsertSupportTicket(ticket)

  const latestPayout = (await store.listPayoutRecords(user.id))[0]
  if (latestPayout) {
    await store.appendClaimTimeline({
      id: `${latestPayout.claimId}-support-${Date.now()}`,
      claimId: latestPayout.claimId,
      userId: user.id,
      title: 'Guardian support queued',
      description: `${channel} support requested for the latest disruption event.`,
      status: 'info',
      createdAt,
    })
  }

  await emitNotifications(store, {
    userId: user.id,
    kind: 'support',
    title: 'Guardian support requested',
    body: `${channel} support is queued with a ${ticket.callbackEtaMinutes} minute ETA.`,
    actionLabel: 'Open support',
    actionHref: '/alerts',
    channels: ['in_app', 'whatsapp'],
  })

  return ticket
}

function payoutRowsFromRecords(records: PayoutRecord[], user: StoredUser) {
  if (records.length === 0) {
    return staticAppData.payoutHistory
  }

  return records.map((record) => ({
    date: formatShortDate(record.updatedAt),
    type: '💸 Payout',
    disruption: record.triggerTitle,
    zone: record.zone || user.zone,
    amount: record.amount,
    status: capitalizePayoutStatus(record.status),
  }))
}

function toPayoutState(record: PayoutRecord) {
  return {
    reference: record.reference,
    amount: record.amount,
    status: record.status,
    provider: record.provider,
    rail: record.rail,
    etaMinutes: record.etaMinutes,
    updatedAt: record.updatedAt,
  }
}

function toSupportTicketSummary(ticket: SupportTicketRecord) {
  return {
    ticketId: ticket.ticketId,
    status: ticket.status,
    channel: ticket.channel,
    callbackEtaMinutes: ticket.callbackEtaMinutes,
    hotline: ticket.hotline,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    message: ticket.message,
  }
}

function toFeatureFlagPayload(flag: Awaited<ReturnType<typeof loadFeatureFlags>>[number]) {
  return {
    key: flag.key,
    label: flag.label,
    description: flag.description,
    enabled: flag.enabled,
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

function formatShortDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function capitalizePayoutStatus(status: PayoutRecord['status']) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

function normalizeEmail(email?: string | null) {
  const normalized = email?.trim().toLowerCase()
  return normalized ? normalized : null
}

function resolveLoginIdentifier(input: { identifier?: string; phone?: string; email?: string }) {
  return input.identifier?.trim()
    || input.email?.trim().toLowerCase()
    || input.phone?.trim()
    || null
}

function isEmailIdentifier(identifier: string) {
  return identifier.includes('@')
}

class EmailConflictError extends Error {
  constructor() {
    super('email_in_use')
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
