<script setup lang="ts">
/**
 * TermPane: a terminal transcript, or an agent session, on a CrtPanel.
 *
 * Lines appear whole, never character by character: `shown` is how many lines
 * are visible, and a beat tweens it. Each line has a tone:
 *   cmd    a command someone typed ("$ " is added)
 *   user   what a person asked an agent ("> " is added, pink)
 *   agent  what the agent said
 *   out    plain output (the default)
 *   ok / fail / warn / muted   output in phosphor, pink, yellow or grey
 * `highlight` lists line indexes to draw in pink, for the one line a beat is
 * about; when it is set, every other line drops to the dim level.
 *
 * Text is real output from a fixture or a doc, or the pane is tagged
 * Illustrative. Never paraphrase output into something a tool would not print.
 */
import { computed } from 'vue'
import type { TermLine } from '../data/types'

const props = withDefaults(
  defineProps<{
    lines: readonly TermLine[]
    /** How many lines are visible; fractional values round down. Default: all. */
    shown?: number
    highlight?: readonly number[]
    x: number
    y: number
    width: number
    height: number
    label?: string
    fig?: string
    tag?: string
    progress?: number
    power?: number
    /** Font size in stage units (31 is the deck's terminal size). */
    size?: number
    /** Keep the last lines in view when there are more than fit. */
    follow?: boolean
  }>(),
  { shown: undefined, highlight: () => [], label: '', fig: '', tag: '', progress: 1, power: 1, size: 31, follow: true },
)

const visible = computed(() => {
  const n = props.shown === undefined ? props.lines.length : Math.floor(props.shown + 1e-6)
  return props.lines.slice(0, Math.max(0, n)).map((line, index) => ({ ...line, index }))
})
const prefix = (tone?: string) => (tone === 'cmd' ? '$ ' : tone === 'user' ? '> ' : '')
</script>

<template>
  <CrtPanel
    :x="props.x"
    :y="props.y"
    :width="props.width"
    :height="props.height"
    :label="props.label"
    :fig="props.fig"
    :tag="props.tag"
    :progress="props.progress"
    :power="props.power"
  >
    <div class="sf-term-lines" :class="{ 'is-follow': props.follow }" :style="{ fontSize: `calc(${props.size / 19.2} * var(--sw))` }">
      <div
        v-for="line in visible"
        :key="line.index"
        class="sf-term-line"
        :class="[
          `is-${line.tone ?? 'out'}`,
          { 'is-hot': props.highlight.includes(line.index), 'is-cold': props.highlight.length > 0 && !props.highlight.includes(line.index) },
        ]"
      ><span class="sf-term-prefix">{{ prefix(line.tone) }}</span>{{ line.text }}</div>
    </div>
  </CrtPanel>
</template>

<style scoped>
.sf-term-lines {
  display: flex;
  flex-direction: column;
  height: 100%;
  font-family: var(--sf-font-term);
  line-height: 1.12;
  color: var(--od-text-secondary);
}
.sf-term-lines.is-follow { justify-content: flex-end; }
.sf-term-line {
  white-space: pre;
  overflow: hidden;
  text-overflow: clip;
  transition: opacity var(--od-dur-card) var(--od-settle), color var(--od-dur-card) var(--od-settle);
}
.sf-term-prefix { color: var(--od-text-faint); }
.sf-term-line.is-cmd { color: var(--od-phosphor); }
.sf-term-line.is-user { color: var(--od-text); }
.sf-term-line.is-user .sf-term-prefix { color: var(--od-pink); }
.sf-term-line.is-agent { color: var(--od-text); }
.sf-term-line.is-ok { color: var(--od-phosphor); }
.sf-term-line.is-fail { color: var(--od-pink); }
.sf-term-line.is-warn { color: var(--od-amber); }
.sf-term-line.is-muted { color: var(--od-text-faint); }
.sf-term-line.is-cold { opacity: var(--sf-dim); }
.sf-term-line.is-hot { color: var(--od-pink); }
</style>
