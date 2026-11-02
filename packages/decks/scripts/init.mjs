// `decks init`: install the Decks agent setup into a Claude Code project.
//
//   decks init [--force]
//
// Writes the deck-author agent, the building-a-deck and fact-checking-a-deck
// skills and the six deck rules under .claude/, from the templates rendered by
// render-agent.mjs, with the project's decksDir (decks.json _config, default
// `decks`), the CLI command and the installed package's path filled in. Then:
//
// - records each file it wrote, with a content hash, in .claude/decks.json. A
//   re-run updates a file whose hash still matches, skips one the user edited,
//   and never touches a file it did not write (a name collision). --force
//   overwrites edited files it owns; collisions stay untouched even then.
// - adds the two hooks (`decks hook lint` on Edit|Write|MultiEdit, `decks hook
//   prompt` on UserPromptSubmit) to .claude/settings.json, never removing
//   anything and never adding an entry twice, and prints the diff.
// - writes a marked `<!-- decks:start -->` block into AGENTS.md (or CLAUDE.md
//   when only that exists), replaced in place on a re-run. With neither, it
//   creates AGENTS.md and a CLAUDE.md that imports it.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOURCES } from './render-agent.mjs'

const PACKAGE = 'slidev-addon-decks'
const DEFAULT_PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const START = '<!-- decks:start -->'
const END = '<!-- decks:end -->'

const HELP = `Usage: decks init [--force]

Installs the Decks agent setup for Claude Code into the current project:
.claude/agents, .claude/skills, .claude/rules, two hooks in
.claude/settings.json, and a marked block in AGENTS.md or CLAUDE.md.

  --force   overwrite files init wrote earlier even if you edited them
            (files init did not write are never touched)`

const sha256 = (text) => 'sha256:' + createHash('sha256').update(text).digest('hex')
const posix = (p) => p.split(sep).join('/')

/** Walk up from dir; return the first directory for which test(dir) is true. */
function findUp(dir, test) {
  for (let d = resolve(dir); ; d = dirname(d)) {
    if (test(d)) return d
    if (dirname(d) === d) return null
  }
}

/** The project's deck directory from decks.json, default `decks`. */
function readDecksDir(rootDir) {
  const file = join(rootDir, 'decks.json')
  if (!existsSync(file)) return 'decks'
  const dir = JSON.parse(readFileSync(file, 'utf8'))?._config?.decksDir ?? 'decks'
  return dir.replace(/^\.\//, '').replace(/\/+$/, '') || '.'
}

/** `bunx` when the project's lockfile is bun's, else `npx`. Both pin the package name. */
function runnerFor(rootDir) {
  const locks = ['bun.lock', 'bun.lockb', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']
  const dir = findUp(rootDir, (d) => locks.some((l) => existsSync(join(d, l))))
  const bun = dir && (existsSync(join(dir, 'bun.lock')) || existsSync(join(dir, 'bun.lockb')))
  return `${bun ? 'bunx' : 'npx'} -p ${PACKAGE} decks`
}

/** Path from the project root to the installed package, `/`-separated, or null when it is not installed. */
function installedPackage(rootDir) {
  const dir = findUp(rootDir, (d) => existsSync(join(d, 'node_modules', PACKAGE, 'package.json')))
  return dir ? posix(relative(rootDir, join(dir, 'node_modules', PACKAGE))) : null
}

function fill(text, vars, name) {
  return text.replace(/\{\{(\w+)\}\}/g, (m, key) => {
    if (!(key in vars)) throw new Error(`${name}: unknown template variable ${m}`)
    return vars[key]
  })
}

/** Line diff (LCS) of two texts, as `+`/`-` lines with one line of context. */
export function lineDiff(before, after) {
  const a = before === '' ? [] : before.replace(/\n$/, '').split('\n')
  const b = after.replace(/\n$/, '').split('\n')
  const lcs = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
  const ops = []
  let i = 0
  let j = 0
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) ops.push([' ', a[i++], j++])
    else if (j < b.length && (i === a.length || lcs[i][j + 1] >= lcs[i + 1][j])) ops.push(['+', b[j++]])
    else ops.push(['-', a[i++]])
  }
  const near = (k) => ops.slice(Math.max(0, k - 1), k + 2).some(([op]) => op !== ' ')
  const out = []
  ops.forEach(([op, line], k) => {
    if (op !== ' ' || near(k)) out.push(`${op} ${line}`)
    else if (out.at(-1) !== '  ...') out.push('  ...')
  })
  return out.join('\n')
}

