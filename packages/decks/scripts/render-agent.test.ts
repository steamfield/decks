/**
 * The agent setup `decks init` ships is a render of the repo's .claude/
 * sources. A source edit without a re-render fails here; the fix is
 * `node packages/decks/scripts/render-agent.mjs`, not an edit to the copy.
 */
import { describe, expect, it } from 'vitest'
import { renderAgent, renderSource, staleFiles } from './render-agent.mjs'

describe('render-agent', () => {
  it('shipped templates and exemplars equal a fresh render', () => {
    expect(staleFiles(renderAgent())).toEqual([])
  })

  it('drops repo-only blocks and unwraps user wording', () => {
    const src = 'a <!-- decks:repo-only -->`bun run test`<!-- /decks:repo-only --><!-- decks:user: `bun run lint` -->.\n'
    expect(renderSource(src)).toBe('a `{{decks}} lint`.\n')
    expect(renderSource('x\n<!-- decks:repo-only -->\nrepo line\n<!-- /decks:repo-only -->\ny\n')).toBe('x\ny\n')
  })

  it('maps commands, directories and exemplars to template variables', () => {
    expect(renderSource('`bun run shot <alias> <n> [clicks]` in `decks/<dir>` per `examples/agent-experience` and `packages/decks/story/README.md`\n')).toBe(
      '`{{decks}} shot <alias> <n> [clicks]` in `{{decksDir}}/<dir>` per `{{exemplars}}/agent-experience` and `{{pkg}}/story/README.md`\n',
    )
    expect(renderSource('---\npaths:\n  - "examples/**"\n  - "decks/**"\n  - "packages/decks/**"\n---\n')).toBe('---\npaths:\n  - "{{decksDir}}/**"\n---\n')
  })

  it('refuses to render a repo-only reference it has no mapping for', () => {
    expect(() => renderSource('run `bun run typecheck`\n', 'x.md')).toThrow(/x\.md: repo-only reference[\s\S]*1: run/)
    expect(() => renderSource('see `examples/od-templates`\n')).toThrow(/repo-only reference/)
  })
})
