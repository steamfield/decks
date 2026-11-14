/**
 * Slide 17: Decks. Sourced in data/sources/17-decks.md.
 *
 * Nothing here is typed in. Every figure is computed when the module loads,
 * from files in this repository, read 2026-11-13 at commit 811fe91:
 *
 * DENIAL: site/fixtures/hook-denial.json. site/scripts/capture-hook.mjs wrote
 *   it by feeding the write hook one planted line as a Claude Code PreToolUse
 *   payload; site/src/content-drift.test.ts reruns the hook and fails if the
 *   answer changes. The fixture carries no date, so DENIAL_RECORDED is the
 *   date of the commit that last wrote it:
 *   `git log -1 --format=%ad --date=short -- site/fixtures/hook-denial.json`
 * PATTERNS, DENIED: the rows of packages/decks/lint/ai-rhetoric-patterns.tsv,
 *   read the way `loadPatterns` in packages/decks/lint/scan.mjs reads them.
 *   A row of severity `error` is one the write hook denies (the file's header
 *   comment, and `errorsOnly` in scan.mjs).
 * SOURCED_FIGURES: the table rows of this deck's data-sources.md and of
 *   data/sources/*.md, header and separator rows left out. A row that appears
 *   in both (after a slide's section is merged) counts once.
 */
import type { TermLine } from './types'
import denial from '../../../site/fixtures/hook-denial.json'
import patternsTsv from '../../../packages/decks/lint/ai-rhetoric-patterns.tsv?raw'

/* ── The recorded denial ── */

export const DENIAL_SOURCE = 'site/fixtures/hook-denial.json'
export const DENIAL_RECORDED = '2026-11-02'
/** The pattern ids the hook named. */
export const DENIAL_RULES: readonly string[] = denial.rules

/** The hook's own lines that name a rule, each wrapped once at its arrow. */
const findings = denial.reason
  .filter((line) => /^stdin:\d+ \[/.test(line))
  .flatMap((line): TermLine[] => {
    const [hit, message] = line.split(' -> ')
    return [
      { text: hit, tone: 'out' },
      { text: `  -> ${message}`, tone: 'out' },
    ]
  })

/** The write, the hook, its decision and what it printed. */
export const DENIAL: readonly TermLine[] = [
  { text: `${denial.tool} ${denial.file}`, tone: 'agent' },
  { text: denial.line, tone: 'muted' },
  { text: denial.hook, tone: 'cmd' },
  { text: `decision: ${denial.decision}`, tone: 'fail' },
  { text: denial.reason[0], tone: 'fail' },
  ...findings,
]

/* ── The lint's patterns ── */

const patternRows = patternsTsv
  .split(/\r?\n/)
  .filter((line) => line.trim() && !line.startsWith('#'))
  .map((line) => line.split('\t'))
  .filter(([id]) => id)
  .map(([id, severity]) => ({ id, denied: severity === 'error' }))

/** One entry per pattern, in file order: its id and whether the hook denies it. */
export const PATTERN_ROWS: readonly { id: string; denied: boolean }[] = patternRows
export const PATTERNS = patternRows.length
export const DENIED = patternRows.filter((row) => row.denied).length

/* ── The deck's source rows ── */

const sourceFiles = import.meta.glob<string>(['../data-sources.md', './sources/*.md'], {
  query: '?raw',
  import: 'default',
  eager: true,
})

const SEPARATOR = /^\|[\s:|-]+\|?\s*$/
/** A file's table rows, without each table's header and separator. */
function tableRows(markdown: string): string[] {
  const lines = markdown.split(/\r?\n/)
  return lines.filter(
    (line, i) => line.startsWith('| ') && !SEPARATOR.test(line) && !SEPARATOR.test(lines[i + 1] ?? ''),
  )
}

export const SOURCE_FILES = Object.keys(sourceFiles).length
export const SOURCED_FIGURES = new Set(Object.values(sourceFiles).flatMap(tableRows)).size

if (DENIED < 1 || !DENIAL_RULES.every((rule) => patternRows.some((row) => row.id === rule && row.denied))) {
  throw new Error('17-decks: the recorded denial names a rule that is no longer an error pattern')
}
if (SOURCED_FIGURES < 1) throw new Error('17-decks: no source rows found')
