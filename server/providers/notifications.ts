import { randomUUID } from 'node:crypto'
import type { NotificationChannel, NotificationRecord } from '../types.js'

export function buildNotificationBatch(input: {
  userId: string
  title: string
  body: string
  actionLabel?: string
  actionHref?: string
  kind: NotificationRecord['kind']
  channels?: Array<NotificationRecord['channel']>
}) {
  const createdAt = new Date().toISOString()
  const channels: NotificationChannel[] = input.channels?.length ? [...input.channels] : ['in_app']

  return channels.map<NotificationRecord>((channel) => ({
    id: randomUUID(),
    userId: input.userId,
    title: input.title,
    body: input.body,
    kind: input.kind,
    channel,
    status: channel === 'in_app' ? 'sent' : 'queued',
    createdAt,
    readAt: null,
    actionLabel: input.actionLabel ?? null,
    actionHref: input.actionHref ?? null,
  }))
}
