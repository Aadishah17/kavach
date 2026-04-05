import type { IncomingMessage, ServerResponse } from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { createKavachServer, type KavachServerOptions } from './app.js'

type ApiHandler = {
  close: () => Promise<void>
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>
}

export function createVercelApiHandler(options: KavachServerOptions = {}): ApiHandler {
  const server = createKavachServer({
    ...resolveVercelOptions(options),
    serveStatic: false,
  })

  let initPromise: Promise<void> | null = null

  return {
    close: async () => {
      try {
        await initPromise
      } catch {
        // Ignore init failures during shutdown.
      }

      await server.close()
    },
    handler: async (req, res) => {
      req.url = normalizeApiUrl(req.url)

      try {
        if (!initPromise) {
          initPromise = server.init().catch((error) => {
            initPromise = null
            throw error
          })
        }

        await initPromise
        server.app(req as never, res as never)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        console.error('Kavach Vercel API handler failed', error)

        if (res.headersSent) {
          res.end()
          return
        }

        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(
          JSON.stringify({
            error: {
              code: 'internal_error',
              message,
            },
          }),
        )
      }
    },
  }
}

function normalizeApiUrl(rawUrl = '/api') {
  const requestUrl = new URL(rawUrl, 'http://localhost')
  const rewrittenPath = requestUrl.searchParams.get('path')

  if (rewrittenPath) {
    requestUrl.searchParams.delete('path')
    requestUrl.pathname = `/api/${rewrittenPath}`
  }

  return `${requestUrl.pathname}${requestUrl.search}`
}

function resolveVercelOptions(options: KavachServerOptions): KavachServerOptions {
  if (options.dbPath || !isVercelRuntime() || process.env.USE_FIRESTORE === 'true') {
    return options
  }

  return {
    ...options,
    dbPath: path.join(os.tmpdir(), 'kavach', 'db.sqlite'),
    legacyJsonPath: null,
  }
}

function isVercelRuntime() {
  return process.env.VERCEL === '1' || typeof process.env.VERCEL_ENV === 'string'
}
