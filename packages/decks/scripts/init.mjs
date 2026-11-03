// `decks init`: install the Decks agent setup into a Claude Code project.
//
//   decks init [--force]
//
// Writes the deck-author agent, the building-a-deck and fact-checking-a-deck
// skills and the six deck rules (agent-sources.mjs) under .claude/, from the
// templates render-agent.mjs renders in the repo, with the project's decksDir
// (decks.json _config, default `decks`), the CLI command and the installed
// package's path filled in. Then:
//
// - records each file it wrote, with a content hash, in .claude/decks.json. A
//   re-run updates a file whose hash still matches, skips one the user edited,
//   and never touches a file it did not write (a name collision). --force
//   overwrites edited files it owns; collisions stay untouched even then. A
//   file an earlier version wrote and this one no longer ships is removed if
//   unedited, kept and reported if edited. Hashes are over LF text.
// - writes .claude/hooks/decks.sh (owned the same way), a POSIX sh wrapper that
//   runs the installed package's `decks hook`. Without the package it refuses
//   writes to deck prose under decksDir and allows everything else, so a fresh
//   clone or an uninstall never blocks work outside the decks.
// - adds the two hooks (`decks.sh hook lint` on Edit|Write|MultiEdit,
//   `decks.sh hook prompt` on UserPromptSubmit) to .claude/settings.json, never
//   removing anything and never adding an entry twice, and prints the diff.
//   When the package isn't installed it skips the hooks, exits 1 with the
//   install command, and warns if hooks it added earlier are still there.
// - writes a marked `<!-- decks:start -->` block into AGENTS.md (or CLAUDE.md
//   when only that exists; both when both carry one), replaced in place on a
//   re-run. With neither, it creates AGENTS.md and a CLAUDE.md that imports it.
//
// An unparseable decks.json or .claude/decks.json stops init before it writes
// anything, with exit 1; an unusable .claude/settings.json is left alone.

import { createHash } from 'node:crypto'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SOURCES } from './agent-sources.mjs'
import { normalizeDir } from './project.mjs'

const PACKAGE = 'slidev-addon-decks'
const DEFAULT_PACKAGE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const START = '<!-- decks:start -->'
const END = '<!-- decks:end -->'
const HOOK_SCRIPT = '.claude/hooks/decks.sh'
/** Where init writes files, so the only places a manifest entry may point. */
const OWNED_DIRS = [...new Set(SOURCES.map((s) => `.claude/${s.split('/')[0]}/`))]

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

/** A problem init reports by name and exits 1 on, without a stack. */
class InitError extends Error {}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/** Parse a JSON file, or throw an InitError naming the file. */
function readJson(file, label) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (err) {
    throw new InitError(`${label} does not parse (${err.message}).`)
  }
}

/** The project's deck directory from decks.json, default `decks`. */
function readDecksDir(rootDir) {
  const file = join(rootDir, 'decks.json')
  if (!existsSync(file)) return 'decks'
  const registry = readJson(file, 'decks.json')
  const dir = isObject(registry) && isObject(registry._config) ? registry._config.decksDir ?? 'decks' : 'decks'
  if (typeof dir !== 'string') throw new InitError(`decks.json: _config.decksDir must be a string, got ${JSON.stringify(dir)}.`)
  return normalizeDir(dir)
}

/** A string as one single-quoted POSIX sh word. */
const shellQuote = (s) => `'${s.replaceAll("'", `'\\''`)}'`

/** True when the nearest lockfile is bun's. */
function usesBun(rootDir) {
  const locks = ['bun.lock', 'bun.lockb', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']
  const dir = findUp(rootDir, (d) => locks.some((l) => existsSync(join(d, l))))
  return Boolean(dir && (existsSync(join(dir, 'bun.lock')) || existsSync(join(dir, 'bun.lockb'))))
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

/**
 * The hook entries init owns. A command is init's when it runs decks.sh, names
 * the package, or runs `scripts/deck.mjs" hook <sub>` (the workspace form),
 * plus the subcommand. The commands run decks.sh, which handles a missing
 * package itself (see the header).
 */
