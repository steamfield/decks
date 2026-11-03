/**
 * The prose scanner's line handling: the pattern file as a Windows checkout or
 * a careless edit leaves it, and the text that shares a line with the end of a
 * multi-line comment.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PATTERNS_FILE, loadPatterns, proseLines } from '../lint/scan.mjs'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})
const tsv = (text: string) => {
  const dir = mkdtempSync(join(tmpdir(), 'decks-scan-'))
  dirs.push(dir)
  writeFileSync(join(dir, 'patterns.tsv'), text)
  return join(dir, 'patterns.tsv')
}

describe('loadPatterns', () => {
  it('reads a CRLF copy of the shipped file the same as the LF one', () => {
    const lf = readFileSync(PATTERNS_FILE, 'utf8')
    const crlf = loadPatterns(tsv(lf.replace(/\n/g, '\r\n')))
    const plain = loadPatterns()
    expect(crlf.map((p) => [p.id, p.severity, p.message, p.re.source])).toEqual(
      plain.map((p) => [p.id, p.severity, p.message, p.re.source]),
    )
    for (const p of crlf) expect(p.message).not.toMatch(/\r/)
  })

  it('skips blank and whitespace-only lines, a trailing one included', () => {
    const patterns = loadPatterns(tsv('# id\tseverity\tregex\tmessage\n\nx\terror\tfoo\tbar\n   \n\t\n\n'))
    expect(patterns.map((p) => p.id)).toEqual(['x'])
  })
})

describe('proseLines', () => {
  const texts = (src: string) => proseLines(src).map((e) => e.text)

  it('scans the text after a multi-line HTML comment closes on its line', () => {
    expect(texts('<!--\nnote\n--> After the comment.\nNext line.\n')).toEqual([
      ' After the comment.',
      'Next line.',
    ])
  })

  it('scans the text after a multi-line JSX comment closes on its line', () => {
    expect(texts('{/*\nnote\n*/} After it.\n')).toEqual([' After it.'])
  })

  it('reads lint-allow on the closing line, inside or after the comment', () => {
    const [entry] = proseLines('<!--\nnote\n--> Quoted. <!-- lint-allow: em-dash -->\n')
    expect(entry.allow).toEqual(['em-dash'])
  })
})
