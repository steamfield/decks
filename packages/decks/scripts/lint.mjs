// `decks lint`: the AI-rhetoric scan over decks, files or stdin, printing one
// line per hit in content-lint.sh's format. The scanner itself is
// ../lint/scan.mjs; this file picks the files and turns hits into an exit code.
//
// Exit codes match content-lint.sh: 0 clean (or warnings only), 1 an
// error-severity hit (or any hit under --strict), 2 the patterns file is
// missing or unreadable.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
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
    console.error(`error: patterns file not found or unreadable: ${PATTERNS_FILE} (${err.message})`)
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

/**
 * The `decks lint` command. `targets` are aliases or file paths; none means
 * every registered deck. `decks` maps alias -> registry entry, or is null when
 * there is no registry (then only file paths and --stdin work).
 */
export async function lintCommand(args, { rootDir, decks, die, noRegistry }) {
  const strict = args.includes('--strict')
  const errorsOnly = args.includes('--errors-only')
  const stdin = args.includes('--stdin')
  const targets = args.filter((a) => !a.startsWith('--'))
  let counts
  if (stdin) {
    const chunks = []
    for await (const chunk of process.stdin) chunks.push(chunk)
    counts = lintText(Buffer.concat(chunks).toString('utf8'), { errorsOnly })
  } else {
    if (!decks && !targets.length) die(noRegistry)
    const files = []
    for (const target of targets.length ? targets : Object.keys(decks)) {
      const deck = decks?.[target]
      if (deck) files.push(...deckFiles(resolve(rootDir, deck.entry, '..')))
      else if (existsSync(resolve(rootDir, target))) files.push(resolve(rootDir, target))
      else
        die(`Unknown deck or file "${target}". Known decks: ${Object.keys(decks ?? {}).join(', ')}`)
    }
    counts = lintFiles(files, { rootDir, errorsOnly })
  }
  if (counts.errors || (strict && counts.warns)) process.exitCode = 1
}
