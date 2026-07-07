#!/usr/bin/env node
// Idempotent project bootstrapper: brings a fresh checkout to a running web + API + database stack.
// Safe to re-run. Cross-platform (Node only — a bash script would break on this Windows-primary repo).
//
//   pnpm run setup                         # interactive preset picker
//   pnpm run setup --preset=ecommerce --no-interaction
//   pnpm run setup --php-bin="D:/php/php-8.4.22/php.exe"   # if 8.4 isn't the default `php`
//
// (`pnpm setup` is pnpm's own built-in command, so use `pnpm run setup`.)

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const backend = path.join(root, 'backend')
const envPath = path.join(backend, '.env')
const envExample = path.join(backend, '.env.example')

// --- args ------------------------------------------------------------------
const argv = process.argv.slice(2)
const flag = (n) => argv.includes(`--${n}`)
const opt = (n, d) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`))
  return hit ? hit.slice(n.length + 3) : d
}
const noInteraction = flag('no-interaction')
const preset = opt('preset') // 'basic' | 'ecommerce' | undefined
const forceSqlite = flag('sqlite')

// --- console ---------------------------------------------------------------
const C = { reset: '\x1b[0m', cyan: '\x1b[36m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', dim: '\x1b[2m' }
let stepNo = 0
const step = (m) => console.log(`\n${C.cyan}▶ ${++stepNo}. ${m}${C.reset}`)
const info = (m) => console.log(`  ${m}`)
const ok = (m) => console.log(`  ${C.green}✓${C.reset} ${m}`)
const warn = (m) => console.log(`  ${C.yellow}!${C.reset} ${m}`)
const die = (m) => {
  console.error(`\n${C.red}✗ ${m}${C.reset}\n`)
  process.exit(1)
}

// --- process helpers -------------------------------------------------------
let childEnv = process.env

// Build a single shell command line (quoting tokens with spaces) rather than passing an args array
// with `shell: true` — the latter triggers Node's DEP0190 and doesn't escape. `shell: true` is
// required so Windows resolves `pnpm`/`composer` (.cmd/.bat) and PATH-based `php`.
const line = (cmd, args) => [cmd, ...args].map((t) => (/\s/.test(t) ? `"${t}"` : t)).join(' ')

const run = (cmd, args, { cwd = root, allowFail = false, env = childEnv } = {}) => {
  const r = spawnSync(line(cmd, args), { stdio: 'inherit', shell: true, cwd, env })
  if (r.status !== 0 && !allowFail) die(`\`${cmd} ${args.join(' ')}\` failed (exit ${r.status ?? r.signal}).`)
  return r.status === 0
}
const capture = (cmd, args, { cwd = root, env = childEnv } = {}) => {
  const r = spawnSync(line(cmd, args), { encoding: 'utf8', shell: true, cwd, env })
  return { ok: r.status === 0, out: (r.stdout ?? '').trim(), err: (r.stderr ?? '').trim() }
}

// --- .env helpers ----------------------------------------------------------
const readEnv = () => (fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '')
const getEnv = (key) => {
  const m = readEnv().match(new RegExp(`^${key}=(.*)$`, 'm'))
  return m ? m[1].trim() : ''
}
const setEnv = (key, value) => {
  let txt = readEnv()
  const re = new RegExp(`^${key}=.*$`, 'm')
  txt = re.test(txt) ? txt.replace(re, `${key}=${value}`) : `${txt}${txt.endsWith('\n') || txt === '' ? '' : '\n'}${key}=${value}\n`
  fs.writeFileSync(envPath, txt)
}

