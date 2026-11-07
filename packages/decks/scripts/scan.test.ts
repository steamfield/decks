/**
 * The prose scanner's line handling: the pattern file as a Windows checkout or
 * a careless edit leaves it, and the text that shares a line with the end of a
 * multi-line comment.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PATTERNS_FILE, loadPatterns, presenterNotes, proseLines } from '../lint/scan.mjs'

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

describe('presenterNotes', () => {
  const page = (...parts: string[]) => parts.join('\n\n') + '\n'
  const header = '<!--\nSLIDE 3 · X\n-->'

  it('skips a plain SLIDE header and finds nothing on a page without notes', () => {
    expect(presenterNotes(page(header, '<XStage />'))).toBeNull()
  })

  it('reads a SLIDE header that holds SAY (opening) or a marker as notes, not as the header', () => {
    const say = presenterNotes(page('<!--\nSLIDE 3 · X\nSAY (opening)\nBeat 0.\n-->', '<XStage />'))
    expect(say).toMatchObject({ line: 1, trailing: false, structured: true, clicks: 0 })
    const click = presenterNotes(page('<!--\nSLIDE 3 · X\n[click] Beat 1.\n-->', '<XStage />'))
    expect(click).toMatchObject({ line: 1, trailing: false, structured: true, clicks: 1 })
  })

  it('returns free-form trailing notes as unstructured', () => {
    const plain = presenterNotes(page(header, '# A slide.', '<!--\nSpeak to the chart.\n-->'))
    expect(plain).toMatchObject({ line: 7, trailing: true, structured: false, clicks: 0, numbered: [] })
    expect(plain?.text).toBe('\nSpeak to the chart.\n')
    const asked = presenterNotes(page(header, '<XStage />', '<!--\nABOUT THIS SLIDE\nA map.\n\nIF ASKED\nNo.\n-->'))
    expect(asked).toMatchObject({ trailing: true, structured: false })
  })

  it('does not read a mid-page comment without markers as notes', () => {
    expect(presenterNotes(page(header, '<!-- layout aside -->', '# A slide.'))).toBeNull()
  })

  it('skips the header after a CRLF frontmatter block', () => {
    const src = page('---\r\nclicks: 1\r\n---', header, '# A slide.', '<!--\r\nSAY (opening)\r\n[click] B.\r\n-->').replace(
      /(?<!\r)\n/g,
      '\r\n',
    )
    expect(presenterNotes(src)).toMatchObject({ trailing: true, structured: true, clicks: 1 })
    // The header ends the page here, so only the frontmatter match keeps it
    // from reading as free-form notes.
    const plain = page('---\r\nclicks: 0\r\n---', header).replace(/(?<!\r)\n/g, '\r\n')
    expect(presenterNotes(plain)).toBeNull()
  })
})
