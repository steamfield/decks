// Claude Code hooks, run as `decks hook lint` (PreToolUse on Edit/Write/
// MultiEdit) and `decks hook prompt` (UserPromptSubmit). Both read the hook
// payload as JSON on stdin and answer in Claude Code's hook JSON on stdout.
// Node only: no jq, no bash, so they run wherever Claude Code does.
//
// `hook lint` denies a write to deck prose that carries an error-severity
// AI-rhetoric pattern, in the prose or in a story stage's COPY array. Warns
// are not blocked (they show up in `decks lint`). It fails closed: a payload
// it cannot read, or a pattern file it cannot load, refuses the write with
// exit 2 and a message on stderr rather than letting unlinted prose through.
//
// `hook prompt` adds the deck-writing reminder when a prompt asks to write or
// revise a deck. Its regex runs first, so a normal turn costs one match.

import { existsSync, readFileSync, writeSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { deckNamesUnder, isDecksRepo, normalizeDir } from './project.mjs'

/** Read stdin to the end. */
async function stdinText() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

// Synchronous writes: the process exits right after, and a pipe write that is
// still queued at exit would be lost.
function refuse(msg) {
  writeSync(2, `BLOCKED: ${msg}\n`)
  process.exit(2)
}

function emit(hookSpecificOutput) {
  writeSync(1, JSON.stringify({ hookSpecificOutput }) + '\n')
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)

/** The project's registry, or {} when there is none, it does not parse, or it is not an object. */
function readRegistry(projectDir) {
  try {
    const registry = JSON.parse(readFileSync(join(projectDir, 'decks.json'), 'utf8'))
    return isObject(registry) ? registry : {}
  } catch {
    return {}
  }
}

/**
 * Directories (relative to the project) whose children are decks: `decks`,
 * the registry's decksDir, and `examples` only inside the Decks repo, where
 * the shipped decks live. In a user project `examples/` is the user's own.
 */
function deckRoots(registry, projectDir) {
  const roots = new Set(['decks'])
  const dir = isObject(registry._config) ? registry._config.decksDir : undefined
  if (typeof dir === 'string') roots.add(normalizeDir(dir))
  if (isDecksRepo(projectDir)) roots.add('examples')
  return [...roots]
}

/** Registered deck directories, relative to the project, `/`-separated. */
function deckDirs(registry) {
  return Object.entries(registry)
    .filter(([alias, d]) => !alias.startsWith('_') && typeof d?.entry === 'string')
    .map(([, d]) => toPosix(dirname(d.entry)))
}

const toPosix = (p) => p.split(sep).join('/')
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const DECK_FILE = '(?:pages/.+\\.md|slides\\.md|components/.+\\.vue)'
const UNDER_DECK = new RegExp(`^([^/]+)/(${DECK_FILE})$`)

/**
 * Where a path sits for the hooks: `{ base, rel }`, the checkout it belongs to
 * and its `/`-separated path inside it, or null when it lies outside the
 * project. A path under `.claude/worktrees/<name>/` belongs to that worktree,
 * a checkout of its own.
 */
function locate(filePath, projectDir) {
  const abs = isAbsolute(filePath) ? filePath : resolve(projectDir, filePath)
  const rel = toPosix(relative(projectDir, abs))
  if (!rel || rel === '..' || rel.startsWith('../') || isAbsolute(rel)) return null
  const wt = /^\.claude\/worktrees\/([^/]+)\/(.+)$/.exec(rel)
  if (wt) return { base: join(projectDir, '.claude', 'worktrees', wt[1]), rel: wt[2], worktree: true }
  return { base: projectDir, rel }
}

/**
 * Whether a path is deck prose: slides.md, pages/*.md or components/*.vue of a
 * deck, which is a directory directly under a deck root (decks/, the
 * registry's decksDir, examples/ in the Decks repo) holding a slides.md, or a
 * registered deck. The path is judged relative to the project (or to the
 * worktree under .claude/worktrees/ it sits in), so a `decks/` directory above
 * the project brings nothing into scope. Never node_modules.
 */
export function inScope(filePath, projectDir, registry) {
  const at = locate(filePath, projectDir)
  if (!at) return false
  const { base, rel } = at
  if (/(^|\/)node_modules\//.test(rel)) return false
  if (at.worktree) registry = readRegistry(base)
  // A Write creating slides.md is what makes the directory a deck.
  const isDeck = (dir) => rel === `${dir}/slides.md` || existsSync(join(base, dir, 'slides.md'))
  for (const root of deckRoots(registry, base)) {
    const rest = root === '.' ? rel : rel.startsWith(`${root}/`) ? rel.slice(root.length + 1) : null
    const m = rest && UNDER_DECK.exec(rest)
    if (m && isDeck(root === '.' ? m[1] : `${root}/${m[1]}`)) return true
  }
  return deckDirs(registry).some((dir) => new RegExp(`^${escape(dir)}/${DECK_FILE}$`).test(rel))
}

/** The text a tool call writes: the content, the new string, or every new string. */
function writtenText(toolName, input) {
  if (toolName === 'Write') return input.content ?? ''
  if (toolName === 'Edit') return input.new_string ?? ''
  return (input.edits ?? []).map((e) => e?.new_string ?? '').join('\n')
}

/**
 * Replay the call against the file on disk: the file as it will read after,
 * plus the `[start, end)` character ranges of it the call wrote. Null when an
 * edit cannot be replayed (no file, an old_string that is not there).
 */
function replay(toolName, input, path) {
  if (toolName === 'Write') {
    const content = input.content ?? ''
    return { src: content, ranges: [[0, content.length]] }
  }
  let src
  try {
    src = readFileSync(path, 'utf8')
  } catch {
    return null
  }
  const before = src
  let ranges = []
  const edits = toolName === 'Edit' ? [input] : (input.edits ?? [])
  for (const e of edits) {
    const from = e?.old_string
    const to = e?.new_string ?? ''
    if (typeof from !== 'string' || !from || !src.includes(from)) return null
    const hits = []
    for (let at = src.indexOf(from); at >= 0; at = src.indexOf(from, at + from.length)) {
      hits.push(at)
      if (!e.replace_all) break
    }
    const delta = to.length - from.length
    // An offset in the old text, carried into the new one.
    const carry = (p) => {
      let shift = 0
      for (const at of hits) {
        if (p >= at + from.length) shift += delta
        else if (p > at) return at + shift + Math.min(p - at, to.length)
        else break
      }
      return p + shift
    }
    ranges = ranges.map(([s, t]) => [carry(s), carry(t)])
    let next = ''
    let last = 0
    hits.forEach((at, i) => {
      next += src.slice(last, at) + to
      last = at + from.length
      const start = at + i * delta
      ranges.push([start, start + to.length])
    })
    src = next + src.slice(last)
  }
  return { src, ranges, before }
}

/**
 * The hits to report from a replayed call: each one on a line it wrote, plus
 * each one it exposed without writing, such as prose a deleted `<!--` line
 * used to comment out. A hit on an untouched line is exposed when the file
 * before the call had no hit of that pattern on that text; hits are matched
 * by pattern and text, so one that only moved down the file is not new.
 */
function reportable(afterHits, beforeHits, touched) {
  const key = (h) => `${h.id}\0${h.text}`
  const seen = new Map()
  for (const h of beforeHits) seen.set(key(h), (seen.get(key(h)) ?? 0) + 1)
  return afterHits.filter((h) => {
    if (touched(h)) return true
    const n = seen.get(key(h)) ?? 0
    if (n) seen.set(key(h), n - 1)
    return !n
  })
}

/**
 * The 1-based line numbers of `src` the ranges cover; an empty range marks its
 * line. A range that opens with the newline ending a line starts on the next
 * one, so appending after a line does not count as touching it.
 */
function linesOf(src, ranges) {
  const lineAt = (p) => src.slice(0, p).split('\n').length
  const lines = new Set()
  for (let [s, t] of ranges) {
    if (t > s && src[s] === '\n') s++
    const end = lineAt(Math.max(s, t - 1))
    for (let l = lineAt(s); l <= end; l++) lines.add(l)
  }
  return lines
}

const DENY_FOOTER = `Rewrite the flagged
phrasing (don't synonym-swap). A rewrite that keeps the same sentence
skeleton with new words still reads as AI; change the structure, or
just state the fact plainly. If a hit is a legitimate direct quote,
append the lint-allow marker to that exact line:
  md/vue: <!-- lint-allow: pattern-id -->
  ts: // lint-allow: pattern-id`

export async function lintHook() {
  let payload
  try {
    payload = JSON.parse(await stdinText())
  } catch (err) {
    refuse(
      `decks hook lint could not parse the hook payload on stdin (${err.message}), so the write is refused.`,
    )
  }
  const toolName = payload?.tool_name
  if (!['Edit', 'Write', 'MultiEdit'].includes(toolName)) return
  const input = payload.tool_input ?? {}
  const filePath = input.file_path
  if (!filePath) return
  const projectDir = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd()
  const registry = readRegistry(projectDir)
  if (!inScope(filePath, projectDir, registry)) return
  const text = writtenText(toolName, input)
  // An empty Write writes no prose. An Edit with an empty new_string can still
  // expose some (a deletion that joins a phrase, or opens a comment), so the
  // replay below decides.
  if (toolName === 'Write' && !text) return

  // Loaded only now, so a broken scanner never blocks writes outside decks.
  let scan, patterns
  try {
    scan = await import('../lint/scan.mjs')
    patterns = scan.loadPatterns()
  } catch (err) {
    refuse(
      `decks hook lint cannot load the AI-rhetoric scanner or its patterns (${err.message}), ` +
        'so this write to deck prose is refused rather than allowed unlinted. ' +
        'Reinstall slidev-addon-decks, or restore lint/ai-rhetoric-patterns.tsv in it.',
    )
  }
  const opts = { errorsOnly: true }
  const lines = []
  const absolute = isAbsolute(filePath) ? filePath : resolve(projectDir, filePath)
  const after = replay(toolName, input, absolute)
  let where = 'Line numbers refer to the NEW text being written.'

  if (after) {
    // Judge the file as it will read after the call, so frontmatter, fences
    // and comments are known from context, and report only the lines the call
    // wrote. A Write is the whole file.
    const touched = linesOf(after.src, after.ranges)
    let label = 'stdin'
    if (toolName !== 'Write') {
      label = relative(projectDir, absolute).split(sep).join('/')
      where = `Line numbers refer to ${label} as it will read after this edit.`
    }
    const prose = (src) => scan.scanEntries(scan.proseLines(src), patterns, opts)
    const beforeProse = after.before === undefined ? [] : prose(after.before)
    for (const hit of reportable(prose(after.src), beforeProse, (h) => touched.has(h.line)))
      lines.push(scan.formatHit(label, hit))
    // Card copy lives in <script setup>, which the prose pass skips.
    if (filePath.endsWith('.vue')) {
      const strings = scan.copyStrings(after.src)
      // A string counts as written when the call wrote any line it spans.
      const written = new Set(
        strings
          .filter((s) => {
            const last = s.line + s.raw.split('\n').length - 1
            for (let l = s.line; l <= last; l++) if (touched.has(l)) return true
            return false
          })
          .map((s) => s.line),
      )
      const copy = (list) => scan.scanEntries(list, patterns, opts)
      const beforeCopy = after.before === undefined ? [] : copy(scan.copyStrings(after.before))
      for (const hit of reportable(copy(strings), beforeCopy, (h) => written.has(h.line)))
        lines.push(scan.formatHit(label, hit) + ' (story card COPY)')
    }
  } else {
    // The edit cannot be replayed (no file yet, or old_string is not in it):
    // scan the written text alone, as a fragment cut from a file.
    for (const hit of scan.scanEntries(scan.proseLines(text, { fragment: true }), patterns, opts))
      lines.push(scan.formatHit('stdin', hit))
    if (filePath.endsWith('.vue'))
      for (const hit of scan.scanEntries(scan.fieldStrings(text), patterns, opts))
        lines.push(scan.formatHit('stdin', hit) + ' (story card COPY)')
  }
  if (!lines.length) return

  emit({
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: `BLOCKED: AI-rhetoric patterns found in prose.\n\n${lines.join('\n')}\n\n${where} ${DENY_FOOTER}`,
  })
}

const DECK_VERBS = '(write|writ|draft|revis|edit|polish|build|author|make)'
const DECK_NOUNS = '(\\bdeck\\b|\\bslides?\\b|\\btalk\\b|\\bpresentation\\b|\\bslidev\\b)'
const DECK_INTENT = new RegExp(
  `\\b${DECK_VERBS}.{0,60}${DECK_NOUNS}|${DECK_NOUNS}.{0,60}\\b${DECK_VERBS}`,
  'i',
)
const REVISION =
  /\b(rewrite|reword|rephras|revis|trim|tighten|shorten|cut|polish|slop|headline|bullet|eyebrow|wording|phrasing|too (long|wordy|dense))/i

/**
 * Whether deck pages, slides.md or components have uncommitted changes, which
 * is how a revision prompt that no longer names the deck ("tighten this
 * bullet") is told apart from one about something else.
 */
function deckWorkInProgress(projectDir, registry) {
  const top = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd: projectDir,
    encoding: 'utf8',
  })
  if (top.status !== 0) return false
  // Only real decks: a root's children holding a slides.md, and registered decks.
  const onDisk = deckRoots(registry, projectDir).flatMap((root) =>
    deckNamesUnder(join(projectDir, root)).map((name) => (root === '.' ? name : `${root}/${name}`)),
  )
  const dirs = [...new Set([...onDisk, ...deckDirs(registry)])].filter((d) =>
    existsSync(join(projectDir, d)),
  )
  if (!dirs.length) return false
  const status = spawnSync('git', ['status', '--porcelain', '--', ...dirs], {
    cwd: projectDir,
    encoding: 'utf8',
  })
  return status.status === 0 && /\/(pages|components)\/|slides\.md/.test(status.stdout)
}

