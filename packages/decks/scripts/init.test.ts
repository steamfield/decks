/**
 * `decks init` against scratch projects: what it writes, what a re-run
 * changes, and what it must never touch.
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { lineDiff, runInit } from './init.mjs'

const TARGETS = [
  '.claude/agents/deck-author.md',
  '.claude/skills/building-a-deck/SKILL.md',
  '.claude/skills/fact-checking-a-deck/SKILL.md',
  '.claude/rules/deck-patterns.md',
  '.claude/rules/deck-writing.md',
  '.claude/rules/deck-data.md',
  '.claude/rules/story-stage.md',
  '.claude/rules/prose-patterns.md',
  '.claude/rules/project-glossary.md',
]

const dirs: string[] = []
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

/** A scratch project with the package "installed" (a stub package.json is all init looks for). */
function project(files: Record<string, string> = {}) {
  const root = mkdtempSync(join(tmpdir(), 'decks-init-'))
  dirs.push(root)
  const all = {
    'package.json': '{ "name": "scratch" }\n',
    'node_modules/slidev-addon-decks/package.json': '{ "name": "slidev-addon-decks" }\n',
    ...files,
  }
  for (const [path, text] of Object.entries(all)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), text)
  }
  return root
}

const read = (root: string, path: string) => readFileSync(join(root, path), 'utf8')
const init = (root: string, argv: string[] = []) => {
  const out: string[] = []
  const result = runInit(argv, { rootDir: root, log: (s: string) => out.push(s) })
  return { ...result, output: out.join('\n') }
}
const settings = (root: string) => JSON.parse(read(root, '.claude/settings.json'))

