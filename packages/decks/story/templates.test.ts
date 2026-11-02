/**
 * Guard: the three copies of the minimal stage stay identical.
 *
 * The smallest correct stage exists three times because a component is
 * deck-local: once in the conventional template gallery, once in the story
 * gallery, which runs on the story headmatter, and once in the addon's
 * `templates/`, which is what `decks new --story` copies into a new deck.
 * Only the header comment differs. A fix made to one copy and not the other is how the scaffold and
 * the gallery drift apart without anything failing.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const CONVENTIONAL = '../../../examples/od-templates/components/StoryMinimalStage.vue'
const STORY = '../../../examples/od-story-templates/components/MinimalStage.vue'
const SCAFFOLD = '../templates/StoryMinimalStage.vue'

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')

/** Everything after the leading block comment, which is the part that differs. */
const body = (src: string) => src.slice(src.indexOf('*/') + 2)

describe('minimal stage templates', () => {
  it('are the same file outside the header comment', () => {
    const conventional = body(read(CONVENTIONAL))
    expect(conventional).toContain('useStage')
    expect(body(read(STORY))).toBe(conventional)
    expect(body(read(SCAFFOLD))).toBe(conventional)
  })
})
