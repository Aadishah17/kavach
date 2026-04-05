import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterEach, beforeEach, describe, test } from 'node:test'
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { createVercelApiHandler } from '../../server/vercel-handler.js'

describe('Vercel API handler', () => {
  let tempDir = ''
  let baseUrl = ''
  let httpServer: Server | null = null
  let closeHandler = async () => {}

  beforeEach(async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'kavach-vercel-tests-'))

    const api = createVercelApiHandler({
      dbPath: path.join(tempDir, 'db.sqlite'),
      legacyJsonPath: null,
    })

    closeHandler = api.close
    httpServer = await new Promise<Server>((resolve) => {
      const listener = createServer((req, res) => {
        void api.handler(req, res)
      })
      listener.listen(0, '127.0.0.1', () => resolve(listener))
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

    await closeHandler()
    await rm(tempDir, { recursive: true, force: true })
  })

  test('serves signup through the Vercel api function entrypoint', async () => {
    const response = await fetch(`${baseUrl}/api?path=auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Aman Singh',
        phone: '9876543210',
        platforms: ['Zomato'],
        city: 'Bengaluru',
        zone: 'Koramangala Central',
        plan: 'Standard',
        upi: 'aman@upi',
      }),
    })

    assert.equal(response.status, 201)

    const payload = await response.json() as {
      token: string
      user: {
        name: string
        plan: string
      }
    }

    assert.equal(typeof payload.token, 'string')
    assert.equal(payload.user.name, 'Aman Singh')
    assert.equal(payload.user.plan, 'Kavach Standard')
  })

  test('declares an api rewrite for nested auth routes', async () => {
    const configPath = path.resolve(process.cwd(), 'vercel.json')
    const config = JSON.parse(await readFile(configPath, 'utf8')) as {
      rewrites?: Array<{ source: string; destination: string }>
    }

    assert.deepEqual(config.rewrites, [
      {
        source: '/api/:path*',
        destination: '/api?path=:path*',
      },
      {
        source: '/(.*)',
        destination: '/index.html',
      },
    ])
  })

  test('bundles the Android apk asset for the landing page download', async () => {
    const asset = await stat(path.resolve(process.cwd(), 'public', 'downloads', 'kavach-android.apk'))
    assert.ok(asset.size > 0)
  })
})
