import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { createKavachServer, resolveServerPaths } from './app.js'

const paths = resolveServerPaths()

for (const suffix of ['', '-shm', '-wal']) {
  const filePath = `${paths.dbPath}${suffix}`
  if (existsSync(filePath)) {
    await rm(filePath, { force: true })
  }
}

const server = createKavachServer({
  dbPath: paths.dbPath,
  legacyJsonPath: null,
  serveStatic: false,
})

await server.init()
await server.close()

console.log(`Kavach demo database reset at ${paths.dbPath}`)