/** The hook entries init owns, identified by package name plus subcommand. */
function hookEntries(pkg) {
  const cmd = (sub) => `node "$CLAUDE_PROJECT_DIR/${pkg}/scripts/deck.mjs" hook ${sub}`
  return [
    // `|| exit 2` keeps the write hook closed when node can't start the CLI at all
    // (package uninstalled): Claude Code treats exit 1 as non-blocking.
    { event: 'PreToolUse', matcher: 'Edit|Write|MultiEdit', command: `${cmd('lint')} || exit 2`, owns: /\bhook lint\b/ },
    { event: 'UserPromptSubmit', command: cmd('prompt'), owns: /\bhook prompt\b/ },
  ]
}

/** Merge init's hooks into a settings object in place. Returns one note per hook. */
export function mergeHooks(settings, entries) {
  const notes = []
  settings.hooks ??= {}
  for (const e of entries) {
    const groups = (settings.hooks[e.event] ??= [])
    if (!Array.isArray(groups)) throw new Error(`hooks.${e.event} in .claude/settings.json is not an array`)
    const mine = groups
      .flatMap((g) => (Array.isArray(g?.hooks) ? g.hooks : []))
      .find((h) => typeof h?.command === 'string' && h.command.includes(PACKAGE) && e.owns.test(h.command))
    if (mine?.command === e.command) {
      notes.push(`${e.event}: already present`)
    } else if (mine) {
      mine.command = e.command
      notes.push(`${e.event}: updated the command`)
    } else {
      groups.push({ ...(e.matcher ? { matcher: e.matcher } : {}), hooks: [{ type: 'command', command: e.command }] })
      notes.push(`${e.event}: added`)
    }
  }
  return notes
}

/**
 * Run `decks init` against rootDir. Returns { code, files, settings, instructions, warnings }.
 * `files` maps each target to written | updated | unchanged | skipped | overwritten | collision.
 */
