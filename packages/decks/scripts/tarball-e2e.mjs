// End-to-end tests of `decks init` and the package CLI against the packed
// tarball, in scratch projects the way a user has them.
//
//   bun run test:tarball [--keep]
//
// `npm pack`s packages/decks, then for each case creates a project under the
// OS temp dir and `bun add`s the tarball plus @slidev/cli and
// slidev-theme-the-unnamed at the root package.json's ranges. The CLI runs as
// a user runs it, `bunx -p slidev-addon-decks decks …`. bunx resolves the
// project's node_modules/.bin/decks first; the package is not on npm, and
// every bunx call gets a dead registry (127.0.0.1:9) so a fallback to the
// registry fails loudly instead of running something else. The hooks run
// through the exact command string init wrote to .claude/settings.json, under
// `sh -c` with CLAUDE_PROJECT_DIR set, as Claude Code runs them.
//
// shot and snap need a Chromium: the case installs playwright-chromium in its
// project (the repo's installed version, whose browser build is most likely
// cached) and prints SKIP with the reason when no browser can be launched.
// Their dev servers take a free port the CLI picks itself (server.mjs).
//
// Temp dirs are removed at the end; --keep leaves them and prints the path.
// Not shipped: package.json `files` excludes this script.

import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const started = Date.now()
const keep = process.argv.includes('--keep')
const pkgDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = resolve(pkgDir, '..', '..')
const rootPkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
const PACKAGE = 'slidev-addon-decks'

/** The repo's installed playwright-chromium, so its browser build is the cached one. */
function playwrightSpec() {
  try {
    const { version } = JSON.parse(
      readFileSync(join(repoRoot, 'node_modules/playwright-chromium/package.json'), 'utf8'),
    )
    return `playwright-chromium@${version}`
  } catch {
    return `playwright-chromium@${rootPkg.devDependencies['playwright-chromium']}`
  }
}

const TARGETS = [
  '.claude/agents/deck-author.md',
  '.claude/skills/building-a-deck/SKILL.md',
  '.claude/skills/fact-checking-a-deck/SKILL.md',
  '.claude/rules/deck-patterns.md',
  '.claude/rules/deck-writing.md',
  '.claude/rules/deck-data.md',
  '.claude/rules/story-stage.md',
  '.claude/rules/prose-patterns.md',
  '.claude/rules/project-glossary.md',
]
const REPO_ONLY = ['bun run', 'examples/', 'packages/decks', '.test.ts', 'tools/']
// banned-phrase, severity error, in lint/ai-rhetoric-patterns.tsv.
const PLANTED = 'At its core'

const base = mkdtempSync(join(tmpdir(), 'decks-tarball-e2e-'))
const DEAD_REGISTRY = 'http://127.0.0.1:9/'

// ---------------------------------------------------------------- harness

const results = []
let current = null

/** Run one named case. `body` records assertions with check(); skip() marks it skipped. */
async function testCase(name, body) {
  current = { name, failures: [], passes: 0, skip: null }
  const t = Date.now()
  try {
    await body()
  } catch (err) {
    current.failures.push(`threw: ${err?.stack ?? err}`)
  }
  const status = current.failures.length ? 'FAIL' : current.skip ? 'SKIP' : 'PASS'
  results.push({ ...current, status, ms: Date.now() - t })
  console.log(`${status.padEnd(4)} ${name} (${((Date.now() - t) / 1000).toFixed(1)}s)`)
  for (const f of current.failures) console.log(`       x ${f}`)
  if (current.skip) console.log(`       skip: ${current.skip}`)
}

/** A named assertion. `detail` is printed only on failure. */
function check(ok, label, detail) {
  if (ok) current.passes++
  else current.failures.push(detail === undefined ? label : `${label}\n         ${detail}`)
  return ok
}

function skip(reason) {
  current.skip = reason
}

