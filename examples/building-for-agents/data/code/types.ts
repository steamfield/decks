/**
 * A code excerpt shown on a slide. Every excerpt is real code, quoted from the
 * named file. `code` is exactly what the slide shows: lines may be dropped,
 * and a dropped run is marked with a line that is only an elision comment
 * (`// …` or `# …`). A line that ends in ` …` is a source line cut short at
 * that point. `data/code/excerpts.test.ts` checks every other line, and the
 * kept part of a cut line, against the source file when the sibling repo is
 * present.
 */
export interface Excerpt {
  /** Directory name under ~/Projects, e.g. "stacks". */
  repo: string
  /** Path inside that repo. */
  path: string
  /** First and last source line the excerpt draws from, 1-based, inclusive. */
  start: number
  end: number
  /** The commit the file was read at. */
  commit: string
  lang: 'ts' | 'rust' | 'json' | 'sh' | 'yaml' | 'text'
  code: string
}

/** A line that stands for dropped source lines. */
export function isElision(line: string): boolean {
  return /^\s*(\/\/|#)\s*…\s*$/.test(line)
}

/** The kept part of a line cut short with a trailing ` …`, or null. */
export function cutLine(line: string): string | null {
  const kept = /^(.*\S) …\s*$/.exec(line)?.[1]
  return kept === undefined ? null : kept.trim()
}
