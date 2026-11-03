<script setup lang="ts">
/**
 * ToolCallCard: one tool call as an agent would log it. A header row names the
 * server and tool, the argument type and how long it took; the default slot is
 * the call's body (a spec, a result, a snippet).
 */
defineProps<{
  tool: string
  server?: string
  args?: string
  time?: string
}>()
</script>

<template>
  <div class="ax-call">
    <div class="ax-call-head">
      <span class="ax-call-pip" aria-hidden="true" />
      <span class="ax-call-name">
        <span v-if="server" class="ax-call-server">{{ server }} ·</span>
        {{ tool }}
      </span>
      <span v-if="args" class="ax-call-args">({{ args }})</span>
      <span class="ax-call-spacer" />
      <span v-if="time" class="ax-call-time">{{ time }}</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.ax-call {
  border: 1px solid var(--od-border);
  border-radius: 8px;
  overflow: hidden;
}
.ax-call-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--od-border);
}
.ax-call-pip {
  width: 10px;
  height: 10px;
  flex: none;
  border-radius: 50%;
  background: var(--od-emerald);
}
.ax-call-name {
  font-size: 13px;
  font-weight: 510;
  color: var(--od-text);
  white-space: nowrap;
}
.ax-call-server {
  color: var(--od-text-dim);
}
.ax-call-args,
.ax-call-time {
  font-family: var(--od-font-mono);
  font-size: 12px;
  color: var(--od-text-dim);
  white-space: nowrap;
}
.ax-call-spacer {
  flex: 1;
}
</style>