function hookEntries() {
  const cmd = (sub) => `sh "$CLAUDE_PROJECT_DIR/${HOOK_SCRIPT}" hook ${sub}`
  const owns = (sub) => (c) =>
    (c.includes(PACKAGE) || /scripts\/deck\.mjs"?\s/.test(c) || c.includes(HOOK_SCRIPT)) &&
    new RegExp(`\\bhook ${sub}\\b`).test(c)
  return [
    { event: 'PreToolUse', matcher: 'Edit|Write|MultiEdit', command: cmd('lint'), owns: owns('lint') },
    { event: 'UserPromptSubmit', command: cmd('prompt'), owns: owns('prompt') },
  ]
}

/** The events of settings whose hooks include one init owns. */
function ownHooksIn(settings) {
  if (!isObject(settings) || !isObject(settings.hooks)) return []
  return hookEntries()
    .filter((e) => Array.isArray(settings.hooks[e.event]))
    .filter((e) =>
      settings.hooks[e.event]
        .flatMap((g) => (Array.isArray(g?.hooks) ? g.hooks : []))
        .some((h) => typeof h?.command === 'string' && e.owns(h.command)),
    )
    .map((e) => e.event)
}

/**
 * Merge init's hooks into a settings object in place. Returns one note per
 * hook. With `add: false` it only rewrites hooks already there. Throws on a
 * settings shape it can't merge into.
 */
export function mergeHooks(settings, entries, { add = true } = {}) {
  if (!isObject(settings)) throw new InitError(`.claude/settings.json is ${JSON.stringify(settings)}, not a JSON object`)
  if (settings.hooks !== undefined && !isObject(settings.hooks))
    throw new InitError(`"hooks" in .claude/settings.json is ${JSON.stringify(settings.hooks)}, not an object`)
  for (const e of entries) {
    const groups = settings.hooks?.[e.event]
    if (groups !== undefined && !Array.isArray(groups)) throw new InitError(`hooks.${e.event} in .claude/settings.json is not an array`)
  }
  const notes = []
  if (add) settings.hooks ??= {}
  for (const e of entries) {
    if (!add && !settings.hooks?.[e.event]) continue
    const groups = (settings.hooks[e.event] ??= [])
    const mine = groups
      .flatMap((g) => (Array.isArray(g?.hooks) ? g.hooks : []))
      .find((h) => typeof h?.command === 'string' && e.owns(h.command))
    if (mine?.command === e.command) {
      notes.push(`${e.event}: already present`)
    } else if (mine) {
      mine.command = e.command
      notes.push(`${e.event}: updated the command`)
    } else if (add) {
      groups.push({ ...(e.matcher ? { matcher: e.matcher } : {}), hooks: [{ type: 'command', command: e.command }] })
      notes.push(`${e.event}: added`)
    }
  }
  return notes
}

/** Read .claude/decks.json, or throw an InitError: init can't tell what it owns without it. */
function readManifest(manifestPath) {
  if (!existsSync(manifestPath)) return { files: {} }
  const manifest = readJson(manifestPath, '.claude/decks.json')
  if (!isObject(manifest) || (manifest.files !== undefined && !isObject(manifest.files)))
    throw new InitError('.claude/decks.json is not an object with a "files" object.')
  manifest.files ??= {}
  return manifest
}

/**
 * A manifest key init may remove: a regular file (not a symlink, not a
 * directory) in one of the directories init writes, whose real parent
 * directory is inside the real .claude/. Null for anything else.
 */
function safeTarget(rootDir, target) {
  if (!(OWNED_DIRS.some((d) => target.startsWith(d)) || target === HOOK_SCRIPT)) return null
  if (target.split('/').some((seg) => seg === '..' || seg === '.' || seg === '')) return null
  const file = resolve(rootDir, target)
  try {
    const base = realpathSync(join(rootDir, '.claude'))
    const parent = realpathSync(dirname(file))
    if (!parent.startsWith(base + sep) || !lstatSync(file).isFile()) return null
  } catch {
    return null
  }
  return file
}

/** Remove now-empty directories from dir up to (not including) .claude/. */
function pruneEmpty(rootDir, dir) {
  const base = resolve(rootDir, '.claude')
  for (let d = dir; d.startsWith(base + sep); d = dirname(d)) {
    if (readdirSync(d).length) return
    rmdirSync(d)
  }
}

/**
 * Run `decks init` against rootDir. Returns { code, files, settings, instructions, warnings }.
 * `files` maps each target to written | updated | unchanged | skipped | overwritten | collision,
 * or, for a file an earlier init wrote that the package no longer ships, removed | kept.
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
  try {
    return install(argv.includes('--force'), rootDir, log, packageDir)
  } catch (err) {
    if (!(err instanceof InitError)) throw err
    log(`decks init: ${err.message} Nothing was changed; fix it and re-run.`)
    return { code: 1 }
  }
}

function install(force, rootDir, log, packageDir) {
  const warnings = []
  const version = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')).version
  const bun = usesBun(rootDir)
  const decksDir = readDecksDir(rootDir)
  const manifestPath = join(rootDir, '.claude', 'decks.json')
  const manifest = readManifest(manifestPath)

  // Without the package installed, the hook command would point at a missing
  // script and its `|| exit 2` would block every Edit and Write in the project.
  const installedPkg = installedPackage(rootDir)
  const pkg = installedPkg ?? `node_modules/${PACKAGE}`
  const installCmd = bun ? `bun add -d ${PACKAGE}` : `npm i -D ${PACKAGE}`
  const vars = {
    decks: `${bun ? 'bunx' : 'npx'} -p ${PACKAGE} decks`,
    decksDir,
    pkg,
    exemplars: `${pkg}/agent/exemplars`,
  }
  let code = 0

  // 1. Agent, skills and rules, under the ownership manifest.
  // Hashes and comparisons use LF text, so a CRLF checkout (git autocrlf) is not an edit.
  const lf = (text) => text.replace(/\r\n/g, '\n')
  const files = {}
  const owned = {}
  const sources = SOURCES.map((src) => ({
    target: `.claude/${src}`,
    text: fill(readFileSync(join(packageDir, 'agent', 'templates', src), 'utf8'), vars, src),
  }))
  sources.push({
    target: HOOK_SCRIPT,
    text: fill(
      readFileSync(join(packageDir, 'agent', 'hooks', 'decks.sh'), 'utf8'),
      { pkg: shellQuote(pkg), decksDir: shellQuote(decksDir) },
      'hooks/decks.sh',
    ),
  })
  for (const { target, text } of sources) {
    const file = join(rootDir, target)
    const recorded = manifest.files[target]
    let status
    if (!existsSync(file)) {
      status = 'written'
    } else {
      const current = lf(readFileSync(file, 'utf8'))
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
  // Files an earlier init wrote that this version no longer ships: remove the
  // unedited ones, keep (and stop owning) the edited ones.
  for (const [target, recorded] of Object.entries(manifest.files)) {
    if (target in files) continue
    const file = safeTarget(rootDir, target)
    if (!file) continue
    if (sha256(lf(readFileSync(file, 'utf8'))) === recorded) {
      rmSync(file)
      pruneEmpty(rootDir, dirname(file))
      files[target] = 'removed'
    } else {
      files[target] = 'kept'
    }
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
  let settingsReport = { notes: [], diff: '' }
  /** Merge the hooks into settings.json; `add: false` only rewrites the ones already there. */
  const mergeSettings = (add) => {
    const before = existsSync(settingsPath) ? readFileSync(settingsPath, 'utf8') : ''
    try {
      let settings
      try {
        settings = before.trim() ? JSON.parse(before) : {}
      } catch (err) {
        throw new InitError(`.claude/settings.json does not parse (${err.message})`)
      }
      const notes = mergeHooks(settings, hookEntries(), { add })
      const after = JSON.stringify(settings, null, 2) + '\n'
      const changed = before.trim() === '' ? add : JSON.stringify(JSON.parse(before)) !== JSON.stringify(settings)
      if (changed) writeFileSync(settingsPath, after)
      settingsReport = { notes, diff: changed ? lineDiff(before, after) : '' }
      return settings
    } catch (err) {
      if (!(err instanceof InitError)) throw err
      code = 1
      settingsReport.notes.push(`not changed: ${err.message}. Fix it, or add the hooks by hand (see the decks init docs).`)
      return null
    }
  }
  if (!installedPkg) {
    code = 1
    warnings.push(
      `${PACKAGE} is not installed in this project. Install it (${installCmd}) and re-run init to add the hooks.`,
    )
    // Hooks an earlier init added still run. Point them at decks.sh, which
    // works without the package, so an older command naming the missing
    // script does not block every write. None are added.
    let present = []
    if (files[HOOK_SCRIPT] !== 'collision' && existsSync(settingsPath)) present = ownHooksIn(mergeSettings(false))
    settingsReport.notes.unshift(
      `${settingsReport.diff ? 'none added' : 'not changed'}: ${PACKAGE} is not installed, so new hooks would have no script to run.`,
    )
    if (present.length)
      warnings.push(
        `.claude/settings.json still has the decks hooks (${present.join(', ')}), but ${PACKAGE} is not installed: ` +
          `writes to deck prose under ${decksDir === '.' ? 'the project root' : `${decksDir}/`} are refused until you install it. ` +
          'If you stopped using Decks, remove those hooks.',
      )
  } else if (files[HOOK_SCRIPT] === 'collision') {
    code = 1
    settingsReport.notes.push(`not changed: ${HOOK_SCRIPT} is a file init did not write, and the hooks would run it.`)
    warnings.push(`Rename or move ${HOOK_SCRIPT} and re-run init to add the hooks.`)
  } else {
    mergeSettings(true)
  }

  // 3. The marked block in AGENTS.md and/or CLAUDE.md.
  const block = `${START}\n${fill(readFileSync(join(packageDir, 'agent', 'instructions.md'), 'utf8'), vars, 'instructions.md').trimEnd()}\n${END}`
  const instructions = []
  const read = (f) => (existsSync(join(rootDir, f)) ? readFileSync(join(rootDir, f), 'utf8') : null)
  const write = (f, text) => writeFileSync(join(rootDir, f), text)
  const withBlock = ['AGENTS.md', 'CLAUDE.md'].filter((f) => read(f)?.includes(START))
  for (const f of withBlock) {
    const text = read(f)
    const s = text.indexOf(START)
    const e = text.indexOf(END, s)
    if (e === -1) {
      code = 1
      instructions.push(`${f}: has ${START} but no ${END}; not changed. Fix the markers and re-run.`)
      continue
    }
    const next = text.slice(0, s) + block + text.slice(e + END.length)
    if (next === text) instructions.push(`${f}: decks block unchanged`)
    else {
      write(f, next)
      instructions.push(`${f}: decks block updated in place`)
    }
  }
  if (!withBlock.length) {
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
  // Claude Code reads CLAUDE.md, not AGENTS.md, so a block in AGENTS.md needs the
  // import, unless CLAUDE.md carries its own copy of the block.
  const claude = read('CLAUDE.md')
  if (read('AGENTS.md')?.includes(START) && !claude?.includes(START)) {
    if (claude === null) {
      write('CLAUDE.md', '@AGENTS.md\n')
      instructions.push('CLAUDE.md: created with `@AGENTS.md`, so Claude Code reads AGENTS.md')
    } else if (!/^@(?:\.\/)?AGENTS\.md\s*$/m.test(claude)) {
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
    removed: 'removed (no longer shipped, and unedited)',
    kept: 'kept (no longer shipped, but you edited it; it is yours now)',
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
  if (installedPkg) lines.push('', `Next: ${vars.decks} new <alias> [--story], then ask Claude Code to build the deck.`)
  else lines.push('', `Next: ${installCmd}, then re-run ${vars.decks} init.`)
  log(lines.join('\n'))

  return { code, files, settings: settingsReport, instructions, warnings, vars }
}
