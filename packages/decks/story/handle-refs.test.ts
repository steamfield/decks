/**
 * Guard: nothing the beat script reaches through a template ref may sit inside
 * the `:key="playCount"` subtree.
 *
 * The two replay mechanisms a stage has look interchangeable and are not.
 *
 * `useStageEntrance` builds the entrance and beat timelines once, in
 * `onMounted`, which is what lets a beat script drive a child through a
 * template ref (`line.value?.addDraw(tl)`): the ref is populated by then, and
 * the tween it adds is bound to *that child instance's* state object.
 * `playCount` is the other mechanism: it bumps on every slide entry, and bound
 * as `:key` it remounts a subtree so anything stateful inside starts over.
 *
 * Put a ref'd child inside that key and the second mechanism destroys the
 * first. Slidev mounts preloaded slides hidden, so a stage usually mounts
 * while inactive with `playCount` at 0, and the timelines capture the children
 * that exist then. Arrowing onto the slide bumps `playCount`, Vue unmounts
 * that subtree and mounts fresh children at their resting state, and the
 * timelines go on animating orphans. The line renders fully drawn from the
 * first frame and never sweeps. It looks like the timeline never ran; it ran,
 * against components that are no longer on screen. Deep-linking to the slide
 * hides it, because mounting while already active sets `playCount` during
 * setup and nothing remounts.
 *
 * A timeline-driven child does not need the key in the first place. `addDraw`
 * is a `fromTo`, and the beat timeline is a pure function of the click index,
 * so both re-arm on re-entry on their own. The key is for state no timeline
 * owns: a CSS keyframe, a canvas, a child that keeps its own playhead.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { storyDecks } from './test-decks'

/**
 * The scaffold's copy of the minimal stage, which `bun run new --story`
 * writes into every new deck. Its own deck is not a story deck, so the
 * registry-derived scan below does not reach it.
 */
const SCAFFOLD_TEMPLATE = fileURLToPath(
  new URL('../../../examples/od-templates/components/StoryMinimalStage.vue', import.meta.url),
)

const KEYED = /<([A-Za-z][\w.-]*)(?=[\s>])[^>]*:key="playCount"/

function vueFiles(dir: string): string[] {
  let names: string[] = []
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  return names.filter((name) => extname(name) === '.vue').map((name) => join(dir, name))
}

function scanTargets(): string[] {
  return [
    SCAFFOLD_TEMPLATE,
    ...storyDecks().flatMap(({ dir }) => vueFiles(join(dir, 'components'))),
  ]
}

/**
 * The source spanned by the element carrying `:key="playCount"`, from its
 * opening tag to its matching close. A self closing element spans itself.
 */
export function keyedSubtree(src: string): string | null {
  const open = KEYED.exec(src)
  if (!open) return null
  const tag = open[1]
  const start = open.index
  const openTagEnd = src.indexOf('>', start)
  if (openTagEnd === -1) return null
  if (src[openTagEnd - 1] === '/') return src.slice(start, openTagEnd + 1)

  const step = new RegExp(`<(/?)${tag}(?=[\\s/>])`, 'g')
  step.lastIndex = openTagEnd
  let depth = 1
  for (let m = step.exec(src); m; m = step.exec(src)) {
    if (m[1] === '/') {
      depth -= 1
      if (depth === 0) return src.slice(start, src.indexOf('>', m.index) + 1)
    } else {
      const tagEnd = src.indexOf('>', m.index)
      if (tagEnd !== -1 && src[tagEnd - 1] !== '/') depth += 1
    }
  }
  return src.slice(start)
}

/** Template ref names declared inside the keyed subtree. */
export function refsInside(subtree: string): string[] {
  return [...subtree.matchAll(/\bref="([A-Za-z_$][\w$]*)"/g)].map((m) => m[1]!)
}

/**
 * Ref names the script block drives through a handle method. Only these
 * capture a child instance for the life of a timeline; a ref the script merely
 * reads (`grid.value?.arrived` inside a computed) re-resolves against whatever
 * is mounted now and survives a remount fine.
 */
export function refsDriven(src: string): Set<string> {
  const script = src.slice(0, src.indexOf('</script>'))
  const calls = script.matchAll(/\b([A-Za-z_$][\w$]*)\.value\??\.(?:add[A-Z]\w*|settle)\s*\(/g)
  return new Set([...calls].map((m) => m[1]!))
}

function offenders(): string[] {
  const found: string[] = []
  for (const file of scanTargets()) {
    const src = readFileSync(file, 'utf8')
    const subtree = keyedSubtree(src)
    if (!subtree) continue
    const driven = refsDriven(src)
    for (const name of refsInside(subtree)) {
      if (driven.has(name)) found.push(`${file}: ref="${name}" is inside the playCount key`)
    }
  }
  return found
}

const OFFENDING = `
<script setup lang="ts">
const line = ref<LineHandle | null>(null)
useStage({ copy: COPY, enter: (tl) => line.value?.addDraw(tl) })
</script>
<template>
  <g :key="playCount">
    <rect />
    <InkLine ref="line" />
  </g>
</template>
`

const CLEAN = `
<script setup lang="ts">
const line = ref<LineHandle | null>(null)
useStage({ copy: COPY, enter: (tl) => line.value?.addDraw(tl) })
</script>
<template>
  <g :key="playCount"><rect /></g>
  <InkLine ref="line" />
</template>
`

describe('handle refs outside the replay key', () => {
  it('has files to scan', () => {
    expect(scanTargets().length).toBeGreaterThan(10)
  })

  it('scans the scaffold the story generator copies', () => {
    expect(scanTargets()).toContain(SCAFFOLD_TEMPLATE)
  })

  it('reads the keyed subtree, not the rest of the template', () => {
    const subtree = keyedSubtree(OFFENDING)!
    expect(subtree).toContain('<InkLine ref="line"')
    expect(keyedSubtree(CLEAN)).not.toContain('<InkLine ref="line"')
  })

  it('spans a self closing keyed element', () => {
    expect(keyedSubtree('<OpenChart :key="playCount" :spec="spec" />')).toBe(
      '<OpenChart :key="playCount" :spec="spec" />',
    )
  })

  it('counts nested elements of the same tag', () => {
    const src = '<g :key="playCount"><g><InkLine ref="a" /></g></g><InkLine ref="b" />'
    const subtree = keyedSubtree(src)!
    expect(refsInside(subtree)).toEqual(['a'])
  })

  it('would catch a driven handle inside the key', () => {
    const subtree = keyedSubtree(OFFENDING)!
    expect(refsInside(subtree).filter((n) => refsDriven(OFFENDING).has(n))).toEqual(['line'])
  })

  it('ignores a ref the script only reads', () => {
    const src = OFFENDING.replace('line.value?.addDraw(tl)', 'line.value?.arrived')
    const subtree = keyedSubtree(src)!
    expect(refsInside(subtree).filter((n) => refsDriven(src).has(n))).toEqual([])
  })

  it('finds no driven handle inside a replay key', () => {
    expect(offenders()).toEqual([])
  })
})
