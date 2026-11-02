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

/** The project's registry, or {} when there is none or it does not parse. */
function readRegistry(projectDir) {
  try {
    return JSON.parse(readFileSync(join(projectDir, 'decks.json'), 'utf8'))
  } catch {
    return {}
  }
}

/** Directories (relative to the project) whose children are decks. */
function deckRoots(registry) {
  const roots = new Set(['examples', 'decks'])
  if (registry._config?.decksDir) roots.add(registry._config.decksDir.replace(/\/+$/, ''))
  return [...roots]
}

/** Registered deck directories, relative to the project, `/`-separated. */
function deckDirs(registry) {
  return Object.entries(registry)
    .filter(([alias, d]) => !alias.startsWith('_') && typeof d?.entry === 'string')
    .map(([, d]) => dirname(d.entry).split(sep).join('/'))
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const DECK_FILE = '(?:pages/.+\\.md|slides\\.md|components/.+\\.vue)'

/**
 * Whether a path is deck prose: slides.md, pages/*.md or components/*.vue of a
 * deck under a deck root (examples/, decks/, the registry's decksDir) at any
 * prefix, so absolute and worktree paths count, or of any registered deck.
 * Never node_modules.
 */
export function inScope(filePath, projectDir, registry) {
  const path = filePath.split(sep).join('/')
  if (/(^|\/)node_modules\//.test(path)) return false
  const roots = deckRoots(registry).map(escape).join('|')
  if (new RegExp(`(?:^|/)(?:${roots})/.+?/${DECK_FILE}$`).test(path)) return true
  const rel = (isAbsolute(filePath) ? relative(projectDir, filePath) : filePath)
    .split(sep)
    .join('/')
  return deckDirs(registry).some((dir) => new RegExp(`^${escape(dir)}/${DECK_FILE}$`).test(rel))
}

/** The text a tool call writes: the content, the new string, or every new string. */
function writtenText(toolName, input) {
  if (toolName === 'Write') return input.content ?? ''
  if (toolName === 'Edit') return input.new_string ?? ''
  return (input.edits ?? []).map((e) => e?.new_string ?? '').join('\n')
}

/**
 * The file as it will read after the call, or null when an edit cannot be
 * replayed against the file on disk.
 */
function resultingFile(toolName, input, path) {
  if (toolName === 'Write') return input.content ?? ''
  let src
  try {
    src = readFileSync(path, 'utf8')
  } catch {
    return null
  }
  const edits = toolName === 'Edit' ? [input] : (input.edits ?? [])
  for (const e of edits) {
    if (typeof e?.old_string !== 'string' || !src.includes(e.old_string)) return null
    src = e.replace_all
      ? src.replaceAll(e.old_string, () => e.new_string ?? '')
      : src.replace(e.old_string, () => e.new_string ?? '')
  }
  return src
}

const DENY_FOOTER = `Line numbers refer to the NEW text being written. Rewrite the flagged
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
  if (!text) return

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
  const lines = scan
    .scanEntries(scan.proseLines(text), patterns, opts)
    .map((hit) => scan.formatHit('stdin', hit))

  // Card copy lives in <script setup>, which the prose pass skips. Scan the
  // COPY array of the file as it will read after the call, and report only
  // strings this call writes, so a fragment edit is judged in context.
  if (filePath.endsWith('.vue')) {
    const absolute = isAbsolute(filePath) ? filePath : resolve(projectDir, filePath)
    const after = resultingFile(toolName, input, absolute)
    const strings =
      after === null
        ? scan.fieldStrings(text)
        : scan.copyStrings(after).filter((s) => text.includes(s.raw))
    for (const s of strings) {
      const at = text.indexOf(s.raw)
      const entry = { ...s, line: at < 0 ? s.line : text.slice(0, at).split('\n').length }
      for (const hit of scan.scanEntries([entry], patterns, opts))
        lines.push(scan.formatHit('stdin', hit) + ' (story card COPY)')
    }
  }
  if (!lines.length) return

  emit({
    hookEventName: 'PreToolUse',
    permissionDecision: 'deny',
    permissionDecisionReason: `BLOCKED: AI-rhetoric patterns found in prose.\n\n${lines.join('\n')}\n\n${DENY_FOOTER}`,
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
  const dirs = [...deckRoots(registry), ...deckDirs(registry)].filter((d) =>
    existsSync(join(projectDir, d)),
  )
  if (!dirs.length) return false
  const status = spawnSync('git', ['status', '--porcelain', '--', ...dirs], {
    cwd: projectDir,
    encoding: 'utf8',
  })
  return status.status === 0 && /\/(pages|components)\/|slides\.md/.test(status.stdout)
}

/** The reminder. Inside the Decks repo it names the repo scripts; elsewhere the CLI. */
function reminder(inRepo) {
  const lint = inRepo ? '`bun run lint`' : '`bunx -p slidev-addon-decks decks lint`'
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

/** True in the Decks repo itself: the addon is a workspace package, not a dependency. */
function isDecksRepo(projectDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(projectDir, 'packages/decks/package.json'), 'utf8'))
    return pkg.name === 'slidev-addon-decks'
  } catch {
    return false
  }
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
  emit({ hookEventName: 'UserPromptSubmit', additionalContext: reminder(isDecksRepo(projectDir)) })
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