describe('decks init, fresh project', () => {
  it('writes the agent, both skills and all six rules with no template variable left', () => {
    const root = project()
    const r = init(root)
    expect(r.code).toBe(0)
    for (const t of TARGETS) {
      expect(r.files[t]).toBe('written')
      expect(read(root, t)).not.toMatch(/\{\{\w+\}\}/)
    }
  })

  it("fills the project's decksDir, the package CLI and the exemplar path", () => {
    const root = project({ 'decks.json': '{ "_config": { "decksDir": "talks/" } }\n', 'bun.lock': '' })
    init(root)
    const skill = read(root, '.claude/skills/building-a-deck/SKILL.md')
    expect(skill).toContain('bunx -p slidev-addon-decks decks new <alias>')
    expect(skill).toContain('`talks/<dir-name>/`')
    expect(skill).toContain('node_modules/slidev-addon-decks/agent/exemplars/agent-experience')
    expect(read(root, '.claude/rules/deck-writing.md')).toContain('"talks/*/pages/*.md"')
  })

  it('uses npx without a bun lockfile, and defaults decksDir to decks', () => {
    const root = project()
    init(root)
    const agent = read(root, '.claude/agents/deck-author.md')
    expect(agent).toContain('npx -p slidev-addon-decks decks new')
    expect(agent).toContain('`decks/<dir-name>/`')
  })

  it('records every written file with its hash in .claude/decks.json', () => {
    const root = project()
    init(root)
    const manifest = JSON.parse(read(root, '.claude/decks.json'))
    expect(Object.keys(manifest.files).sort()).toEqual([...TARGETS].sort())
    for (const hash of Object.values(manifest.files)) expect(hash).toMatch(/^sha256:[0-9a-f]{64}$/)
  })

  it('adds both hooks, pointing at the installed package', () => {
    const root = project()
    const r = init(root)
    const s = settings(root)
    expect(s.hooks.PreToolUse).toEqual([
      {
        matcher: 'Edit|Write|MultiEdit',
        hooks: [
          { type: 'command', command: 'node "$CLAUDE_PROJECT_DIR/node_modules/slidev-addon-decks/scripts/deck.mjs" hook lint || exit 2' },
        ],
      },
    ])
    expect(s.hooks.UserPromptSubmit[0].hooks[0].command).toMatch(/deck\.mjs" hook prompt$/)
    expect(r.output).toContain('+ ')
  })

  it('warns, and still writes, when the package is not installed', () => {
    const root = project()
    rmSync(join(root, 'node_modules'), { recursive: true })
    const r = init(root)
    expect(r.code).toBe(0)
    expect(r.warnings.join('\n')).toMatch(/not installed/)
  })
})

describe('decks init, re-run', () => {
  it('is idempotent: nothing changes and no hook is duplicated', () => {
    const root = project()
    init(root)
    const snapshot = Object.fromEntries(
      [...TARGETS, '.claude/settings.json', '.claude/decks.json', 'AGENTS.md', 'CLAUDE.md'].map((t) => [t, read(root, t)]),
    )
    const r = init(root)
    for (const t of TARGETS) expect(r.files[t]).toBe('unchanged')
    for (const [t, text] of Object.entries(snapshot)) expect(read(root, t)).toBe(text)
    expect(r.settings.diff).toBe('')
    expect(settings(root).hooks.PreToolUse).toHaveLength(1)
  })

  it('updates an owned file the user has not edited', () => {
    const root = project()
    init(root)
    // Simulate a new template: the file on disk is what an older init wrote.
    const t = '.claude/rules/deck-data.md'
    const old = 'older template\n'
    writeFileSync(join(root, t), old)
    const manifest = JSON.parse(read(root, '.claude/decks.json'))
    manifest.files[t] = `sha256:${createHash('sha256').update(old).digest('hex')}`
    writeFileSync(join(root, '.claude/decks.json'), JSON.stringify(manifest))
    expect(init(root).files[t]).toBe('updated')
    expect(read(root, t)).toMatch(/^---\npaths:/)
  })

  it('skips an owned file the user edited, keeps skipping it, and --force overwrites it', () => {
    const root = project()
    init(root)
    const t = '.claude/rules/deck-writing.md'
    writeFileSync(join(root, t), read(root, t) + '\nMy own rule.\n')
    const r = init(root)
    expect(r.files[t]).toBe('skipped')
    expect(r.output).toMatch(/skipped[\s\S]*deck-writing\.md/)
    expect(read(root, t)).toContain('My own rule.')
    expect(init(root).files[t]).toBe('skipped')

    expect(init(root, ['--force']).files[t]).toBe('overwritten')
    expect(read(root, t)).not.toContain('My own rule.')
    expect(init(root).files[t]).toBe('unchanged')
  })

  it('never touches a file it did not write, even with --force', () => {
    const root = project({ '.claude/rules/deck-patterns.md': 'mine\n' })
    const r = init(root)
    expect(r.files['.claude/rules/deck-patterns.md']).toBe('collision')
    expect(r.output).toMatch(/collision[\s\S]*deck-patterns\.md[\s\S]*Rename or move it/)
    expect(init(root, ['--force']).files['.claude/rules/deck-patterns.md']).toBe('collision')
    expect(read(root, '.claude/rules/deck-patterns.md')).toBe('mine\n')
    expect(JSON.parse(read(root, '.claude/decks.json')).files).not.toHaveProperty(['.claude/rules/deck-patterns.md'])
  })
})

describe('decks init, settings merge', () => {
  const existing = {
    permissions: { allow: ['Bash(ls:*)'] },
    hooks: {
      PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: './guard.sh' }] }],
      Stop: [{ hooks: [{ type: 'command', command: './done.sh' }] }],
    },
  }

  it('adds its hooks beside existing ones and removes nothing', () => {
    const root = project({ '.claude/settings.json': JSON.stringify(existing, null, 2) + '\n' })
    const r = init(root)
    const s = settings(root)
    expect(s.permissions).toEqual(existing.permissions)
    expect(s.hooks.Stop).toEqual(existing.hooks.Stop)
    expect(s.hooks.PreToolUse[0]).toEqual(existing.hooks.PreToolUse[0])
    expect(s.hooks.PreToolUse[1].matcher).toBe('Edit|Write|MultiEdit')
    expect(r.settings.diff).not.toMatch(/^- /m)
    expect(r.settings.diff).toMatch(/^\+ .*hook lint/m)

    init(root)
    expect(settings(root).hooks.PreToolUse).toHaveLength(2)
    expect(settings(root).hooks.UserPromptSubmit).toHaveLength(1)
  })

  it('rewrites its own hook in place when the command form changed', () => {
    const old = { hooks: { PreToolUse: [{ matcher: 'Edit|Write|MultiEdit', hooks: [{ type: 'command', command: 'npx -p slidev-addon-decks decks hook lint' }] }] } }
    const root = project({ '.claude/settings.json': JSON.stringify(old) })
    init(root)
    const pre = settings(root).hooks.PreToolUse
    expect(pre).toHaveLength(1)
    expect(pre[0].hooks[0].command).toMatch(/^node .*deck\.mjs" hook lint \|\| exit 2$/)
  })

  it('leaves settings.json alone and exits 1 when it does not parse', () => {
    const root = project({ '.claude/settings.json': '{ not json' })
    const r = init(root)
    expect(r.code).toBe(1)
    expect(read(root, '.claude/settings.json')).toBe('{ not json')
  })
})

