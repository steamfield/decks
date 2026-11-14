/**
 * Slide 10's data against its sources. The quoted result lines must be bytes
 * of the fixture, the fixture must still be line 4 of rr's run.jsonl, and the
 * ported simulation must still agree with rr's own. The two checks that read
 * ~/Projects/rr are skipped when that repo is not checked out.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  FAILURE_AT,
  FLOW_HOSTS,
  FLOW_RUNS,
  RESULT_HOT,
  RESULT_LINES,
  RUN,
  SEGMENTS,
  STEPS,
  STILLS,
  flowSteps,
  sceneAt,
  simulate,
} from './10-rr-locks'

const fixture = readFileSync(fileURLToPath(new URL('./fixtures/10-rr-result.json', import.meta.url)), 'utf8')
const RR = join(homedir(), 'Projects', 'rr')
const scene = (beat: number) => sceneAt(SEGMENTS, FLOW_RUNS, FLOW_HOSTS.length, STILLS[beat] ?? 0)

describe('slide 10: the recorded result', () => {
  it('quotes the fixture byte for byte', () => {
    for (const line of RESULT_LINES) {
      const quoted = line.text.replace(/^… /, '').replace(/ …$/, '')
      expect(fixture, quoted).toContain(quoted)
    }
  })

  it('highlights the failure that carries a line number', () => {
    expect(FAILURE_AT).toBe('src/data/articles/charts-json.test.ts:74')
    expect(RESULT_LINES[RESULT_HOT]?.text).toContain(FAILURE_AT)
  })

  it('reads the run totals from the event', () => {
    expect(RUN).toMatchObject({ recorded: '2026-11-02', shards: 8, passed: 5, failed: 3 })
  })

  it.skipIf(!existsSync(join(RR, 'site/fixtures/run.jsonl')))('is still line 4 of rr/site/fixtures/run.jsonl', () => {
    const lines = readFileSync(join(RR, 'site/fixtures/run.jsonl'), 'utf8').split('\n')
    expect(fixture.trim()).toBe(lines[3])
  })
})

describe('slide 10: each beat rests on the frame its card describes', () => {
  it('beat 0: every host free, no rr process yet', () => {
    expect(scene(0).hosts.every((host) => host.phase === 'free')).toBe(true)
    expect(scene(0).chips.some((chip) => chip.visible)).toBe(false)
  })

  it('beat 1: agent 1 holds every host and nobody else has arrived', () => {
    expect(scene(1).hosts.map((host) => host.holder)).toEqual([0, 0, 0])
    expect(scene(1).chips.filter((chip) => chip.visible)).toHaveLength(1)
  })

  it('beat 2: agents 2 and 3 wait while agent 1 still holds every host', () => {
    expect(scene(2).hosts.map((host) => host.holder)).toEqual([0, 0, 0])
    expect(scene(2).chips.map((chip) => chip.visible && chip.state === 'waiting' && chip.slot === 1)).toEqual([
      false,
      true,
      true,
      false,
    ])
  })

  it('beat 3: agents 2, 3 and 4 hold one host each and agent 1 has its result', () => {
    expect(scene(3).hosts.map((host) => host.holder)).toEqual([1, 2, 3])
    expect(scene(3).results[0]?.ok).toBe(true)
    expect(scene(3).chips.some((chip) => chip.state === 'waiting')).toBe(false)
  })
})

describe.skipIf(!existsSync(join(RR, 'site/src/lib/flow.ts')))('slide 10: the port agrees with rr/site/src/lib/flow.ts', () => {
  it('produces the same segments, scenes and steps', async () => {
    const path = join(RR, 'site/src/lib/flow.ts')
    const source = (await import(/* @vite-ignore */ path)) as typeof import('./10-rr-locks')
    const theirs = source.simulate(source.FLOW_RUNS, source.FLOW_HOSTS.length)
    expect(simulate(FLOW_RUNS, FLOW_HOSTS.length)).toEqual(theirs)
    expect(STEPS).toEqual(source.flowSteps(theirs, source.FLOW_RUNS, source.FLOW_HOSTS))
    expect(flowSteps(SEGMENTS, FLOW_RUNS, FLOW_HOSTS)).toEqual(STEPS)
    const end = Math.max(...theirs.map((segment) => segment.end))
    for (let t = 0; t <= end; t += 250) {
      expect(sceneAt(SEGMENTS, FLOW_RUNS, FLOW_HOSTS.length, t)).toEqual(
        source.sceneAt(theirs, source.FLOW_RUNS, source.FLOW_HOSTS.length, t),
      )
    }
  })
})
