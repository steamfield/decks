/**
 * `decks lint` target handling: which decks a bare run picks up, and how
 * aliases, deck directories, files and flags are read.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { allDeckDirs, lintCommand } from './lint.mjs'
import { normalizeDir } from './project.mjs'

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
  process.exitCode = undefined
})

function project(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'decks-lint-'))
  dirs.push(root)
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}

const SLIDES = '---\nsrc: ./pages/01.md\n---\n'
const REPO_PKG = { 'packages/decks/package.json': '{ "name": "slidev-addon-decks" }\n' }

class Died extends Error {}
/** Run lintCommand, collecting what it prints; `died` is the die() message, if any. */
async function lint(root: string, args: string[], decks: Record<string, { entry: string }> | null = {}, decksDir = 'decks') {
  const out: string[] = []
  let died: string | undefined
  try {
    await lintCommand(args, {
      rootDir: root,
      decks,
      decksDir,
      noRegistry: 'NO REGISTRY',
      log: (s: string) => out.push(s),
      die: (msg: string) => {
        throw new Died(msg)
      },
    })
  } catch (err) {
    if (!(err instanceof Died)) throw err
    died = err.message
  }
  return { out: out.join('\n'), died, exitCode: process.exitCode }
}

describe('normalizeDir', () => {
  it.each([
    ['talks', 'talks'],
    ['./talks', 'talks'],
    ['././talks', 'talks'],
    ['./talks/', 'talks'],
    ['talks//', 'talks'],
    ['.', '.'],
    ['./', '.'],
    ['', '.'],
  ])('%j -> %j', (dir, expected) => expect(normalizeDir(dir)).toBe(expected))
})

describe('allDeckDirs', () => {
  it('finds registered decks and unregistered ones under decksDir, not dirs without slides.md', () => {
    const root = project({
      'talks/a/slides.md': SLIDES,
      'talks/b/slides.md': SLIDES,
      'talks/no-deck/pages/01.md': 'x\n',
      'elsewhere/c/slides.md': SLIDES,
    })
    const found = allDeckDirs({ rootDir: root, decks: { c: { entry: 'elsewhere/c/slides.md' } }, decksDir: '././talks/' })
    expect(found.sort()).toEqual([join(root, 'elsewhere/c'), join(root, 'talks/a'), join(root, 'talks/b')])
  })

  it('reads examples/ only in the Decks repo', () => {
    const files = { 'examples/demo/slides.md': SLIDES, 'decks/mine/slides.md': SLIDES }
    const user = project(files)
    expect(allDeckDirs({ rootDir: user, decks: null })).toEqual([join(user, 'decks/mine')])
    const repo = project({ ...files, ...REPO_PKG })
    expect(allDeckDirs({ rootDir: repo, decks: null }).sort()).toEqual([join(repo, 'decks/mine'), join(repo, 'examples/demo')])
  })
})

describe('lintCommand', () => {
  const clean = { 'decks/a/slides.md': SLIDES, 'decks/a/pages/01.md': 'Clean prose.\n' }

  it('lints an unregistered deck under decksDir with no target', async () => {
    const root = project({ ...clean, 'decks/b/slides.md': SLIDES, 'decks/b/pages/01.md': 'An em — dash.\n' })
    const r = await lint(root, [])
    expect(r.out).toMatch(/^decks\/b\/pages\/01\.md:1 \[em-dash\]/)
    expect(r.exitCode).toBe(1)
  })

  it('lints a deck directory, an alias and a file given as targets', async () => {
    const root = project({ ...clean, 'talks/t/slides.md': SLIDES, 'talks/t/pages/01.md': 'An em — dash.\n', 'notes.md': 'An em — dash.\n' })
    expect((await lint(root, ['talks/t'])).out).toMatch(/^talks\/t\/pages\/01\.md:1/)
    expect((await lint(root, ['t'], { t: { entry: 'talks/t/slides.md' } })).out).toMatch(/^talks\/t\/pages\/01\.md:1/)
    expect((await lint(root, ['notes.md'])).out).toMatch(/^notes\.md:1/)
    process.exitCode = undefined
    expect(await lint(root, ['decks/a'])).toMatchObject({ out: '', died: undefined, exitCode: undefined })
  })

  it('refuses a directory with no slides.md, and an unknown target', async () => {
    const root = project({ ...clean, 'src/pages/x.md': 'x\n' })
    expect((await lint(root, ['src'])).died).toMatch(/src is a directory with no slides\.md/)
    expect((await lint(root, ['nope'])).died).toMatch(/Unknown deck or file "nope"/)
  })

  it('refuses an unknown flag, and --stdin with targets', async () => {
    const root = project(clean)
    expect((await lint(root, ['--nope'])).died).toMatch(/^Unknown flag --nope\.\nUsage: decks lint/)
    expect((await lint(root, ['-x'])).died).toMatch(/^Unknown flag -x\./)
    expect((await lint(root, ['--stdin', 'decks/a'])).died).toMatch(/^--stdin takes no targets/)
  })

  it.each(['-h', '--help'])('%s prints the usage and lints nothing', async (flag) => {
    const root = project({ 'decks/b/slides.md': SLIDES, 'decks/b/pages/01.md': 'An em — dash.\n' })
    const r = await lint(root, [flag])
    expect(r).toMatchObject({ died: undefined, exitCode: undefined })
    expect(r.out).toMatch(/^Usage: decks lint/)
  })

  it('says there is no registry when there is nothing to lint and no decks.json', async () => {
    const root = project({})
    expect((await lint(root, [], null)).died).toBe('NO REGISTRY')
  })
})
