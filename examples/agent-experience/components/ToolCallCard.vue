<script setup lang="ts">
/**
 * ToolCallCard: one tool call as an agent would log it. A header row names the
 * server and tool, the argument type and how long it took; the default slot is
 * the call's body (a spec, a result, a snippet).
 *
 * A thin wrapper over the library's StaticTranscript in the terminal layout:
 * one tool-call step, with the default slot rendered through `toolBody`.
 * Look and feel come from `styles/sf-theme.css`.
 */
import type { DemoScript } from '@steamfield/ui/script'
import { StaticTranscript } from '@steamfield/ui/vue/agent-demo'
import { computed } from 'vue'

const props = defineProps<{
  tool: string
  server?: string
  args?: string
  time?: string
}>()

const script = computed<DemoScript>(() => ({
  id: 'tool-call-card',
  steps: [
    {
      kind: 'tool-call',
      name: props.tool,
      ...(props.server ? { server: props.server } : {}),
      ...(props.args ? { args: props.args } : {}),
      ...(props.time ? { meta: props.time } : {}),
      status: 'done',
      body: { kind: 'custom', data: null },
    },
  ],
}))
</script>

<template>
  <StaticTranscript class="ax-call" :script="script" layout="terminal">
    <template #toolBody>
      <slot />
    </template>
  </StaticTranscript>
</template>