function run(cmd, args, { cwd, input, env, timeout = 300_000 } = {}) {
  const res = spawnSync(cmd, args, {
    cwd,
    input,
    env: { ...process.env, ...env },
    encoding: 'utf8',
    timeout,
  })
  return {
    status: res.status,
    stdout: res.stdout ?? '',
    stderr: res.stderr ?? '',
    error: res.error,
    out: `${res.stdout ?? ''}${res.stderr ?? ''}`,
  }
}

const tail = (text, n = 1500) => (text.length > n ? '…' + text.slice(-n) : text)

/** `bunx -p slidev-addon-decks decks …` in `cwd`, with the registry unreachable. */
function decks(cwd, args, opts = {}) {
  return run('bunx', ['-p', PACKAGE, 'decks', ...args], {
    cwd,
    env: { NPM_CONFIG_REGISTRY: DEAD_REGISTRY, BUN_CONFIG_REGISTRY: DEAD_REGISTRY, ...opts.env },
    timeout: opts.timeout,
  })
}

const sha256 = (text) => 'sha256:' + createHash('sha256').update(text).digest('hex')
const read = (root, rel) => readFileSync(join(root, rel), 'utf8')
const readJson = (root, rel) => JSON.parse(read(root, rel))

function write(root, rel, text) {
  mkdirSync(dirname(join(root, rel)), { recursive: true })
  writeFileSync(join(root, rel), text)
}

/** Hash of every file in the project outside node_modules, keyed by relative path. */
function snapshot(root) {
  const out = {}
  const walk = (rel) => {
    for (const e of readdirSync(join(root, rel), { withFileTypes: true })) {
      const path = rel ? `${rel}/${e.name}` : e.name
      if (e.name === 'node_modules') continue
      if (e.isDirectory()) walk(path)
      else out[path] = sha256(readFileSync(join(root, path)))
    }
  }
  walk('')
  return out
}

/** The files init listed under the report heading starting with `label`. */
function reported(stdout, label) {
  const lines = stdout.split('\n')
  const at = lines.findIndex((l) => l.startsWith(label))
  if (at === -1) return []
  const list = []
  for (const l of lines.slice(at + 1)) {
    if (!l.startsWith('  ')) break
    list.push(l.trim())
  }
  return list
}

/** Every hook command under `event` in a settings object. */
const hookCommands = (settings, event) =>
  (settings.hooks?.[event] ?? []).flatMap((g) => (g.hooks ?? []).map((h) => h.command))

// ---------------------------------------------------------------- setup

console.log(`scratch: ${base}`)
const packDir = join(base, 'pack')
mkdirSync(packDir)
const pack = run('npm', ['pack', pkgDir, '--pack-destination', packDir, '--silent'])
const tarball = join(packDir, pack.stdout.trim().split('\n').at(-1) ?? '')
if (pack.status !== 0 || !existsSync(tarball)) {
  console.error(`npm pack failed:\n${pack.out}`)
  process.exit(1)
}
console.log(`packed: ${tarball}`)

let projects = 0
/** A fresh project with the tarball, Slidev and the theme installed, plus `files`. */
function project(name, files = {}) {
  const root = join(base, `${String(++projects).padStart(2, '0')}-${name}`)
  write(root, 'package.json', JSON.stringify({ name: `scratch-${name}`, private: true }, null, 2) + '\n')
  const add = run(
    'bun',
    [
      'add',
      tarball,
      `@slidev/cli@${rootPkg.dependencies['@slidev/cli']}`,
      `slidev-theme-the-unnamed@${rootPkg.dependencies['slidev-theme-the-unnamed']}`,
    ],
    { cwd: root },
  )
  if (add.status !== 0) throw new Error(`bun add failed in ${root}:\n${tail(add.out)}`)
  for (const [rel, text] of Object.entries(files)) write(root, rel, text)
  return root
}

function init(root, args = []) {
  const res = decks(root, ['init', ...args])
  check(res.status === 0, `decks init ${args.join(' ')} exits 0`, `exit ${res.status}\n${tail(res.out)}`)
  return res
}

// ---------------------------------------------------------------- cases