describe('decks init, instructions file', () => {
  it('creates AGENTS.md with the block and a CLAUDE.md that imports it', () => {
    const root = project()
    init(root)
    expect(read(root, 'AGENTS.md')).toMatch(/^<!-- decks:start -->\n[\s\S]*<!-- decks:end -->\n$/)
    expect(read(root, 'CLAUDE.md')).toBe('@AGENTS.md\n')
  })

  it('appends to an existing AGENTS.md and replaces the block in place on a re-run', () => {
    const root = project({ 'AGENTS.md': '# Mine\n\nKeep this.\n', 'CLAUDE.md': '@AGENTS.md\n' })
    init(root)
    const text = read(root, 'AGENTS.md')
    expect(text.startsWith('# Mine\n\nKeep this.\n\n<!-- decks:start -->')).toBe(true)

    writeFileSync(join(root, 'AGENTS.md'), text.replace('Slide decks live in', 'STALE') + '\nAfter the block.\n')
    expect(init(root).instructions).toEqual(['AGENTS.md: decks block updated in place'])
    const again = read(root, 'AGENTS.md')
    expect(again).not.toContain('STALE')
    expect(again.match(/decks:start/g)).toHaveLength(1)
    expect(again.endsWith('<!-- decks:end -->\n\nAfter the block.\n')).toBe(true)
    expect(read(root, 'CLAUDE.md')).toBe('@AGENTS.md\n')
  })

  it('uses CLAUDE.md when only CLAUDE.md exists, and creates no AGENTS.md', () => {
    const root = project({ 'CLAUDE.md': '# Project\n' })
    init(root)
    expect(read(root, 'CLAUDE.md')).toMatch(/^# Project\n\n<!-- decks:start -->[\s\S]*<!-- decks:end -->\n$/)
    expect(existsSync(join(root, 'AGENTS.md'))).toBe(false)
    init(root)
    expect(read(root, 'CLAUDE.md').match(/decks:start/g)).toHaveLength(1)
  })

  it('warns when AGENTS.md gets the block but CLAUDE.md does not import it', () => {
    const root = project({ 'AGENTS.md': '# Agents\n', 'CLAUDE.md': '# Claude\n' })
    const r = init(root)
    expect(r.warnings.join('\n')).toMatch(/does not import AGENTS\.md/)
    expect(read(root, 'CLAUDE.md')).toBe('# Claude\n')
  })
})

describe('lineDiff', () => {
  it('marks added and removed lines', () => {
    expect(lineDiff('a\nb\nc\n', 'a\nc\nd\n')).toBe('  a\n- b\n  c\n+ d')
  })
})
