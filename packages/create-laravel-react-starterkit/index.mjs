#!/usr/bin/env node
// The published `create-laravel-react-starterkit` scaffolder (Layer 1). Deliberately thin and
// dependency-free: it fetches the template at a pinned ref and hands the heavy lifting to the
// in-repo `pnpm run setup` (Layer 2). Keeping it thin means `create`, "Use this template" clones,
// and CI all share the same setup logic — no drift.
//
//   pnpm create laravel-react-starterkit my-app
//   npm  create laravel-react-starterkit@latest my-app
//   npx  create-laravel-react-starterkit my-app --preset=ecommerce
//
// Flags: --preset=basic|ecommerce  --ref=<git-ref>  --repo=<owner/repo>  --sqlite
//        --php-bin=<path>  --no-setup (clone only)  --no-interaction

import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'

// Pinned to a release tag so `pnpm create` is reproducible. Bump this together with the package
// version and a matching git tag on the template (see docs/installer.md → Release mechanics).
const DEFAULT_REPO = 'aivangogh/laravel-react-starterkit'
const DEFAULT_REF = 'v0.1.1'

const C = { reset: '\x1b[0m', cyan: '\x1b[36m', green: '\x1b[32m', red: '\x1b[31m', dim: '\x1b[2m' }
const die = (m) => {
  console.error(`\n${C.red}✗ ${m}${C.reset}\n`)
  process.exit(1)
}

// Run a command via the shell (needed on Windows for pnpm.cmd / git resolution). Pass a single
// quoted command string rather than an args array + `shell: true`, which trips Node's DEP0190.
const line = (cmd, args) => [cmd, ...args].map((t) => (/\s/.test(t) ? `"${t}"` : t)).join(' ')
const sh = (cmd, args, opts = {}) => spawnSync(line(cmd, args), { shell: true, ...opts })

const argv = process.argv.slice(2)
const flag = (n) => argv.includes(`--${n}`)
const opt = (n, d) => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`))
  return hit ? hit.slice(n.length + 3) : d
}
const positionals = argv.filter((a) => !a.startsWith('--'))

const repo = opt('repo', DEFAULT_REPO)
const ref = opt('ref', DEFAULT_REF)
const noInteraction = flag('no-interaction')

async function main() {
  console.log(`\n${C.cyan}create-laravel-react-starterkit${C.reset}\n`)

  const rl = noInteraction ? null : readline.createInterface({ input: stdin, output: stdout })
  const ask = async (q, d) => {
    if (!rl) return d
    const a = (await rl.question(`  ${q}${d ? ` ${C.dim}(${d})${C.reset}` : ''}: `)).trim()
    return a || d
  }

  // 1. Target directory ------------------------------------------------------
  let target = positionals[0] || (await ask('Project directory', 'my-app'))
  const dir = path.resolve(process.cwd(), target)
  if (fs.existsSync(dir) && fs.readdirSync(dir).length > 0) {
    die(`Target directory is not empty: ${dir}`)
  }

  // 2. Preset ----------------------------------------------------------------
  let preset = opt('preset')
  if (!preset) preset = await ask('Preset — basic or ecommerce', 'basic')
  if (!['basic', 'ecommerce'].includes(preset)) die(`Unknown preset '${preset}'. Use 'basic' or 'ecommerce'.`)

  rl?.close()

  // 3. Fetch the template (shallow clone, then drop history) ------------------
  console.log(`\n${C.cyan}▶${C.reset} Fetching template ${C.dim}${repo}#${ref}${C.reset} …`)
  if (!has('git')) die('git is required to fetch the template. Install Git and retry.')
  const cloned = sh('git', ['clone', '--depth', '1', '--branch', ref, `https://github.com/${repo}.git`, dir], {
    stdio: 'inherit',
  })
  if (cloned.status !== 0) die(`Failed to clone ${repo}#${ref}.`)
  fs.rmSync(path.join(dir, '.git'), { recursive: true, force: true })
  console.log(`  ${C.green}✓${C.reset} Template fetched into ${dir}`)

  if (flag('no-setup')) {
    console.log(`\n  ${C.dim}Skipped setup (--no-setup). Next: cd ${target} && pnpm run setup${C.reset}\n`)
    return
  }

  // 4. Hand off to the in-repo orchestrator ----------------------------------
  console.log(`\n${C.cyan}▶${C.reset} Bootstrapping (pnpm run setup) …\n`)
  // `--` ensures pnpm forwards these to setup.mjs rather than parsing them itself.
  const setupArgs = ['run', 'setup', '--', `--preset=${preset}`, '--no-interaction']
  if (flag('sqlite')) setupArgs.push('--sqlite')
  if (opt('php-bin')) setupArgs.push(`--php-bin=${opt('php-bin')}`)
  const setup = sh('pnpm', setupArgs, { stdio: 'inherit', cwd: dir })
  if (setup.status !== 0) {
    die(`Setup failed. Fix the issue above, then re-run: cd ${target} && pnpm run setup --preset=${preset}`)
  }

  console.log(`\n${C.green}✓ Done.${C.reset} cd ${C.cyan}${target}${C.reset} and run ${C.cyan}pnpm dev${C.reset}\n`)
}

function has(bin) {
  const probe = process.platform === 'win32' ? ['where', bin] : ['command', '-v', bin]
  return sh(probe[0], probe.slice(1), { stdio: 'ignore' }).status === 0
}

main().catch((e) => die(e?.message || String(e)))