export function runInit(argv = [], { rootDir = process.cwd(), log = console.log, packageDir = DEFAULT_PACKAGE_DIR } = {}) {
  if (argv.includes('-h') || argv.includes('--help')) {
    log(HELP)
    return { code: 0 }
  }
  const unknown = argv.filter((a) => a !== '--force')
  if (unknown.length) {
    log(`decks init: unknown argument ${unknown.join(' ')}\n\n${HELP}`)
    return { code: 1 }
  }
  const force = argv.includes('--force')
  const warnings = []
  const version = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')).version

  let pkg = installedPackage(rootDir)
  if (!pkg) {
    pkg = `node_modules/${PACKAGE}`
    warnings.push(
      `${PACKAGE} is not installed in this project, so the hooks and exemplar paths point at ${pkg}, ` +
        `which does not exist yet. Install it (bun add -d ${PACKAGE}, or npm i -D ${PACKAGE}) before using the agent.`,
    )
  }
  const vars = {
    decks: runnerFor(rootDir),
    decksDir: readDecksDir(rootDir),
    pkg,
    exemplars: `${pkg}/agent/exemplars`,
  }

  // 1. Agent, skills and rules, under the ownership manifest.
  const manifestPath = join(rootDir, '.claude', 'decks.json')
  let manifest = { files: {} }
  if (existsSync(manifestPath)) {
    try {
      manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
      manifest.files ??= {}
    } catch (err) {
      warnings.push(`.claude/decks.json does not parse (${err.message}); treating every existing file as one init did not write.`)
    }
  }
  const files = {}
  const owned = {}
  for (const src of SOURCES) {
    const target = `.claude/${src}`
    const text = fill(readFileSync(join(packageDir, 'agent', 'templates', src), 'utf8'), vars, src)
    const file = join(rootDir, target)
    const recorded = manifest.files[target]
    let status
    if (!existsSync(file)) {
      status = 'written'
    } else {
      const current = readFileSync(file, 'utf8')
      if (current === text) status = 'unchanged'
      else if (!recorded) status = 'collision'
      else if (sha256(current) === recorded) status = 'updated'
      else status = force ? 'overwritten' : 'skipped'
    }
    files[target] = status
    if (status === 'written' || status === 'updated' || status === 'overwritten') {
      mkdirSync(dirname(file), { recursive: true })
      writeFileSync(file, text)
    }
    // An edited file keeps its old hash, so the next run still sees the edit.
    if (status === 'skipped') owned[target] = recorded
    else if (status !== 'collision') owned[target] = sha256(text)
  }
  mkdirSync(dirname(manifestPath), { recursive: true })
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        _readme:
          'Files `decks init` wrote, with their content hash when written. Re-running init updates a file whose hash still matches and skips one you edited. Delete an entry to keep the file as your own.',
        package: PACKAGE,
        version,
        files: owned,
      },
      null,
      2,
    ) + '\n',
  )

  // 2. Hooks in .claude/settings.json.
  const settingsPath = join(rootDir, '.claude', 'settings.json')
  const before = existsSync(settingsPath) ? readFileSync(settingsPath, 'utf8') : ''
  let settingsReport = { notes: [], diff: '' }
  let code = 0
  try {
    const settings = before.trim() ? JSON.parse(before) : {}
    const notes = mergeHooks(settings, hookEntries(pkg))
    const after = JSON.stringify(settings, null, 2) + '\n'
    const changed = before.trim() === '' || JSON.stringify(JSON.parse(before)) !== JSON.stringify(settings)
    if (changed) writeFileSync(settingsPath, after)
    settingsReport = { notes, diff: changed ? lineDiff(before, after) : '' }
  } catch (err) {
    code = 1
    settingsReport.notes.push(`not changed: ${err.message}. Add the hooks by hand (see the decks init docs).`)
  }

  // 3. The marked block in AGENTS.md or CLAUDE.md.
  const block = `${START}\n${fill(readFileSync(join(packageDir, 'agent', 'instructions.md'), 'utf8'), vars, 'instructions.md').trimEnd()}\n${END}`
  const instructions = []
  const read = (f) => (existsSync(join(rootDir, f)) ? readFileSync(join(rootDir, f), 'utf8') : null)
  const write = (f, text) => writeFileSync(join(rootDir, f), text)
  const withBlock = ['AGENTS.md', 'CLAUDE.md'].find((f) => read(f)?.includes(START))
  if (withBlock) {
    const text = read(withBlock)
    const s = text.indexOf(START)
    const e = text.indexOf(END, s)
    if (e === -1) {
      code = 1
      instructions.push(`${withBlock}: has ${START} but no ${END}; not changed. Fix the markers and re-run.`)
    } else {
      const next = text.slice(0, s) + block + text.slice(e + END.length)
      if (next === text) instructions.push(`${withBlock}: decks block unchanged`)
      else {
        write(withBlock, next)
        instructions.push(`${withBlock}: decks block updated in place`)
      }
    }
  } else {
    const append = (f) => {
      const text = read(f)
      write(f, `${text.trimEnd()}\n\n${block}\n`)
      instructions.push(`${f}: decks block appended`)
    }
    if (read('AGENTS.md') !== null) append('AGENTS.md')
    else if (read('CLAUDE.md') !== null) append('CLAUDE.md')
    else {
      write('AGENTS.md', `${block}\n`)
      instructions.push('AGENTS.md: created with the decks block')
    }
  }
  // Claude Code reads CLAUDE.md, not AGENTS.md, so a block in AGENTS.md needs the import.
  if (read('AGENTS.md')?.includes(START)) {
    const claude = read('CLAUDE.md')
    if (claude === null) {
      write('CLAUDE.md', '@AGENTS.md\n')
      instructions.push('CLAUDE.md: created with `@AGENTS.md`, so Claude Code reads AGENTS.md')
    } else if (!/^@AGENTS\.md\s*$/m.test(claude)) {
      warnings.push('CLAUDE.md does not import AGENTS.md, so Claude Code will not see the decks block. Add a line `@AGENTS.md` to CLAUDE.md.')
    }
  }

  // 4. Report.
  const groups = {
    written: 'written',
    updated: 'updated',
    overwritten: 'overwritten (--force)',
    unchanged: 'unchanged',
    skipped: 'skipped (edited since init wrote it; --force overwrites)',
    collision: 'collision (exists and init did not write it; left untouched)',
  }
  const lines = [`decks init (${PACKAGE} ${version})`, '']
  for (const [status, label] of Object.entries(groups)) {
    const list = Object.keys(files).filter((f) => files[f] === status)
    if (list.length) lines.push(`${label}:`, ...list.map((f) => `  ${f}`))
  }
  if (Object.values(files).includes('collision')) {
    lines.push(
      '',
      'A collision is a file of yours at a path init uses. Rename or move it and re-run init to install',
      "the Decks version; --force does not touch it. To keep yours, leave it: init won't change it.",
    )
  }
  lines.push('', '.claude/settings.json:', ...settingsReport.notes.map((n) => `  ${n}`))
  if (settingsReport.diff) lines.push('', settingsReport.diff)
  lines.push('', 'instructions:', ...instructions.map((n) => `  ${n}`))
  if (warnings.length) lines.push('', 'warnings:', ...warnings.map((w) => `  ${w}`))
  lines.push('', `Next: ${vars.decks} new <alias> [--story], then ask Claude Code to build the deck.`)
  log(lines.join('\n'))

  return { code, files, settings: settingsReport, instructions, warnings, vars }
}
