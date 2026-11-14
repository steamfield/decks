/**
 * Slide 11's data against its sources. The fixture must still be rr's
 * monitor.jsonl, and the ported timeline and sparkline must still agree with
 * rr's own. Checks that read ~/Projects/rr or ~/Projects/statglass are skipped
 * when that repo is not checked out.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import snapshots from './fixtures/11-monitor.json'
import {
  BUSIEST,
  GRAPH_COLS,
  GRAPH_ROWS,
  HISTORY_MINUTES,
  HISTORY_SAMPLES,
  RECORDED,
  RETENTION,
  RETENTION_DAYS,
  TIMELINE,
  cardsAt,
  history,
  sparkline,
} from './11-monitor-to-glass'

const RR = join(homedir(), 'Projects', 'rr')
const STATGLASS = join(homedir(), 'Projects', 'statglass')

describe('slide 11: the recording', () => {
  it('rests on a frame where every host holds a lock', () => {
    const cards = cardsAt(BUSIEST)
    expect(cards.map((card) => card.name)).toEqual(['m1-mini', 'm4-mini', 'mbp'])
    expect(cards.every((card) => card.frame.status === 'running' && card.frame.command !== '')).toBe(true)
    expect(RECORDED).toBe('2026-11-02')
  })

  it.skipIf(!existsSync(join(RR, 'site/fixtures/monitor.jsonl')))('is still rr/site/fixtures/monitor.jsonl', () => {
    const lines = readFileSync(join(RR, 'site/fixtures/monitor.jsonl'), 'utf8')
      .split('\n')
      .filter((line) => line.trim().startsWith('{'))
    expect(snapshots).toEqual(lines.map((line) => JSON.parse(line)))
  })
})

describe.skipIf(!existsSync(join(RR, 'site/src/lib/monitor/timeline.ts')))('slide 11: the port agrees with rr/site/src/lib/monitor', () => {
  it('builds the same timeline and picks the same frame', async () => {
    const path = join(RR, 'site/src/lib/monitor/timeline.ts')
    const source = await import(/* @vite-ignore */ path)
    const theirs = source.buildTimeline(snapshots)
    expect(TIMELINE).toEqual(theirs)
    expect(BUSIEST).toBe(source.busiestFrame(theirs))
    expect(history(TIMELINE, 'mbp', 'cpu', BUSIEST)).toEqual(source.history(theirs, 'mbp', 'cpu', BUSIEST))
  })

  it('lights the same sparkline dots', async () => {
    const render = await import(/* @vite-ignore */ join(RR, 'site/src/lib/monitor/render.ts'))
    const dots = await import(/* @vite-ignore */ join(RR, 'site/src/components/landing/monitor/Dots.tsx'))
    for (const host of TIMELINE.hosts) {
      const cpu = history(TIMELINE, host, 'cpu', BUSIEST)
      const theirs = render.sparkline(cpu, GRAPH_COLS, GRAPH_ROWS)
      const mine = sparkline(cpu, GRAPH_COLS, GRAPH_ROWS)
      expect(mine.heights).toEqual(dots.subColumnHeights(theirs.rows))
      expect(mine.columnMax).toEqual(theirs.columnMax)
    }
  })
})

describe('slide 11: the figures', () => {
  it.skipIf(!existsSync(join(RR, 'internal/monitor/history.go')))('rr monitor keeps 600 samples', () => {
    const source = readFileSync(join(RR, 'internal/monitor/history.go'), 'utf8')
    expect(source).toContain(`const DefaultHistorySize = ${HISTORY_SAMPLES}`)
    expect(HISTORY_MINUTES).toBe(10)
  })

  it.skipIf(!existsSync(join(STATGLASS, 'README.md')))('StatGlass keeps the tiers its README lists', () => {
    const readme = readFileSync(join(STATGLASS, 'README.md'), 'utf8').replace(/\s+/g, ' ')
    expect(readme).toContain(
      '10-second buckets for 24 hours, one-minute buckets through 7 days and 15-minute buckets through 30 days',
    )
    expect(RETENTION.map((tier) => tier.through)).toEqual(['24 h', '7 d', '30 d'])
    expect(RETENTION_DAYS).toBe(30)
  })
})
