/**
 * Slide 16: OpenChart. Sourced in data/sources/16-openchart.md.
 * Read 2026-11-13 from ~/Projects/openchart at commit 26bd0ba6.
 *
 * README_SPEC is the bar spec from README.md lines 26 to 44, as an object.
 * BAD_SPEC is the same spec with one encoding field misspelled by swapping two
 * letters, the way the engine's own test does it
 * (packages/engine/src/compiler/__tests__/validate-did-you-mean.test.ts lines
 * 25 to 40, where "revenue" becomes "reveune").
 *
 * The verdict is not recorded: `validateSpec` from the installed
 * @opendata-ai/openchart-engine runs on both specs when this module loads, and
 * the slide prints what it returned. The guards at the bottom throw if the
 * engine stops rejecting the bad spec or stops accepting the fixed one.
 *
 * MARKS: the entries of MARK_TYPES in packages/core/src/types/spec.ts (lines
 *   3486 to 3506). Two comments in the repo still say 16.
 * PACKAGES: for each name,
 *   find packages/<name>/src -name '*.ts*' -not -path '*__tests__*' -not -name '*.test.*' | xargs cat | wc -l
 *   That glob counts .ts and .tsx only, so the .vue and .svelte component
 *   files of those two wrappers are not in their figures.
 * VALIDATOR_LINES:
 *   find packages/engine/src -path '*validat*' -not -path '*__tests__*' -name '*.ts' | xargs wc -l
 * ENGINE_VERSION: the version this repo's package.json pins, and the one in
 *   every packages/<name>/package.json of the openchart repo.
 */
import { validateSpec } from '@opendata-ai/openchart-engine'
import type { Excerpt } from './code/types'

export const README_SPEC = {
  mark: 'bar',
  data: [
    { language: 'Python', popularity: 29 },
    { language: 'JavaScript', popularity: 24 },
    { language: 'TypeScript', popularity: 17 },
    { language: 'Java', popularity: 14 },
    { language: 'Go', popularity: 10 },
  ],
  encoding: {
    x: { field: 'popularity', type: 'quantitative' },
    y: { field: 'language', type: 'nominal' },
  },
  chrome: {
    title: 'Python leads developer mindshare',
    subtitle: '2024 developer survey results',
    source: 'Source: Stack Overflow',
  },
} as const

/** The one token that differs between the two specs. */
export const TYPO = { right: 'language', wrong: 'langauge' } as const

export const BAD_SPEC = {
  ...README_SPEC,
  encoding: { ...README_SPEC.encoding, y: { ...README_SPEC.encoding.y, field: TYPO.wrong } },
}

const bad = validateSpec(BAD_SPEC)
const fixed = validateSpec(README_SPEC)

/** What the engine said about the misspelled spec: its first error. */
export const VERDICT = {
  errors: bad.errors.length,
  path: bad.errors[0]?.path ?? '',
  code: bad.errors[0]?.code ?? '',
  suggestion: bad.errors[0]?.suggestion ?? '',
}
/** What it said about the README's spec. */
export const FIXED = { valid: fixed.valid, errors: fixed.errors.length }

/** The elision line, and the spec lines the slide has room for. */
const ELIDED = '    // …'
function shownLines(spec: unknown): string[] {
  const all = JSON.stringify(spec, null, 2).split('\n')
  const data = all.indexOf('  "data": [')
  const dataEnd = all.indexOf('  ],', data)
  const encoding = all.indexOf('  "encoding": {', dataEnd)
  const encodingEnd = all.indexOf('  },', encoding)
  return [all[1], all[data], ELIDED, ...all.slice(dataEnd, encodingEnd + 1)]
}

/**
 * The spec as the code pane shows it. Not a quoted file: it is
 * `JSON.stringify(spec, null, 2)` of the objects above, with the data rows and
 * the chrome block dropped. `start` and `end` are the README lines the spec
 * comes from. This lives outside data/code/ because no source file has these
 * lines to drift against.
 */
const specExcerpt = (spec: unknown): Excerpt => ({
  repo: 'openchart',
  path: 'README.md',
  start: 26,
  end: 44,
  commit: '26bd0ba6',
  lang: 'json',
  code: shownLines(spec).join('\n'),
})
export const BAD_EXCERPT = specExcerpt(BAD_SPEC)
export const FIXED_EXCERPT = specExcerpt(README_SPEC)
/** What the pane's own label says, in place of a file path. */
export const SPEC_LABEL = 'spec.json · openchart README, lines 26 to 44'

/** The 1-based line of the shown spec that holds the misspelled field. */
export const TYPO_LINE = shownLines(BAD_SPEC).findIndex((line) => line.includes(`"${TYPO.wrong}"`)) + 1

export const ENGINE_VERSION = '9.0.0'
export const MARKS = 19
export const VALIDATOR_LINES = 3369

export interface Package {
  name: string
  /** Non-test .ts and .tsx lines under packages/<name>/src. */
  lines: number
  /** What the package is, in two or three words. */
  role: string
}
export const PACKAGES: readonly Package[] = [
  { name: 'core', lines: 13668, role: 'types and theme' },
  { name: 'engine', lines: 50369, role: 'computes layout' },
  { name: 'vanilla', lines: 42424, role: 'draws to the DOM' },
  { name: 'react', lines: 2639, role: 'wrapper' },
  { name: 'vue', lines: 2502, role: 'wrapper' },
  { name: 'svelte', lines: 864, role: 'wrapper' },
]
const linesOf = (name: string) => PACKAGES.find((p) => p.name === name)?.lines ?? 0
/** The React wrapper's size as a whole percent of the engine's. */
export const REACT_SHARE = Math.round((linesOf('react') / linesOf('engine')) * 100)

if (bad.valid || !VERDICT.path || !VERDICT.suggestion.includes(`"${TYPO.right}"`)) {
  throw new Error('16-openchart: the engine no longer rejects the misspelled field with a suggestion')
}
if (!fixed.valid) throw new Error('16-openchart: the engine no longer accepts the README spec')
if (TYPO_LINE < 1) throw new Error('16-openchart: the misspelled line is not among the shown lines')
