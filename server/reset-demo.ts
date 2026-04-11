import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { createKavachServer, resolveServerPaths } from './app.js'

const paths = resolveServerPaths()
const storeDriver = process.env.DATA_STORE?.trim().toLowerCase()
const usesRemoteStore = storeDriver === 'mongodb'
  || storeDriver === 'firestore'
  || process.env.USE_FIRESTORE === 'true'
  || typeof process.env.MONGODB_URI === 'string'

if (!usesRemoteStore) {
  for (const suffix of ['', '-shm', '-wal']) {
    const filePath = `${paths.dbPath}${suffix}`
    if (existsSync(filePath)) {
      await rm(filePath, { force: true })
    }
  }
}

const server = createKavachServer({
  dbPath: paths.dbPath,
  legacyJsonPath: null,
  serveStatic: false,
})

await server.init()
await server.close()

console.log(
  usesRemoteStore
    ? 'Kavach remote demo database initialized and seeded.'
    : `Kavach demo database reset at ${paths.dbPath}`,
)
