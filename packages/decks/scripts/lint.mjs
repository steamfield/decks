// `decks lint`: the AI-rhetoric scan over decks, files or stdin, printing one
// line per hit in content-lint.sh's format. The scanner itself is
// ../lint/scan.mjs; this file picks the files and turns hits into an exit code.
//
// Exit codes match content-lint.sh: 0 clean (or warnings only), 1 an
// error-severity hit (or any hit under --strict), 2 the patterns file is
// missing, unreadable or holds no error-severity rows.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import {
  PATTERNS_FILE,
  formatHit,
  loadPatterns,
  scanEntries,
  proseLines,
  scanSource,
} from '../lint/scan.mjs'

/** A deck's lintable files: slides.md, pages/**\/*.md, components/**\/*.vue. */
export function deckFiles(deckDir) {
  const walk = (dir, ext) =>
    !existsSync(dir)
      ? []
      : readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
          if (e.name === 'node_modules') return []
          const path = join(dir, e.name)
          if (e.isDirectory()) return walk(path, ext)
          return e.name.endsWith(ext) ? [path] : []
        })
  const slides = join(deckDir, 'slides.md')
  return [
    ...(existsSync(slides) ? [slides] : []),
    ...walk(join(deckDir, 'pages'), '.md'),
    ...walk(join(deckDir, 'components'), '.vue'),
  ]
}

/** The pattern rows, or exit 2 the way content-lint.sh did on a missing file. */
function patternsOrExit() {
  try {
    return loadPatterns()
  } catch (err) {
    console.error(`error: patterns file missing, unreadable or invalid: ${PATTERNS_FILE} (${err.message})`)
    process.exit(2)
  }
}

/**
 * Scan `files` (absolute paths) and print every hit, paths shown relative to
 * `rootDir`. Returns the error and warning counts.
 */
export function lintFiles(files, { rootDir, errorsOnly = false, log = console.log } = {}) {
  const patterns = patternsOrExit()
  let errors = 0
  let warns = 0
  for (const file of [...new Set(files)].sort()) {
    const shown = relative(rootDir, file).split(sep).join('/')
    for (const hit of scanSource(file, readFileSync(file, 'utf8'), patterns, { errorsOnly })) {
      log(formatHit(shown, hit))
      if (hit.severity === 'error') errors++
      else warns++
    }
  }
  return { errors, warns }
}

/** Scan stdin as one prose fragment, as `content-lint.sh --stdin` did. */
export function lintText(text, { errorsOnly = false, log = console.log } = {}) {
  const patterns = patternsOrExit()
  let errors = 0
  let warns = 0
  for (const hit of scanEntries(proseLines(text), patterns, { errorsOnly })) {
    log(formatHit('stdin', hit))
    if (hit.severity === 'error') errors++
    else warns++
  }
  return { errors, warns }
}

const USAGE =
  'Usage: decks lint [alias|deck-dir|file ...] [--strict] [--errors-only]  |  decks lint --stdin [--errors-only]'
const FLAGS = new Set(['--strict', '--errors-only', '--stdin'])

/** True in the Decks repo itself, where the shipped decks sit in examples/. */
function isDecksRepo(rootDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(rootDir, 'packages/decks/package.json'), 'utf8'))
    return pkg.name === 'slidev-addon-decks'
  } catch {
    return false
  }
}

/** Absolute dirs of `<root>/*` that hold a slides.md. */
function decksUnder(root) {
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== 'node_modules' && !e.name.startsWith('.'))
    .map((e) => join(root, e.name))
    .filter((dir) => existsSync(join(dir, 'slides.md')))
}

/**
 * Every deck to lint when no target is given: the registered ones, plus any
 * deck on disk under decksDir (and examples/ in the Decks repo) that the
 * registry does not list yet. Absolute dirs, deduplicated.
 */
export function allDeckDirs({ rootDir, decks, decksDir = 'decks' }) {
  const dir = decksDir.replace(/^(\.\/)+/, '').replace(/\/+$/, '') || '.'
  const roots = [resolve(rootDir, dir), ...(isDecksRepo(rootDir) ? [join(rootDir, 'examples')] : [])]
  return [
    ...new Set([
      ...Object.values(decks ?? {})
        .filter((d) => typeof d?.entry === 'string')
        .map((d) => dirname(resolve(rootDir, d.entry))),
      ...roots.flatMap(decksUnder),
    ]),
  ]
}

/**
 * The `decks lint` command. `targets` are aliases, deck directories or file
 * paths; none means every deck (see allDeckDirs). `decks` maps alias ->
 * registry entry, or is null when there is no registry.
 */
export async function lintCommand(args, { rootDir, decks, decksDir, die, noRegistry }) {
  const unknown = args.filter((a) => a.startsWith('--') && !FLAGS.has(a))
  if (unknown.length) die(`Unknown flag ${unknown.join(', ')}.\n${USAGE}`)
  const strict = args.includes('--strict')
  const errorsOnly = args.includes('--errors-only')
  const stdin = args.includes('--stdin')
  const targets = args.filter((a) => !a.startsWith('--'))
  let counts
  if (stdin) {
    if (targets.length) die(`--stdin takes no targets.\n${USAGE}`)
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    counts = lintText(Buffer.concat(chunks).toString('utf8'), { errorsOnly })
  } else {
    const files = []
    if (!targets.length) {
      const dirs = allDeckDirs({ rootDir, decks, decksDir })
      if (!dirs.length) die(decks ? `No decks found to lint.\n${USAGE}` : noRegistry)
      for (const dir of dirs) files.push(...deckFiles(dir))
    }
    for (const target of targets) {
      const deck = decks?.[target]
      const path = resolve(rootDir, target)
      if (deck) files.push(...deckFiles(resolve(rootDir, deck.entry, '..')))
      else if (!existsSync(path))
        die(`Unknown deck or file "${target}". Known decks: ${Object.keys(decks ?? {}).join(', ')}`)
      else if (!statSync(path).isDirectory()) files.push(path)
      else if (existsSync(join(path, 'slides.md'))) files.push(...deckFiles(path))
      else die(`${target} is a directory with no slides.md; pass a deck directory, an alias or a file.\n${USAGE}`)
    }
    counts = lintFiles(files, { rootDir, errorsOnly })
  }
  if (counts.errors || (strict && counts.warns)) process.exitCode = 1
}