/**
 * How the project runs the CLI: `bunx` when the nearest lockfile is bun's,
 * else `npx`. The same rule `decks init` uses for the instructions it writes.
 */
function runner(projectDir) {
  const locks = ['bun.lock', 'bun.lockb', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']
  for (let d = resolve(projectDir); ; d = dirname(d)) {
    if (locks.some((l) => existsSync(join(d, l))))
      return existsSync(join(d, 'bun.lock')) || existsSync(join(d, 'bun.lockb')) ? 'bunx' : 'npx'
    if (dirname(d) === d) return 'npx'
  }
}

/** The reminder. Inside the Decks repo it names the repo scripts; elsewhere the CLI. */
function reminder(projectDir) {
  const lint = isDecksRepo(projectDir)
    ? '`bun run lint`'
    : `\`${runner(projectDir)} -p slidev-addon-decks decks lint\``
  return `Deck writing reminder (see .claude/rules/deck-writing.md):
- Slides are NOT short articles. The audience gets one pass at reading speed while someone talks over it. The slide carries only what must be read; the speaker carries the rest.
- Word budget: ~70 visible words on a normal slide. A story card is eight words of lead, twenty of body. 150 means split the slide. Four figures means it is a bug.
- Headlines are CLAIMS, full sentences ending in a period ("Interview the agent like you'd interview a user."), not topic labels. This deliberately INVERTS the usual article section-title rule; do not carry article habits in. Same for chart titles: findings, not labels.
- Bullets: three per slide, one sentence each, parallel grammatical shape. A bullet that only makes sense next to its neighbor is one bullet.
- NO paragraphs. \`od-lede\` is for a single sentence. Three connected sentences go in speaker notes or across two slides.
- Anti-slop shapes carry over unchanged (${lint} covers each deck's \`pages/*.md\`, \`slides.md\`, \`components/*.vue\` and story-card COPY): never "X is real", never characterize a finding instead of stating it, never negation-then-assertion, never an em dash. Catalog: .claude/rules/prose-patterns.md.
- Article rules that do NOT apply here: paragraph construction, leading each paragraph with its point, prose density, and paragraph-level structural review.
- Every figure traces to a query in \`<deck>/data-sources.md\` and a \`<deck>/data/*.ts\` constant (.claude/rules/deck-data.md). Deck fact-check runs the \`fact-checking-a-deck\` skill.`
}

export async function promptHook() {
  let payload
  try {
    payload = JSON.parse(await stdinText())
  } catch {
    return // A reminder is advisory; a payload it cannot read just gets none.
  }
  const prompt = payload?.prompt
  if (!prompt) return
  const projectDir = process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd()
  let fires = DECK_INTENT.test(prompt)
  if (!fires && REVISION.test(prompt))
    fires = deckWorkInProgress(projectDir, readRegistry(projectDir))
  if (!fires) return
  emit({ hookEventName: 'UserPromptSubmit', additionalContext: reminder(projectDir) })
}

export async function hookCommand(args) {
  const [kind] = args
  // Fail closed: a bug in the lint hook refuses the write instead of passing it.
  if (kind === 'lint')
    return lintHook().catch((err) =>
      refuse(`decks hook lint failed (${err?.stack ?? err}), so the write is refused.`),
    )
  if (kind === 'prompt') return promptHook()
  console.error('Usage: decks hook {lint|prompt}   (reads the Claude Code hook payload on stdin)')
  process.exit(1)
}