// --- 1. preflight ----------------------------------------------------------
function preflight() {
  step('Preflight')

  const node = process.versions.node.split('.').map(Number)
  if (node[0] < 22) die(`Node >= 22 required (found ${process.versions.node}).`)
  ok(`Node ${process.versions.node}`)

  const pnpm = capture('pnpm', ['--version'])
  if (!pnpm.ok || Number(pnpm.out.split('.')[0]) < 10) die(`pnpm >= 10 required (found ${pnpm.out || 'none'}).`)
  ok(`pnpm ${pnpm.out}`)

  if (!capture('composer', ['--version']).ok) die('Composer not found on PATH.')
  ok('Composer present')

  const php = resolvePhp()
  if (!php) {
    die(
      'PHP >= 8.4 not found. The Laravel 13 stack needs the 8.4 RUNTIME (not just the composer\n' +
        '  platform pin). Put 8.4 on PATH, or pass --php-bin=<path> / set STARTERKIT_PHP.\n' +
        '  See docs/getting-started.md.',
    )
  }
  ok(`PHP ${php.version} (${php.bin})`)
  // Make every downstream `php`/`composer`/`artisan` use the 8.4 binary.
  if (php.bin !== 'php') {
    const dir = path.dirname(path.resolve(php.bin))
    childEnv = { ...process.env, PATH: dir + path.delimiter + process.env.PATH }
  }

  const docker = !forceSqlite && capture('docker', ['info']).ok
  if (forceSqlite) info('SQLite forced (--sqlite).')
  else info(docker ? 'Docker detected — will use Postgres + Redis.' : 'Docker not available — will fall back to SQLite.')
  return { docker }
}

function resolvePhp() {
  for (const bin of [opt('php-bin'), process.env.STARTERKIT_PHP, 'php'].filter(Boolean)) {
    const r = capture(bin, ['--version'])
    const m = r.ok && r.out.match(/PHP (\d+)\.(\d+)\.\d+/)
    if (m && (Number(m[1]) > 8 || (Number(m[1]) === 8 && Number(m[2]) >= 4))) return { bin, version: m[0].replace('PHP ', '') }
  }
  return null
}

// --- 2..8 steps ------------------------------------------------------------
function backendEnv() {
  step('Backend environment')
  if (fs.existsSync(envPath)) {
    ok('.env already present')
  } else {
    fs.copyFileSync(envExample, envPath)
    ok('Created backend/.env from .env.example')
  }
}

function backendDeps() {
  step('Backend dependencies')
  run('composer', ['install', '--no-interaction', '--prefer-dist'], { cwd: backend })
}

function appKey() {
  step('Application key')
  if (getEnv('APP_KEY')) {
    ok('APP_KEY already set')
  } else {
    run('php', ['artisan', 'key:generate', '--force'], { cwd: backend })
  }
}

function dataLayer(docker) {
  step('Data layer')
  if (docker) {
    run('pnpm', ['db:up'])
    ok('Postgres + Redis are up')
  } else {
    // Keep the kit runnable with zero services: SQLite + local file drivers (no Redis).
    const sqlite = path.join(backend, 'database', 'database.sqlite')
    fs.mkdirSync(path.dirname(sqlite), { recursive: true })
    if (!fs.existsSync(sqlite)) fs.writeFileSync(sqlite, '')
    setEnv('DB_CONNECTION', 'sqlite')
    setEnv('DB_DATABASE', sqlite.replace(/\\/g, '/'))
    setEnv('SESSION_DRIVER', 'file')
    setEnv('CACHE_STORE', 'file')
    setEnv('QUEUE_CONNECTION', 'sync')
    warn('Using SQLite + file drivers (no Docker). For the full stack, install Docker and re-run.')
  }
}

function frontendDeps() {
  step('Frontend dependencies')
  run('pnpm', ['install'])
  // The shared packages (@app/config/types/ui) are consumed as source (Vite path aliases), so there
  // is no build step to run here. `pnpm install` wires the workspace links the apps resolve through.
}

function shapeApp() {
  step('Shape the app (kit:install)')
  const args = ['artisan', 'kit:install']
  if (preset) args.push(`--preset=${preset}`)
  if (noInteraction) args.push('--no-interaction')
  run('php', args, { cwd: backend })
}

function nextSteps() {
  console.log(`\n${C.green}✓ The starter kit is set up.${C.reset}`)
  console.log(`\n  Start it with:  ${C.cyan}pnpm dev${C.reset}`)
  console.log(`  Web:            ${C.dim}http://localhost:5173${C.reset}`)
  console.log(`  API:            ${C.dim}http://localhost:8000${C.reset}`)
  console.log(`  Sign in:        ${C.dim}admin@example.com / password${C.reset} (unless you changed it)\n`)
}

// --- orchestrate -----------------------------------------------------------
const { docker } = preflight()
backendEnv()
backendDeps()
appKey()
dataLayer(docker)
frontendDeps()
shapeApp()
nextSteps()
