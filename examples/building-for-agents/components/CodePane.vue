<script setup lang="ts">
/**
 * CodePane: a real code excerpt, highlighted, with the file it came from.
 *
 * `excerpt` is a module from data/code/ (see data/code/types.ts); the pane
 * shows its `code` and labels itself with the repo, path and line range.
 * `focus` is a list of [first, last] line ranges within the shown code,
 * 1-based; when set, those lines stay bright and the rest drop to the dim
 * level, so a beat can point at the handler or the one clause that matters.
 * Changing `excerpt` cross-fades in place: the pane never moves or scrolls.
 *
 * Keep an excerpt to 14 lines or fewer and about 62 characters wide at the
 * default size. Placed in stage viewBox units, in a stage's `#overlay` slot.
 */
import { computed } from 'vue'
import { STAGE } from 'slidev-addon-decks/story'
import { tokenizeLine } from './code-tokens'
import type { Excerpt } from '../data/code/types'

const props = withDefaults(
  defineProps<{
    excerpt: Excerpt
    focus?: readonly (readonly [number, number])[]
    x: number
    y: number
    width: number
    height: number
    /** 0 hides the pane, 1 shows it. */
    progress?: number
    /** Font size in stage units. Never below 21. */
    size?: number
  }>(),
  { focus: () => [], progress: 1, size: 24 },
)

const box = computed(() => ({
  left: `${(props.x / STAGE.width) * 100}%`,
  top: `${(props.y / STAGE.height) * 100}%`,
  width: `${(props.width / STAGE.width) * 100}%`,
  height: `${(props.height / STAGE.height) * 100}%`,
  opacity: String(props.progress),
}))
const key = computed(() => `${props.excerpt.repo}/${props.excerpt.path}:${props.excerpt.start}`)
const label = computed(
  () => `${props.excerpt.repo}/${props.excerpt.path} · lines ${props.excerpt.start} to ${props.excerpt.end}`,
)
const rows = computed(() =>
  props.excerpt.code.split('\n').map((line, i) => ({
    n: i + 1,
    tokens: tokenizeLine(line, props.excerpt.lang),
    lit: props.focus.length === 0 || props.focus.some(([a, b]) => i + 1 >= a && i + 1 <= b),
  })),
)
</script>

<template>
  <div class="sf-code" :style="box">
    <Transition name="sf-code-swap" mode="out-in">
      <div :key="key" class="sf-code-inner">
        <div class="sf-code-label">{{ label }}</div>
        <pre class="sf-code-body" :style="{ fontSize: `calc(${props.size / 19.2} * var(--sw))` }"><span
          v-for="row in rows"
          :key="row.n"
          class="sf-code-line"
          :class="{ 'is-cold': !row.lit }"
        ><span v-for="(t, i) in row.tokens" :key="i" :class="`sf-tok-${t.kind}`">{{ t.text }}</span>{{ '\n' }}</span></pre>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.sf-code {
  position: absolute;
  overflow: hidden;
  border: var(--sf-hairline) solid var(--od-border-rule);
  border-radius: var(--sf-radius-card);
  background: color-mix(in srgb, var(--od-screen-black) 82%, transparent);
}
.sf-code-inner {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  padding: calc(0.9 * var(--sw)) calc(1.2 * var(--sw));
}
.sf-code-label {
  margin-bottom: calc(0.7 * var(--sw));
  font-family: var(--od-font-mono);
  font-size: calc(0.9375 * var(--sw));
  color: var(--od-text-muted);
  white-space: nowrap;
  overflow: hidden;
}
.sf-code-body {
  margin: 0;
  padding: 0;
  background: none;
  font-family: var(--od-font-mono);
  line-height: 1.42;
  color: var(--od-text);
  /* A long line wraps onto a hanging indent; code is never clipped. */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.sf-code-line { transition: opacity var(--od-dur-card) var(--od-settle); }
.sf-code-line.is-cold { opacity: var(--sf-dim); }
.sf-tok-keyword { color: var(--od-pink); }
.sf-tok-string { color: var(--od-amber-soft); }
.sf-tok-comment { color: var(--od-text-faint); font-style: italic; }
.sf-tok-number { color: var(--od-cyan); }
.sf-tok-type { color: var(--od-cyan-bright); }
.sf-tok-punct { color: var(--od-text-secondary); }
.sf-code-swap-enter-active,
.sf-code-swap-leave-active { transition: opacity var(--od-dur-opacity) linear; }
.sf-code-swap-enter-from,
.sf-code-swap-leave-to { opacity: 0; }
</style>
