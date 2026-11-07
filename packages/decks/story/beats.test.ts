/**
 * Guard: the beat count, the card copy and the manifest agree.
 *
 * A stage's beats are three numbers kept in three places: the copy array's
 * length in the component, the `:beats` count handed to StoryStage, and the
 * `clicks` a page declares in the deck manifest. `useStage` ties the first
 * two together; this scan ties both to the third, for every story deck, and
 * holds the card copy to its budget (eight words of lead, twenty of body,
 * `.claude/rules/story-stage.md`).
 *
 * It also runs the error rows of the AI-rhetoric patterns over every lead and
 * body, through the same scanner `decks lint` and the write hook use
 * (`../lint/scan.mjs`), so a card that would fail the lint fails here too. A
 * line carrying `lint-allow` (all patterns) or `lint-allow: id, id` is exempt.
 *
 * A card that says nothing at a beat is `{ lead: '' }` (see `BeatCopy`): it
 * counts as a beat and as zero words.
 *
 * A stage page's presenter notes (found by `presenterNotes` in scan.mjs) must
 * end the page, since Slidev reads no other comment as notes, and carry one
 * plain `[click]` per click in the stanza: the opening paragraph covers beat
 * 0. Notes written into the `SLIDE N` header fail as not trailing. Free-form
 * trailing notes (no `SAY (opening)`, no markers) fail too, since a stage
 * page's notes need both. A page with no notes passes.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  FIELD,
  copyLiteral as copyLiteralAt,
  copyStrings,
  loadPatterns,
  presenterNotes,
} from '../lint/scan.mjs'
import { storyDecks } from './test-decks'

const LEAD_WORDS = 8
const BODY_WORDS = 20

interface Stage {
  deck: string
  name: string
  file: string
  sourceLabel: string
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
  return copyLiteralAt(src)?.text ?? null
}

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

/** The error-severity rows of the shared pattern file. */
function errorPatterns() {
  return loadPatterns().filter((p) => p.severity === 'error')
}

/** Words in a copy string; a `${…}` expression counts as one word. */
function words(text: string): number {
  return text
    .replace(/\$\{[^}]*\}/g, 'x')
    .split(/\s+/)
    .filter(Boolean).length
}

/** Follow only a transparent local SFC wrapper: one import, one matching tag. */
function stageSource(file: string, seen = new Set<string>()): string {
  const full = resolve(file)
  if (seen.has(full)) throw new Error(`${file}: circular stage wrapper`)
  seen.add(full)
  const src = readFileSync(full, 'utf8')
  const wrapper =
    /^\s*<script setup(?: lang="ts")?>\s*import (\w+) from ['"](\.[^'"]+\.vue)['"]\s*;?\s*<\/script>\s*<template>\s*<(\w+)\s*\/>\s*<\/template>\s*$/.exec(
      src,
    )
  if (!wrapper || wrapper[1] !== wrapper[3]) return full
  return stageSource(resolve(dirname(full), wrapper[2]), seen)
}

