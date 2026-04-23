import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function collectTestFiles(rootDir) {
  const files = []
  const entries = readdirSync(rootDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(fullPath))
      continue
    }

    if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      files.push(fullPath)
    }
  }

  return files
}

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const testsRoot = path.join(repositoryRoot, 'tests', 'server')
const testFiles = collectTestFiles(testsRoot).sort()

if (testFiles.length === 0) {
  console.error('No server test files were found under tests/server.')
  process.exit(1)
}

const currentNodeMajorVersion = Number.parseInt(process.versions.node.split('.')[0], 10)
const hasNativeSqliteSupport = Number.isFinite(currentNodeMajorVersion) && currentNodeMajorVersion >= 22

const command = hasNativeSqliteSupport ? process.execPath : 'npx'
const args = hasNativeSqliteSupport
  ? ['--experimental-sqlite', './node_modules/tsx/dist/cli.mjs', '--test', ...testFiles]
  : ['-y', 'node@22', '--experimental-sqlite', './node_modules/tsx/dist/cli.mjs', '--test', ...testFiles]

const result = spawnSync(command, args, {
  stdio: 'inherit',
  cwd: repositoryRoot,
  shell: false,
})

if (typeof result.status === 'number') {
  process.exit(result.status)
}

process.exit(1)
