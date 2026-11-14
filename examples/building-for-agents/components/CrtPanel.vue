<script setup lang="ts">
/**
 * CrtPanel: the HTML twin of CrtFrame. A small monitor inside the tube, for
 * recordings made of text (terminal output, an agent session) rather than ink.
 *
 * Placed at `x`, `y`, `width`, `height` in stage viewBox units, in a stage's
 * `#overlay` slot. A bezel, a dark screen with static scanlines, and a band
 * along the bottom for the figure number and the recording's source. `power`
 * fades the screen's content, so a beat can switch the monitor on.
 */
import { computed } from 'vue'
import { STAGE } from 'slidev-addon-decks/story'

const props = withDefaults(
  defineProps<{
    x: number
    y: number
    width: number
    height: number
    /** A short pixel-type label at the top left of the screen ("WHAT I SEE"). */
    label?: string
    fig?: string
    tag?: string
    progress?: number
    power?: number
  }>(),
  { label: '', fig: '', tag: '', progress: 1, power: 1 },
)

const box = computed(() => ({
  left: `${(props.x / STAGE.width) * 100}%`,
  top: `${(props.y / STAGE.height) * 100}%`,
  width: `${(props.width / STAGE.width) * 100}%`,
  height: `${(props.height / STAGE.height) * 100}%`,
  opacity: String(props.progress),
}))
</script>

<template>
  <div class="sf-panel" :style="box">
    <div class="sf-panel-screen">
      <div v-if="props.label" class="sf-panel-label">{{ props.label }}</div>
      <div class="sf-panel-content" :style="{ opacity: String(props.power) }"><slot /></div>
    </div>
    <div v-if="props.fig || props.tag" class="sf-panel-band">
      <span class="sf-panel-fig">{{ props.fig }}</span>
      <span class="sf-panel-tag" :style="{ opacity: String(props.power) }">{{ props.tag }}</span>
    </div>
  </div>
</template>

<style scoped>
.sf-panel {
  position: absolute;
  display: flex;
  flex-direction: column;
  padding: calc(0.73 * var(--sw));
  border: var(--sf-hairline) solid var(--od-border-rule);
  border-radius: var(--sf-crt-radius-outer);
  background: var(--od-surface);
}
.sf-panel-screen {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  border-radius: var(--sf-crt-radius-screen);
  background: var(--od-screen-black);
}
.sf-panel-screen::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0 3px,
    rgb(255 255 255 / var(--sf-crt-scan)) 3px 6px
  );
}
.sf-panel-label {
  position: absolute;
  top: calc(0.9 * var(--sw));
  right: calc(1.1 * var(--sw));
  font-family: var(--sf-font-pixel);
  font-size: var(--sf-pixel-size);
  text-transform: uppercase;
  color: var(--od-text-muted);
  text-shadow: var(--sf-fringe);
}
.sf-panel-content {
  position: absolute;
  inset: 0;
  padding: calc(1 * var(--sw)) calc(1.25 * var(--sw));
}
.sf-panel-band {
  display: flex;
  justify-content: space-between;
  gap: calc(1 * var(--sw));
  padding: calc(0.55 * var(--sw)) calc(0.4 * var(--sw)) 0;
  font-family: var(--sf-font-pixel);
  font-size: calc(0.6771 * var(--sw));
  line-height: 1.5;
  white-space: nowrap;
  color: var(--od-text-muted);
  text-shadow: var(--sf-fringe);
}
.sf-panel-fig { color: var(--od-amber); text-transform: uppercase; }
</style>
