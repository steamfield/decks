<script setup lang="ts">
/**
 * RepoTree: a file tree that lights up beside the code it leads to.
 *
 * `nodes` are the rows, top to bottom, each with a `depth` for its indent and
 * an optional one-line `note`. `lit` is the set of ids at full strength;
 * everything else sits at the dim level. `focus` is the one row a beat is
 * about: it gets the pink marker and shows its note. `reveal` (0..1) brings
 * the rows in on a stagger at entrance. Placed in stage viewBox units, in a
 * stage's `#overlay` slot.
 */
import { computed } from 'vue'
import { STAGE, stagger } from 'slidev-addon-decks/story'
import type { TreeNode } from '../data/types'

const props = withDefaults(
  defineProps<{
    nodes: readonly TreeNode[]
    lit?: readonly string[]
    focus?: string
    reveal?: number
    x: number
    y: number
    width: number
    /** Row height in stage units. */
    row?: number
    /** A path shown above the tree, e.g. "packages/cli/". */
    root?: string
  }>(),
  { lit: () => [], focus: '', reveal: 1, row: 40, root: '' },
)

const box = computed(() => ({
  left: `${(props.x / STAGE.width) * 100}%`,
  top: `${(props.y / STAGE.height) * 100}%`,
  width: `${(props.width / STAGE.width) * 100}%`,
}))
const rows = computed(() =>
  props.nodes.map((node, i) => {
    const p = stagger(props.reveal, i, props.nodes.length, 0.06)
    const on = node.id === props.focus || props.lit.includes(node.id)
    return { ...node, p, on, focused: node.id === props.focus }
  }),
)
</script>

<template>
  <div class="sf-tree" :style="box">
    <div v-if="props.root" class="sf-tree-root" :style="{ opacity: String(props.reveal) }">{{ props.root }}</div>
    <div
      v-for="node in rows"
      :key="node.id"
      class="sf-tree-row"
      :class="{ 'is-on': node.on, 'is-focus': node.focused }"
      :style="{
        height: `calc(${props.row / 10.8} * var(--sh))`,
        paddingLeft: `calc(${0.9 + node.depth * 1.35} * var(--sw))`,
        opacity: String(node.p * (node.on ? 1 : 0.45)),
        transform: `translateY(${(1 - node.p) * 10}px)`,
      }"
    >
      <span class="sf-tree-label">{{ node.label }}</span>
      <span v-if="node.note && node.focused" class="sf-tree-note">{{ node.note }}</span>
    </div>
  </div>
</template>

<style scoped>
.sf-tree { position: absolute; }
.sf-tree-root {
  margin-bottom: calc(0.5 * var(--sw));
  font-family: var(--od-font-mono);
  font-size: calc(0.9375 * var(--sw));
  color: var(--od-text-muted);
}
.sf-tree-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: calc(0.9 * var(--sw));
  border-left: var(--sf-marker) solid transparent;
  white-space: nowrap;
  transition: opacity var(--od-dur-card) var(--od-settle), border-color var(--od-dur-card) var(--od-settle),
    background-color var(--od-dur-card) var(--od-settle);
}
.sf-tree-row.is-focus {
  border-left-color: var(--od-pink);
  background: color-mix(in srgb, var(--od-pink) 12%, transparent);
}
.sf-tree-label {
  font-family: var(--od-font-mono);
  font-size: calc(1.1458 * var(--sw));
  color: var(--od-text-secondary);
}
.sf-tree-row.is-on .sf-tree-label { color: var(--od-text); }
.sf-tree-note {
  font-family: var(--od-font-sans);
  font-size: calc(1.3542 * var(--sw));
  line-height: 1;
  color: var(--od-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
