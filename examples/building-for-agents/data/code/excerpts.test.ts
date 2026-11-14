/**
 * Drift test for the code on the slides. For every excerpt module in this
 * directory, each shown line (elision lines aside) must appear, in order,
 * within the cited line range of the cited file. A line cut short with a
 * trailing ` …` must be the start of its source line. Skipped per excerpt when the
 * sibling repo is not checked out at ~/Projects/<repo>, so the suite still
 * passes on a machine that has only this repo.
 */
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { cutLine, isElision, type Excerpt } from './types'

const modules = import.meta.glob<Record<string, unknown>>('./*.ts', { eager: true })

function isExcerpt(value: unknown): value is Excerpt {
  return typeof value === 'object' && value !== null && 'code' in value && 'path' in value && 'repo' in value
}

const excerpts = Object.entries(modules)
  .filter(([file]) => !file.endsWith('.test.ts') && !file.endsWith('types.ts'))
  .flatMap(([file, mod]) =>
    Object.entries(mod)
      .filter(([, value]) => isExcerpt(value))
      .map(([name, value]) => ({ id: `${file}#${name}`, excerpt: value as Excerpt })),
  )

describe('code excerpts match their sources', () => {
  it('finds excerpt modules', () => {
    expect(Array.isArray(excerpts)).toBe(true)
  })

  for (const { id, excerpt } of excerpts) {
    const source = join(homedir(), 'Projects', excerpt.repo, excerpt.path)
    it.skipIf(!existsSync(source))(`${id} (${excerpt.repo}/${excerpt.path}:${excerpt.start}-${excerpt.end})`, () => {
      const lines = readFileSync(source, 'utf8').split('\n').slice(excerpt.start - 1, excerpt.end)
      let cursor = 0
      for (const shown of excerpt.code.split('\n')) {
        if (isElision(shown) || shown.trim() === '') continue
        const kept = cutLine(shown)
        const at = lines.findIndex(
          (line, i) => i >= cursor && (kept === null ? line.trim() === shown.trim() : line.trim().startsWith(kept)),
        )
        expect(at, `not found in order: ${shown.trim()}`).toBeGreaterThanOrEqual(0)
        cursor = at + 1
      }
    })
  }
})
