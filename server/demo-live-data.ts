import type {
  ClaimTimelineRecord,
  FeatureFlagRecord,
  NotificationRecord,
  PayoutRecord,
  SupportTicketRecord,
  StoredUser,
} from './types.js'
import { buildDemoUser, buildDemoWorkerUser, defaultFeatureFlags, staticAppData } from './seed.js'

type DemoSeedStore = {
  getUserById: (userId: string) => Promise<StoredUser | null>
  upsertUser: (user: StoredUser) => Promise<StoredUser>
  listPayoutRecords: (userId?: string) => Promise<PayoutRecord[]>
  upsertPayoutRecord: (record: PayoutRecord) => Promise<PayoutRecord>
  listClaimTimeline: (userId: string, claimId?: string) => Promise<ClaimTimelineRecord[]>
  appendClaimTimeline: (event: ClaimTimelineRecord) => Promise<ClaimTimelineRecord>
  listNotifications: (userId: string) => Promise<NotificationRecord[]>
  createNotification: (notification: NotificationRecord) => Promise<NotificationRecord>
  listSupportTickets: (userId: string) => Promise<SupportTicketRecord[]>
  upsertSupportTicket: (ticket: SupportTicketRecord) => Promise<SupportTicketRecord>
  getFeatureFlags: () => Promise<FeatureFlagRecord[]>
  upsertFeatureFlag: (flag: FeatureFlagRecord) => Promise<FeatureFlagRecord | null>
}

const demoUsers = [buildDemoUser, buildDemoWorkerUser]

export async function ensureDemoLiveData(store: DemoSeedStore) {
  const users: StoredUser[] = []

  for (const buildUser of demoUsers) {
    const seedUser = buildUser()
    const existing = await store.getUserById(seedUser.id)
    users.push(existing ?? await store.upsertUser(seedUser))
  }

  await ensureFeatureFlags(store)

  for (const user of users) {
    await ensureUserScenario(store, user)
  }
}

async function ensureFeatureFlags(store: DemoSeedStore) {
  const existingFlags = await store.getFeatureFlags()
  if (existingFlags.length > 0) {
    return
  }

  for (const flag of defaultFeatureFlags) {
    await store.upsertFeatureFlag({
      ...flag,
      enabled: true,
      updatedAt: new Date().toISOString(),
    })
  }
}

async function ensureUserScenario(store: DemoSeedStore, user: StoredUser) {
  if ((await store.listPayoutRecords(user.id)).length === 0) {
    const payout = buildSeedPayout(user)
    const claimTimeline = buildSeedClaimTimeline(user, payout)

    await store.upsertPayoutRecord(payout)

    for (const event of claimTimeline) {
      await store.appendClaimTimeline(event)
    }
  } else if ((await store.listClaimTimeline(user.id)).length === 0) {
    const payout = (await store.listPayoutRecords(user.id))[0]
    if (payout) {
      for (const event of buildSeedClaimTimeline(user, payout)) {
        await store.appendClaimTimeline(event)
      }
    }
  }

  if ((await store.listNotifications(user.id)).length === 0) {
    for (const notification of buildSeedNotifications(user)) {
      await store.createNotification(notification)
    }
  }

  if ((await store.listSupportTickets(user.id)).length === 0) {
    await store.upsertSupportTicket(buildSeedSupportTicket(user))
  }
}

function buildSeedPayout(user: StoredUser): PayoutRecord {
  const createdAt = user.role === 'admin'
    ? '2026-04-10T09:32:00.000Z'
    : '2026-04-10T09:18:00.000Z'
  const updatedAt = user.role === 'admin'
    ? '2026-04-10T09:35:00.000Z'
    : '2026-04-10T09:21:00.000Z'

  return {
    reference: `seed-payout-${user.id}`,
    claimId: `seed-claim-${user.id}`,
    userId: user.id,
    amount: user.role === 'admin' ? 642 : staticAppData.activeAlert.payoutAmount,
    status: 'paid',
    provider: 'upi_mock',
    rail: user.upi,
    etaMinutes: 3,
    updatedAt,
    createdAt,
    triggerTitle: staticAppData.activeAlert.type,
    zone: user.zone,
  }
}

function buildSeedClaimTimeline(user: StoredUser, payout: PayoutRecord): ClaimTimelineRecord[] {
  return [
    {
      id: `${payout.claimId}-trigger`,
      claimId: payout.claimId,
      userId: user.id,
      title: 'Trigger detected',
      description: `${staticAppData.activeAlert.type} protection activated in ${user.zone}.`,
      status: 'warning',
      createdAt: payout.createdAt,
    },
    {
      id: `${payout.claimId}-trust`,
      claimId: payout.claimId,
      userId: user.id,
      title: 'AI trust checks cleared',
      description: 'Location, weather, and payout-rail checks stayed within the safe automation band.',
      status: 'success',
      createdAt: addMinutesIso(payout.createdAt, 2),
    },
    {
      id: `${payout.claimId}-paid`,
      claimId: payout.claimId,
      userId: user.id,
      title: 'Instant payout settled',
      description: `₹${payout.amount} settled to ${payout.rail}.`,
      status: 'success',
      createdAt: payout.updatedAt,
    },
  ]
}

function buildSeedNotifications(user: StoredUser): NotificationRecord[] {
  return [
    {
      id: `notif-trigger-${user.id}`,
      userId: user.id,
      title: `${staticAppData.activeAlert.type} trigger verified`,
      body: `Kavach detected a payout-eligible event for ${user.zone} and queued protection automatically.`,
      kind: 'trigger',
      channel: 'in_app',
      status: 'sent',
      createdAt: '2026-04-10T09:15:00.000Z',
      readAt: null,
      actionLabel: 'Open claims',
      actionHref: '/claims',
    },
    {
      id: `notif-payout-${user.id}`,
      userId: user.id,
      title: 'Instant payout completed',
      body: `₹${user.role === 'admin' ? 642 : staticAppData.activeAlert.payoutAmount} reached ${user.upi} through the live mock payout rail.`,
      kind: 'payout',
      channel: 'whatsapp',
      status: 'sent',
      createdAt: '2026-04-10T09:21:00.000Z',
      readAt: null,
      actionLabel: 'View receipt',
      actionHref: `/claims?receipt=seed-payout-${user.id}`,
    },
    {
      id: `notif-policy-${user.id}`,
      userId: user.id,
      title: 'All Kavach features are active',
      body: 'Autopay controls, live alerts, support, receipts, and fraud monitoring are available in this seeded account.',
      kind: 'policy',
      channel: 'in_app',
      status: 'sent',
      createdAt: '2026-04-10T10:05:00.000Z',
      readAt: null,
      actionLabel: 'Open dashboard',
      actionHref: '/dashboard',
    },
  ]
}

function buildSeedSupportTicket(user: StoredUser): SupportTicketRecord {
  const createdAt = '2026-04-10T10:08:00.000Z'

  return {
    ticketId: `support-${user.id}-seed`,
    userId: user.id,
    status: 'resolved',
    channel: 'chat',
    callbackEtaMinutes: 2,
    hotline: '1800-313-KAVACH',
    message: 'Guardian support reviewed the seeded live-demo account and confirmed payout routing is healthy.',
    createdAt,
    updatedAt: addMinutesIso(createdAt, 9),
  }
}

function addMinutesIso(isoDate: string, minutes: number) {
  const date = new Date(isoDate)
  date.setUTCMinutes(date.getUTCMinutes() + minutes)
  return date.toISOString()
}