function stages(deck: { alias: string; dir: string }): Stage[] {
  const dir = join(deck.dir, 'components')
  return readdirSync(dir)
    .filter((name) => name.endsWith('Stage.vue'))
    .sort()
    .map((name) => {
      const file = stageSource(join(dir, name))
      const src = readFileSync(file, 'utf8')
      const sourceDeck = DECKS.find((candidate) => file.startsWith(resolve(candidate.dir) + '/'))
      const sourceLabel = `${sourceDeck?.alias ?? deck.alias}/${basename(file)}`
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
        sourceLabel,
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

/** What is wrong with a page's presenter notes against its `clicks`; empty when nothing is. */
function notesProblems(src: string, clicks: number): string[] {
  const notes = presenterNotes(src)
  if (!notes) return []
  const out: string[] = []
  const at = `notes at line ${notes.line}`
  if (!notes.structured)
    return [`${at}: no SAY (opening) or [click] markers; a stage page's notes need SAY (opening) and one [click] per click`]
  if (notes.numbered.length)
    out.push(`${at}: ${notes.numbered.join(', ')}: use plain [click] markers, one per beat after the opening`)
  if (!notes.trailing)
    out.push(`${at}: not the last thing on the page; Slidev reads notes only from a comment that ends the page`)
  if (notes.clicks !== clicks)
    out.push(`${at}: ${notes.clicks} [click] markers for clicks: ${clicks}; need one per click after SAY (opening)`)
  return out
}

const DECKS = storyDecks()
const TEMPLATE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../templates/story')

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

  it('checks transparent excerpts against source copy and their own manifest', () => {
    const excerpt = DECKS.find((deck) => deck.alias === 'opendata-showcase')
    expect(excerpt).toBeDefined()
    const reused = stages(excerpt!)
    expect(reused).toHaveLength(2)
    for (const stage of reused) {
      expect(stage.file).toContain('/opendata-pitch/components/')
      expect(stage.copy?.length).toBeGreaterThan(1)
      expect(stage.sourceLabel).toBe(`pitch/${stage.name}.vue`)
    }
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

      it(`${label}: presenter notes trail the page and match clicks`, () => {
        const page = pageFor(deck, stage.name)
        const stanza = page ? stanzas(deck).get(page) : undefined
        if (!page || !stanza) return
        const src = readFileSync(join(deck.dir, 'pages', page), 'utf8')
        expect(notesProblems(src, stanza.clicks), page).toEqual([])
      })
    }
  }

  it('finds presenter notes by content and checks them against clicks', () => {
    const page = (...parts: string[]) => parts.join('\n\n') + '\n'
    const header = '<!--\nSLIDE 3 · X\n-->'
    const notes = '<!--\nSAY (opening)\nBeat 0.\n\n[click] Beat 1.\n\n[click] Beat 2.\n-->'
    expect(presenterNotes(page(header, '<XStage />'))).toBeNull()
    expect(notesProblems(page(header, '<XStage />'), 2)).toEqual([])
    expect(presenterNotes(page(header, '<XStage />', notes))).toMatchObject({
      line: 7,
      trailing: true,
      clicks: 2,
      numbered: [],
    })
    expect(notesProblems(page(header, '<XStage />', notes), 2)).toEqual([])
    expect(notesProblems(page(header, notes, '<XStage />'), 2)).toEqual([
      'notes at line 5: not the last thing on the page; Slidev reads notes only from a comment that ends the page',
    ])
    expect(notesProblems(page(header, '<XStage />', notes), 3)).toEqual([
      'notes at line 7: 2 [click] markers for clicks: 3; need one per click after SAY (opening)',
    ])
    expect(notesProblems(page(header, '<XStage />', notes.replace('[click] Beat 2', '[click:2] Beat 2')), 2)).toEqual([
      'notes at line 7: [click:2]: use plain [click] markers, one per beat after the opening',
      'notes at line 7: 1 [click] markers for clicks: 2; need one per click after SAY (opening)',
    ])
    const inHeader = '<!--\nSLIDE 3 · X\n\nSAY (opening)\nBeat 0.\n\n[click] Beat 1.\n-->'
    expect(notesProblems(page(inHeader, '<XStage />'), 1)).toEqual([
      'notes at line 1: not the last thing on the page; Slidev reads notes only from a comment that ends the page',
    ])
    expect(notesProblems(page(header, '<XStage />', '<!--\nIF ASKED\nA question.\n-->'), 0)).toEqual([
      "notes at line 7: no SAY (opening) or [click] markers; a stage page's notes need SAY (opening) and one [click] per click",
    ])
  })

  it('scaffolds a story stage page whose notes match its clicks', () => {
    const page = '02-first.md'
    const stanza = stanzas({ dir: TEMPLATE_DIR }).get(page)
    expect(stanza, `${page} in the template slides.md`).toBeDefined()
    const src = readFileSync(join(TEMPLATE_DIR, 'pages', page), 'utf8')
    expect(presenterNotes(src), 'template notes').not.toBeNull()
    expect(notesProblems(src, stanza!.clicks)).toEqual([])
  })

  it('reads the pattern file and catches a planted tell', () => {
    const patterns = errorPatterns()
    expect(patterns.map((p) => p.id)).toContain('em-dash')
    const src = [
      'const COPY = [',
      "  { lead: 'Rows arrive — clean.', body: 'A plain body.' },",
      "  { lead: 'Quoted — verbatim.' }, // lint-allow: em-dash",
      ']',
    ].join('\n')
    const hits = copyStrings(src).filter(
      ({ text, allow }) =>
        allow !== '*' && patterns.some((p) => !allow.includes(p.id) && p.re.test(text)),
    )
    expect(hits.map((h) => h.text)).toEqual(['Rows arrive — clean.'])
  })

  it('keeps every card clear of the error-severity AI-rhetoric patterns', () => {
    const patterns = errorPatterns()
    const hits: string[] = []
    for (const deck of DECKS) {
      for (const stage of stages(deck)) {
        for (const { text, allow } of copyStrings(readFileSync(stage.file, 'utf8'))) {
          if (allow === '*') continue
          for (const p of patterns) {
            if (!allow.includes(p.id) && p.re.test(text))
              hits.push(`${deck.alias}/${stage.name}.vue [${p.id}] ${text}`)
          }
        }
      }
    }
    expect(hits).toEqual([])
  })

  it('holds every card to eight words of lead and twenty of body', () => {
    const over: string[] = []
    for (const deck of DECKS) {
      for (const stage of stages(deck)) {
        stage.copy?.forEach((card, i) => {
          const lead = words(card.lead)
          const body = words(card.body)
          const at = `${stage.sourceLabel} beat ${i}`
          if (lead > LEAD_WORDS) over.push(`${at} lead: ${lead} words`)
          if (body > BODY_WORDS) over.push(`${at} body: ${body} words`)
        })
      }
    }
    expect([...new Set(over)]).toEqual(OVER_BUDGET_TODAY)
  })
})
