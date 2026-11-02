/**
 * Guard: the beat count, the card copy and the manifest agree.
 *
 * A stage's beats are three numbers kept in three places: the copy array's
 * length in the component, the `:beats` count handed to StoryStage, and the
 * `clicks` a page declares in the deck manifest. `useStage` ties the first
 * two together; this scan ties both to the third, for every story deck, and
 * holds the card copy to its budget (eight words of lead, twenty of body,
 * `talks-patterns.md`).
 *
 * A card that says nothing at a beat is `{ lead: '' }` (see `BeatCopy`): it
 * counts as a beat and as zero words.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { storyDecks } from './test-decks'

const LEAD_WORDS = 8
const BODY_WORDS = 20

interface Stage {
  deck: string
  name: string
  file: string
  /** `:beats` as written: a number, or `beats` when it comes from useStage. */
  beats: number | 'beats'
  /** Copy entries, in beat order; null for a stage with no COPY array. */
  copy: { lead: string; body: string }[] | null
}

interface Stanza {
  page: string
  clicks: number
}

/** The `[ ... ]` after `const COPY =`, by bracket depth, or null. */
function copyLiteral(src: string): string | null {
  const start = src.search(/^const COPY(?::[^=]+)? = \[/m)
  if (start < 0) return null
  const open = src.indexOf('[', start)
  let depth = 0
  for (let i = open; i < src.length; i++) {
    if (src[i] === '[') depth++
    else if (src[i] === ']' && --depth === 0) return src.slice(open, i + 1)
  }
  return null
}

const FIELD = /\b(lead|body):\s*('(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|"(?:[^"\\]|\\.)*")/g

function parseCopy(literal: string): { lead: string; body: string }[] {
  const out: { lead: string; body: string }[] = []
  let current: { lead: string; body: string } | null = null
  for (const m of literal.matchAll(FIELD)) {
    const [, key, raw] = m
    const value = raw.slice(1, -1)
    if (key === 'lead') {
      current = { lead: value, body: '' }
      out.push(current)
    } else if (current) {
      current.body = value
    }
  }
  return out
}

/** Words in a copy string; a `${…}` expression counts as one word. */
function words(text: string): number {
  return text
    .replace(/\$\{[^}]*\}/g, 'x')
    .split(/\s+/)
    .filter(Boolean).length
}

function stages(deck: { alias: string; dir: string }): Stage[] {
  const dir = join(deck.dir, 'components')
  return readdirSync(dir)
    .filter((name) => name.endsWith('Stage.vue'))
    .sort()
    .map((name) => {
      const file = join(dir, name)
      const src = readFileSync(file, 'utf8')
      // A cover (`StoryCover`) is one beat by construction.
      const raw = /<StoryCover\b/.test(src)
        ? '1'
        : /<StoryStage\b[^>]*:beats="([^"]+)"/.exec(src)?.[1]
      if (raw !== 'beats' && !/^\d+$/.test(raw ?? '')) {
        throw new Error(`${file}: no :beats="N" or :beats="beats" on <StoryStage>`)
      }
      const literal = copyLiteral(src)
      return {
        deck: deck.alias,
        name: name.replace(/\.vue$/, ''),
        file,
        beats: raw === 'beats' ? 'beats' : Number(raw),
        copy: literal ? parseCopy(literal) : null,
      }
    })
}

/** Every manifest stanza with a `src:`, keyed by page basename. */
function stanzas(deck: { dir: string }): Map<string, Stanza> {
  const out = new Map<string, Stanza>()
  for (const block of readFileSync(join(deck.dir, 'slides.md'), 'utf8').split(/^---$/m)) {
    const src = /^src:\s*(\S+)/m.exec(block)?.[1]
    if (!src) continue
    const page = basename(src)
    out.set(page, { page, clicks: Number(/^clicks:\s*(\d+)/m.exec(block)?.[1] ?? 0) })
  }
  return out
}

/** The page that mounts a stage component, or null for one no page mounts. */
function pageFor(deck: { dir: string }, stage: string): string | null {
  const dir = join(deck.dir, 'pages')
  const tag = new RegExp(`<${stage}\\b`)
  const hits = readdirSync(dir).filter((page) => tag.test(readFileSync(join(dir, page), 'utf8')))
  if (hits.length > 1) throw new Error(`${stage} is mounted by ${hits.join(', ')}`)
  return hits[0] ?? null
}

const DECKS = storyDecks()

/**
 * Copy over budget today, pinned so the guard still fails on a new offender
 * and on a stale entry. Trimming a line is a copy decision, not a refactor:
 * remove the entry here when the words come out.
 */
const OVER_BUDGET_TODAY = [
  'pitch/PipelineStage.vue beat 2 body: 21 words',
  'pitch/ScaleGraphStage.vue beat 1 lead: 9 words',
]

describe('beats', () => {
  it('scans every story deck', () => {
    expect(DECKS.map((deck) => deck.alias)).toContain('pitch')
    expect(DECKS.length).toBeGreaterThanOrEqual(2)
    for (const deck of DECKS) expect(stages(deck).length, deck.dir).toBeGreaterThan(0)
  })

  it('reads a copy array the way a stage writes one', () => {
    const src = [
      'const COPY = [',
      "  { lead: '', body: '' },",
      "  { lead: `${N} datasets. Four of them.`, body: 'A body, with a comma.' },",
      '  {',
      "    lead: 'Third.',",
      "    body: `It's ${a ? 'x' : 'y'} here.`,",
      '  },',
      ']',
    ].join('\n')
    const copy = parseCopy(copyLiteral(src) ?? '')
    expect(copy).toHaveLength(3)
    expect(copy[0]).toEqual({ lead: '', body: '' })
    expect(words(copy[1].lead)).toBe(5)
    expect(words(copy[2].body)).toBe(3)
  })

  for (const deck of DECKS) {
    for (const stage of stages(deck)) {
      const label = `${deck.alias}/${stage.name}`

      it(`${label}: beats, copy and clicks agree`, () => {
        const beats = stage.copy ? stage.copy.length : 1
        if (stage.beats !== 'beats') expect(stage.beats, ':beats').toBe(beats)
        const page = pageFor(deck, stage.name)
        expect(page, 'mounted by a page').not.toBeNull()
        const stanza = stanzas(deck).get(page as string)
        expect(stanza, `${page} in slides.md`).toBeDefined()
        expect(stanza?.clicks, 'clicks').toBe(beats - 1)
      })
    }
  }

  it('holds every card to eight words of lead and twenty of body', () => {
    const over: string[] = []
    for (const deck of DECKS) {
      for (const stage of stages(deck)) {
        stage.copy?.forEach((card, i) => {
          const lead = words(card.lead)
          const body = words(card.body)
          const at = `${deck.alias}/${stage.name}.vue beat ${i}`
          if (lead > LEAD_WORDS) over.push(`${at} lead: ${lead} words`)
          if (body > BODY_WORDS) over.push(`${at} body: ${body} words`)
        })
      }
    }
    expect(over).toEqual(OVER_BUDGET_TODAY)
  })
})
