<script setup lang="ts">
/**
 * Slide 5: the Stacks CLI is written with Effect.
 *
 * The repo breakaway for Stacks, and the talk's only Effect lesson. A file
 * tree of packages/cli/src on the left, real code on the right. Six beats:
 * the three files every run starts in, then one idea per click, each a folder
 * lighting up and the code it holds: a command, a service with its layer, the
 * layer composition, the error table, and a test that swaps a layer.
 *
 * What is focused and which excerpt shows are functions of the click index, so
 * stepping back restores the previous file exactly. The only tweened state is
 * the tree's entrance and the code pane arriving on the first click.
 */
import { computed, reactive } from 'vue'
import { DUR, SETTLE, useStage } from 'slidev-addon-decks/story'
import { OFF, ON } from './design'
import { SRC_FILES, SRC_LINES, TREE } from '../data/05-stacks-tour'
import { APP_LAYER, ERROR_TABLE, HOST_SERVICE, LAYER_TEST, RUNS_COMMAND } from '../data/code/05-stacks'
import type { Excerpt } from '../data/code/types'

const COPY = [
  {
    lead: 'Every run starts in three files.',
    body: 'bin.ts imports from Node, main.ts maps errors to exit codes, and cli.ts builds the command tree.',
  },
  {
    lead: 'Each command is one file.',
    body: 'It declares its flags, calls the core, and lists its exit codes in the help text.',
  },
  {
    lead: 'A service class includes its test double.',
    body: 'Host.layer wraps the real process and Host.memory is the fake the tests use.',
  },
  {
    lead: 'One function composes the layers.',
    body: 'It adds config, output, logging and processes, and the tests call the same function.',
  },
  {
    lead: 'Each error has one row in a table.',
    body: 'The row sets its exit code and whether a retry can work. A missing row fails the build.',
  },
  {
    lead: 'Tests replace a layer with a fake.',
    body: 'This test swaps in an HTTP client that returns 503, then checks the JSON error.',
  },
]

interface Step {
  focus: string
  lit: readonly string[]
  excerpt?: Excerpt
  lines?: readonly (readonly [number, number])[]
}

/** One entry per beat, in beat order. */
const STEPS: readonly Step[] = [
  { focus: '', lit: ['bin', 'main', 'cli'] },
  { focus: 'commands', lit: ['cli'], excerpt: RUNS_COMMAND, lines: [[2, 5]] },
  { focus: 'services', lit: ['commands'], excerpt: HOST_SERVICE, lines: [[1, 4]] },
  { focus: 'runtime', lit: ['bin', 'services'], excerpt: APP_LAYER, lines: [[6, 9]] },
  { focus: 'errors', lit: ['main'], excerpt: ERROR_TABLE, lines: [[12, 12]] },
  { focus: 'tests', lit: ['services'], excerpt: LAYER_TEST, lines: [[8, 8], [11, 17]] },
]

/* ── Geometry, in stage viewBox units ── */
const TREE_BOX = { x: 110, y: 196, width: 680 }
/** The pane starts right of the card (which ends near x 800), so the two never overlap. */
const CODE_BOX = { x: 840, y: 196, width: 970, height: 746 }

const s = reactive({ tree: OFF, code: OFF, step: OFF })

const { clicks, copy, beats } = useStage({
  copy: COPY,
  enter: (tl) => tl.to(s, { tree: ON, duration: DUR.scale, ease: SETTLE }),
  beats: (tl, beat) => {
    beat(0)
    tl.to(s, { code: ON, duration: DUR.card, ease: SETTLE })
    beat(1)
    // The remaining beats change what is focused, which the click index
    // decides; the timeline only needs a label per beat to seek to.
    for (let n = 2; n < STEPS.length; n++) {
      tl.to(s, { step: n, duration: DUR.card, ease: 'none' })
      beat(n)
    }
  },
})

const step = computed(() => STEPS[Math.min(Math.max(clicks.value, 0), STEPS.length - 1)])
const root = `packages/cli/src · ${SRC_FILES} files · ${SRC_LINES.toLocaleString('en-US')} lines`
</script>

<template>
  <StoryStage :beats="beats" :click="clicks">
    <template #overlay>
      <h2 class="od-story-head">The Stacks CLI is written with Effect.</h2>
      <NamePlate id="stacks" chip-only />

      <RepoTree
        :nodes="TREE"
        :lit="step.lit"
        :focus="step.focus"
        :reveal="s.tree"
        :x="TREE_BOX.x"
        :y="TREE_BOX.y"
        :width="TREE_BOX.width"
        :root="root"
      />
      <CodePane
        v-if="step.excerpt"
        :excerpt="step.excerpt"
        :focus="step.lines"
        :progress="s.code"
        :x="CODE_BOX.x"
        :y="CODE_BOX.y"
        :width="CODE_BOX.width"
        :height="CODE_BOX.height"
      />
      <ThreadRail current="stacks" />
    </template>

    <template #card>
      <StoryCard anchor="left" hue="rose" :lead="copy.lead" :body="copy.body" />
    </template>
  </StoryStage>
</template>
