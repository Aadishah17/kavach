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