// Cases 1-3 share one project: each starts from the state the last left.
let main
let rendered = {}

await testCase('1 fresh init', () => {
  main = project('main')
  const res = init(main)
  for (const f of [...TARGETS, '.claude/settings.json', '.claude/decks.json', 'AGENTS.md', 'CLAUDE.md'])
    check(existsSync(join(main, f)), `${f} exists`, `init did not write ${f}`)
  const manifest = readJson(main, '.claude/decks.json')
  check(
    JSON.stringify(Object.keys(manifest.files ?? {}).sort()) === JSON.stringify([...TARGETS].sort()),
    '.claude/decks.json records exactly the nine files',
    JSON.stringify(Object.keys(manifest.files ?? {})),
  )
  for (const f of TARGETS) {
    if (!existsSync(join(main, f))) continue
    rendered[f] = read(main, f)
    check(manifest.files?.[f] === sha256(rendered[f]), `${f} hash in the manifest matches the file`, manifest.files?.[f])
  }
  check(reported(res.stdout, 'written:').length === TARGETS.length, 'report lists the nine files as written', tail(res.stdout))

  const texts = { ...rendered, 'AGENTS.md': read(main, 'AGENTS.md'), 'CLAUDE.md': read(main, 'CLAUDE.md') }
  for (const [f, text] of Object.entries(texts)) {
    for (const ref of REPO_ONLY) {
      const lines = text.split('\n').filter((l) => l.includes(ref))
      check(!lines.length, `${f} has no repo-only reference "${ref}"`, lines.slice(0, 3).join('\n         '))
    }
    check(!/\{\{\w+\}\}/.test(text), `${f} has no unfilled {{variable}}`, text.match(/\{\{\w+\}\}/)?.[0])
  }

  // Every path into the installed package that the files cite, exemplars included.
  const cited = new Set()
  for (const text of Object.values(texts))
    for (const [m] of text.matchAll(/node_modules\/slidev-addon-decks\/[^\s`'")\]]*/g)) {
      // Cut placeholders (<alias>, *, {a,b}, 0N-…) back to the last whole directory.
      let path = m
      const cut = path.search(/[<*{[…]|\bN\b|\.\.\./)
      if (cut !== -1) path = path.slice(0, path.lastIndexOf('/', cut))
      cited.add(path.replace(/[.,:;]+$/, '').replace(/\/$/, ''))
    }
  check(
    [...cited].some((p) => p.includes('agent/exemplars/tides')) &&
      [...cited].some((p) => p.includes('agent/exemplars/agent-experience')),
    'the files cite both bundled exemplars',
    [...cited].join(', '),
  )
  for (const p of [...cited].sort()) check(existsSync(join(main, p)), `cited path exists: ${p}`)
})

await testCase('2 idempotent re-run', () => {
  const before = snapshot(main)
  const res = init(main)
  const after = snapshot(main)
  const changed = Object.keys({ ...before, ...after }).filter((f) => before[f] !== after[f])
  check(!changed.length, 'no file changes on disk', changed.join(', '))
  check(reported(res.stdout, 'unchanged:').length === TARGETS.length, 'report lists the nine files as unchanged', tail(res.stdout))
  const settings = readJson(main, '.claude/settings.json')
  const lint = hookCommands(settings, 'PreToolUse').filter((c) => /hook lint/.test(c))
  const prompt = hookCommands(settings, 'UserPromptSubmit').filter((c) => /hook prompt/.test(c))
  check(lint.length === 1, 'one PreToolUse hook lint entry', JSON.stringify(lint))
  check(prompt.length === 1, 'one UserPromptSubmit hook prompt entry', JSON.stringify(prompt))
  check(/already present/.test(res.stdout), 'report says the hooks are already present', tail(res.stdout))
})

await testCase('3 edited owned file: skipped, then --force overwrites', () => {
  const f = '.claude/rules/deck-patterns.md'
  appendFileSync(join(main, f), '\nMy own note.\n')
  const edited = read(main, f)
  const res = init(main)
  check(read(main, f) === edited, 'the edited file is left as edited')
  check(reported(res.stdout, 'skipped').includes(f), 'report lists it as skipped', tail(res.stdout))
  const forced = init(main, ['--force'])
  check(read(main, f) === rendered[f], '--force restores the rendered content')
  check(reported(forced.stdout, 'overwritten').includes(f), 'report lists it as overwritten', tail(forced.stdout))
  check(readJson(main, '.claude/decks.json').files[f] === sha256(rendered[f]), 'manifest hash is the rendered file again')
  const again = init(main)
  check(reported(again.stdout, 'unchanged:').includes(f), 'a run after --force sees it unchanged', tail(again.stdout))
})

await testCase('4 colliding user file is never touched', () => {
  const f = '.claude/rules/deck-writing.md'
  const mine = '# My writing rules\n\nKeep it short.\n'
  const root = project('collision', { [f]: mine })
  for (const args of [[], ['--force']]) {
    const res = init(root, args)
    const flag = args.join(' ') || '(no flag)'
    check(read(root, f) === mine, `${flag}: the file is byte-identical`)
    check(reported(res.stdout, 'collision').includes(f), `${flag}: report lists it as a collision`, tail(res.stdout))
    check(/--force does not touch it/.test(res.stdout), `${flag}: report says --force does not touch it`)
    check(!(f in readJson(root, '.claude/decks.json').files), `${flag}: manifest does not claim it`)
    check(existsSync(join(root, '.claude/rules/deck-data.md')), `${flag}: the other files are still written`)
  }
})

await testCase('5 settings merge keeps existing hooks and permissions', () => {
  const theirs = {
    permissions: { allow: ['Bash(ls:*)'], deny: ['Read(./.env)'] },
    hooks: {
      PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo pre-bash' }] }],
    },
  }
  const root = project('settings', { '.claude/settings.json': JSON.stringify(theirs, null, 2) + '\n' })
  const first = init(root)
  check(/^\+ /m.test(first.stdout), 'init prints a diff of settings.json', tail(first.stdout))
  init(root)
  const s = readJson(root, '.claude/settings.json')
  check(JSON.stringify(s.permissions) === JSON.stringify(theirs.permissions), 'permissions block survives unchanged', JSON.stringify(s.permissions))
  check(
    s.hooks.PreToolUse.some((g) => JSON.stringify(g) === JSON.stringify(theirs.hooks.PreToolUse[0])),
    'the existing Bash PreToolUse hook survives unchanged',
    JSON.stringify(s.hooks.PreToolUse),
  )
  const lint = hookCommands(s, 'PreToolUse').filter((c) => /hook lint/.test(c))
  const prompt = hookCommands(s, 'UserPromptSubmit').filter((c) => /hook prompt/.test(c))
  check(lint.length === 1 && prompt.length === 1, "init's two hooks are present once each", JSON.stringify(s.hooks))
  check(
    s.hooks.PreToolUse.find((g) => (g.hooks ?? []).some((h) => /hook lint/.test(h.command)))?.matcher ===
      'Edit|Write|MultiEdit',
    'the lint hook matches Edit|Write|MultiEdit',
  )
})

const START = '<!-- decks:start -->'
const END = '<!-- decks:end -->'
const count = (text, s) => text.split(s).length - 1

await testCase('6a existing AGENTS.md gets the block, replaced in place on re-run', () => {
  const root = project('agents-md', { 'AGENTS.md': '# Project\n\nOur rules.\n' })
  init(root)
  let text = read(root, 'AGENTS.md')
  check(text.startsWith('# Project\n\nOur rules.\n'), 'existing content kept at the top')
  check(count(text, START) === 1 && count(text, END) === 1, 'one marked block')
  const block = text.slice(text.indexOf(START), text.indexOf(END) + END.length)
  // Stale the block and add content after it, then re-run.
  write(root, 'AGENTS.md', text.replace(block, `${START}\nstale\n${END}`) + '\n## After\n\nMore rules.\n')
  init(root)
  text = read(root, 'AGENTS.md')
  check(count(text, START) === 1, 'still one block after the re-run', text)
  check(text.includes(block), 'the block is back to the rendered text')
  check(!text.includes('\nstale\n'), 'the stale block content is gone')
  check(
    text.startsWith('# Project\n\nOur rules.\n') && text.endsWith(`${END}\n\n## After\n\nMore rules.\n`),
    'content before and after the block is untouched, block in the same place',
    JSON.stringify(text.slice(-120)),
  )
})

await testCase('6b only CLAUDE.md gets the block', () => {
  const root = project('claude-md', { 'CLAUDE.md': '# Mine\n' })
  init(root)
  const text = read(root, 'CLAUDE.md')
  check(text.startsWith('# Mine\n') && count(text, START) === 1, 'CLAUDE.md keeps its content and gains one block', text.slice(0, 200))
  check(!existsSync(join(root, 'AGENTS.md')), 'no AGENTS.md is created')
  init(root)
  check(count(read(root, 'CLAUDE.md'), START) === 1, 'a re-run keeps one block')
})

await testCase('6c neither: AGENTS.md with the block plus a one-line CLAUDE.md', () => {
  const root = project('no-instructions')
  init(root)
  const agents = read(root, 'AGENTS.md')
  check(agents.startsWith(START) && count(agents, START) === 1, 'AGENTS.md holds the block', agents.slice(0, 100))
  check(read(root, 'CLAUDE.md') === '@AGENTS.md\n', 'CLAUDE.md is the one line @AGENTS.md', JSON.stringify(read(root, 'CLAUDE.md')))
})

// Cases 7-9 share a project with init run and a story deck scaffolded.
let deckProj
let lintCmd
const PAGE = 'decks/my-talk/pages/02-x.md'
const STAGE = 'decks/my-talk/components/FirstStage.vue'

/** Pipe a PreToolUse payload into init's hook command, as Claude Code runs it. */
function runHook(root, tool_name, tool_input) {
  const payload = {
    session_id: 'tarball-e2e',
    transcript_path: join(root, '.claude', 'transcript.jsonl'),
    cwd: root,
    permission_mode: 'default',
    hook_event_name: 'PreToolUse',
    tool_name,
    tool_input,
    tool_use_id: 'toolu_e2e',
  }
  const res = run('sh', ['-c', lintCmd], {
    cwd: root,
    input: JSON.stringify(payload),
    env: { CLAUDE_PROJECT_DIR: root },
    timeout: 30_000,
  })
  let decision = null
  try {
    decision = JSON.parse(res.stdout).hookSpecificOutput
  } catch {}
  return { ...res, decision }
}

const denied = (h) => h.status === 0 && h.decision?.permissionDecision === 'deny'
const refused = (h) => h.status === 2 || denied(h)
const show = (h) => `exit ${h.status}\n         stdout: ${tail(h.stdout, 600)}\n         stderr: ${tail(h.stderr, 600)}`

await testCase('7 hook denies planted lines, allows clean ones', () => {
  deckProj = project('deck')
  init(deckProj)
  const scaffold = decks(deckProj, ['new', 'talk', 'my-talk', '--story'])
  check(scaffold.status === 0, 'decks new talk my-talk --story exits 0', tail(scaffold.out))
  lintCmd = hookCommands(readJson(deckProj, '.claude/settings.json'), 'PreToolUse').find((c) => /hook lint/.test(c))
  check(!!lintCmd, 'settings.json carries the lint hook command')
  if (!lintCmd) return
  const tsv = read(deckProj, `node_modules/${PACKAGE}/lint/ai-rhetoric-patterns.tsv`)
  const row = tsv.split('\n').find((l) => l.split('\t')[1] === 'error' && new RegExp(l.split('\t')[2]).test(PLANTED))
  check(!!row, `"${PLANTED}" matches an error-level row in the shipped TSV`)

  const page = runHook(deckProj, 'Write', {
    file_path: join(deckProj, PAGE),
    content: `---\nlayout: full\n---\n\n# Tide range doubles at the full moon.\n\n${PLANTED}, the moon sets the schedule.\n`,
  })
  check(denied(page), 'Write of a page with the planted phrase is denied', show(page))
  check(/banned-phrase/.test(page.decision?.permissionDecisionReason ?? ''), 'the reason names the pattern', show(page))

  const stage = read(deckProj, STAGE)
  const lead = "lead: 'A thousand datasets, hand curated.'"
  check(stage.includes(lead), 'the scaffolded stage has the template COPY lead to edit')
  const copy = runHook(deckProj, 'Edit', {
    file_path: join(deckProj, STAGE),
    old_string: lead,
    new_string: `lead: '${PLANTED}, a thousand datasets.'`,
    replace_all: false,
  })
  check(denied(copy), 'Edit planting the phrase in a COPY lead is denied', show(copy))
  check(/story card COPY/.test(copy.decision?.permissionDecisionReason ?? ''), 'the reason flags it as story card COPY', show(copy))

  const clean = runHook(deckProj, 'Write', {
    file_path: join(deckProj, PAGE),
    content: '---\nlayout: full\n---\n\n# Tide range doubles at the full moon.\n\nBoston sees two high tides a day.\n',
  })
  check(clean.status === 0 && clean.stdout.trim() === '', 'a clean page Write is allowed (exit 0, no output)', show(clean))
  const outside = runHook(deckProj, 'Write', { file_path: join(deckProj, 'notes.md'), content: `${PLANTED}.\n` })
  check(outside.status === 0 && outside.stdout.trim() === '', 'a Write outside the decks is not linted', show(outside))
})

await testCase('8 hook refuses when the scanner cannot run', () => {
  if (!lintCmd) return check(false, 'case 7 found the hook command')
  const lib = join(deckProj, 'node_modules', PACKAGE)
  const planted = {
    file_path: join(deckProj, PAGE),
    content: `# A title.\n\n${PLANTED}, the moon sets the schedule.\n`,
  }
  const cleanWrite = { file_path: join(deckProj, PAGE), content: '# A title.\n\nTwo tides a day.\n' }
  for (const file of ['lint/ai-rhetoric-patterns.tsv', 'lint/scan.mjs']) {
    renameSync(join(lib, file), join(lib, `${file}.moved`))
    try {
      for (const [what, input] of [['planted', planted], ['clean', cleanWrite]]) {
        const h = runHook(deckProj, 'Write', input)
        check(refused(h), `${file} missing: a ${what} deck Write is refused`, show(h))
        check(/BLOCKED/.test(h.stderr + h.stdout), `${file} missing: the refusal says BLOCKED`, show(h))
      }
    } finally {
      renameSync(join(lib, `${file}.moved`), join(lib, file))
    }
  }
  renameSync(lib, `${lib}.moved`)
  try {
    const h = runHook(deckProj, 'Write', planted)
    check(h.status === 2, 'package gone: the `|| exit 2` path blocks with exit 2', show(h))
  } finally {
    renameSync(`${lib}.moved`, lib)
  }
  const back = runHook(deckProj, 'Write', planted)
  check(denied(back), 'with the package restored the hook denies again', show(back))
})

await testCase('9a decks lint, check and the missing-playwright hint', () => {
  const lint = decks(deckProj, ['lint', 'talk'])
  check(lint.status === 0, 'decks lint talk exits 0', tail(lint.out))
  const check_ = decks(deckProj, ['check'])
  check(check_.status === 0, 'decks check exits 0', tail(check_.out))
  check(/All page files match/.test(check_.stdout), 'decks check reports the manifest clean', tail(check_.out))
  const shot = decks(deckProj, ['shot', 'talk', '1'])
  check(shot.status === 1, 'decks shot without playwright-chromium exits 1', tail(shot.out))
  check(/bun add -d playwright-chromium/.test(shot.stderr), 'it prints the install hint', tail(shot.out))
  check(!/Starting a dev server/.test(shot.out), 'it stops before starting a dev server', tail(shot.out))
  // A planted COPY line on disk fails both commands.
  const stagePath = join(deckProj, STAGE)
  const stage = read(deckProj, STAGE)
  writeFileSync(stagePath, stage.replace('A thousand datasets, hand curated.', `${PLANTED}, a thousand datasets.`))
  try {
    const bad = decks(deckProj, ['lint', 'talk'])
    check(bad.status === 1 && /banned-phrase/.test(bad.stdout), 'decks lint fails on a planted COPY lead', tail(bad.out))
    const badCheck = decks(deckProj, ['check'])
    check(badCheck.status === 1, 'decks check fails on a planted COPY lead', tail(badCheck.out))
  } finally {
    writeFileSync(stagePath, stage)
  }
})

await testCase('9b decks shot and snap produce PNGs', () => {
  const add = run('bun', ['add', '-d', playwrightSpec()], { cwd: deckProj })
  if (add.status !== 0) return skip(`could not install ${playwrightSpec()}: ${tail(add.out, 300)}`)
  const probeJs =
    "const { chromium } = await import('playwright-chromium'); const b = await chromium.launch(); await b.close()"
  let probe = run('node', ['--input-type=module', '-e', probeJs], { cwd: deckProj, timeout: 60_000 })
  if (probe.status !== 0) {
    const get = run('node', ['node_modules/playwright-chromium/cli.js', 'install', 'chromium'], { cwd: deckProj })
    probe = run('node', ['--input-type=module', '-e', probeJs], { cwd: deckProj, timeout: 60_000 })
    if (probe.status !== 0)
      return skip(
        `no launchable Chromium for ${playwrightSpec()} (install: exit ${get.status}): ${tail(probe.out, 300)}`,
      )
  }
  const shotDir = join(deckProj, 'shots')
  mkdirSync(shotDir)
  const shot = decks(deckProj, ['shot', 'talk', '2', '2', '--out', shotDir], { timeout: 240_000 })
  check(shot.status === 0, 'decks shot talk 2 2 exits 0', tail(shot.out))
  const shots = readdirSync(shotDir).filter((f) => f.endsWith('.png'))
  check(
    ['slide-2-c0.png', 'slide-2-c1.png', 'slide-2-c2.png'].every((f) => shots.includes(f)),
    'one PNG per click',
    shots.join(', '),
  )
  check(/errors: none/.test(shot.stdout), 'no console errors on the slide', tail(shot.out))
  const one = decks(deckProj, ['shot', 'talk', '1', '--out', shotDir], { timeout: 240_000 })
  check(one.status === 0 && existsSync(join(shotDir, 'slide-1-c0.png')), 'decks shot talk 1 writes slide-1-c0.png', tail(one.out))

  const snapDir = join(deckProj, 'snaps', 'walk')
  const snap = decks(deckProj, ['snap', 'talk', snapDir], { timeout: 300_000 })
  check(snap.status === 0, 'decks snap talk exits 0', tail(snap.out))
  const frames = existsSync(snapDir) ? readdirSync(snapDir).filter((f) => f.endsWith('.png')) : []
  // Cover plus the stage's three beats.
  check(frames.length >= 4, 'decks snap writes a PNG per slide and click (at least 4)', frames.join(', '))
})

// ---------------------------------------------------------------- report

const secs = ((Date.now() - started) / 1000).toFixed(1)
const by = (s) => results.filter((r) => r.status === s).length
console.log(
  `\n${by('PASS')} passed, ${by('SKIP')} skipped, ${by('FAIL')} failed ` +
    `(${results.reduce((n, r) => n + r.passes, 0)} assertions) in ${secs}s`,
)
if (keep) console.log(`kept: ${base}`)
else rmSync(base, { recursive: true, force: true })
process.exit(by('FAIL') ? 1 : 0)
