/**
 * `decks review-prose` maps rendered strings back to their source and cuts
 * presenter notes by click; the wrap warning counts a headline's lines from
 * its text rects. The browser half is exercised by running the command on a
 * deck; these pin the parts that decide what the reviewer is told.
 */
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { lineCount, wrapWarning } from './browser.mjs'
import {
  clickList,
  locate,
  noteSections,
  relatedFiles,
  reviewPrompt,
  ruleText,
  slidePages,
  sourceIndex,
} from './review-prose.mjs'

const ROOT = resolve(__dirname, '..', '..', '..')
const TX = join(ROOT, 'examples', 'texas-2026')

const index = sourceIndex({
  'components/ArcStage.vue': [
    '<script setup lang="ts">',
    "const COPY = [{ lead: 'A nominee would need both parties\\' votes.' }]",
    '</script>',
    '<h2 class="od-story-head">With {{ c.present }} present, confirmation takes {{ c.required }} votes.</h2>',
    '<text>{{ n }} {{ labels.democratic }}</text>',
  ].join('\n'),
  'data/08-arc.ts': "export const labels = { democratic: 'Democrats', gap: 'Republican votes needed' }",
  'pages/08-arc.md': '<!--\nAll 12 Democrats support the nominee here.\n-->',
})

describe('locate', () => {
  it('maps a verbatim string exactly, through an escaped quote', () => {
    expect(locate("A nominee would need both parties' votes.", index)).toEqual({
      file: 'components/ArcStage.vue',
      line: 2,
      exact: true,
    })
  })

  it('maps a headline with its figures filled in to the template line', () => {
    expect(locate('With 31 present, confirmation takes 21 votes.', index)).toEqual({
      file: 'components/ArcStage.vue',
      line: 4,
      exact: false,
    })
  })

  it('prefers the quoted label over prose that mentions the same word', () => {
    expect(locate('12 Democrats', index)).toMatchObject({ file: 'data/08-arc.ts', exact: false })
  })

  it('returns null when no source holds enough of the string', () => {
    expect(locate('Something written nowhere at all.', index)).toBeNull()
  })
})

describe('noteSections', () => {
  it('cuts story notes into opening, one section per click, and the rest', () => {
    const src = readFileSync(join(TX, 'pages', '08-senate-arc.md'), 'utf8')
    const sections = noteSections(src)
    expect(sections.map((s) => s.click)).toEqual(['about', 0, 1, 2, 3, 'if asked'])
    expect(sections[1].text).toMatch(/^Republicans will keep/)
    const lines = src.split('\n')
    expect(lines[sections[2].line - 1]).toMatch(/^\[click\] Confirming/)
  })
})

describe('slidePages and relatedFiles', () => {
  it('reads the manifest in order and follows a page to its stage and data', () => {
    const pages = slidePages(readFileSync(join(TX, 'slides.md'), 'utf8'))
    expect(pages[7]).toBe('pages/08-senate-arc.md')
    const related = relatedFiles(TX, pages[7])
    expect(related.get('components/SenateArcStage.vue')).toBe(1)
    expect(related.get('data/08-senate-arc.ts')).toBe(2)
    expect(related.get('data/02-power-board.ts')).toBe(3)
  })
})

describe('clickList', () => {
  it('collapses runs', () => {
    expect(clickList([0, 1, 2, 3])).toBe('0-3')
    expect(clickList([3, 1, 1])).toBe('1, 3')
  })
})

describe('ruleText', () => {
  it('reads the repo rules without frontmatter or user-only wording', () => {
    const { from, text } = ruleText(ROOT, 'deck-writing.md')
    expect(from).toBe('.claude/rules/deck-writing.md')
    expect(text).not.toMatch(/^---/)
    expect(text).not.toMatch(/decks:user|decks:repo-only/)
  })

  it('falls back to the package copy with its placeholders filled', () => {
    const { from, text } = ruleText(join(ROOT, 'packages'), 'deck-writing.md', { decksDir: 'talks' })
    expect(from).toBe('decks/agent/templates/rules/deck-writing.md')
    expect(text).not.toMatch(/\{\{\w+\}\}/)
  })
})

describe('reviewPrompt', () => {
  it('lists strings with slide, click and source, the notes, and both rules', () => {
    const prompt = reviewPrompt({
      rootDir: ROOT,
      alias: 'tx26',
      deck: { entry: 'examples/texas-2026/slides.md' },
      frames: [
        { slide: 8, click: 0, entries: [{ kind: 'head', text: 'With 31 present, confirmation takes 21 votes.' }] },
        { slide: 8, click: 1, entries: [{ kind: 'head', text: 'With 31 present, confirmation takes 21 votes.' }] },
      ],
    })
    expect(prompt).toMatch(
      /\| 0-1 \| head \| With 31 present, confirmation takes 21 votes\. \| examples\/texas-2026\/components\/SenateArcStage\.vue:\d+ \(partial\) \|/,
    )
    expect(prompt).toMatch(/\| 0 \| notes \| Republicans will keep their Senate majority/)
    expect(prompt).toContain('`deck-writing.md` wins where it and `prose-patterns.md` disagree.')
    expect(prompt).toContain('Skip paragraph-level review.')
    expect(prompt).toContain('### .claude/rules/prose-patterns.md')
  })
})

describe('headline wrap', () => {
  const line = (top: number, width = 100) => ({ top, height: 40, width })

  it('counts rects on one line once, however an inline element splits it', () => {
    expect(lineCount([line(100), line(102), line(100, 0)])).toBe(1)
    expect(lineCount([line(100), line(150), line(151)])).toBe(2)
    expect(lineCount([])).toBe(0)
  })

  it('warns only past the limit', () => {
    expect(wrapWarning(8, 1, { text: 'H.', lines: 1 }, 1)).toBeNull()
    expect(wrapWarning(8, 1, { text: 'H.', lines: 2 }, 1)).toBe(
      'warning: slide 8 click 1: headline wraps to 2 lines (limit 1): "H."',
    )
  })
})
