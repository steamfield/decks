/**
 * useScriptedDemo — click-paced, zero-network demo playback for slides.
 *
 * Extracted from opendata-pitch's McpChatDemo so every scripted demo
 * (chat replays, terminal replays) shares one pacing implementation:
 *
 * - `shown(at)`: reveal a beat once the slide's click count reaches `at`.
 *   The page declares `clicks: N` in its manifest stanza and the presenter
 *   advances the demo with the same key as the rest of the deck.
 * - `playCount`: bumps on every slide entry (via useIsSlideActive) so
 *   entrance animations re-run when the presenter revisits the slide.
 *   Bind it as `:key="playCount"` on the demo root.
 *
 * No timers: timing-driven playback drifts on stage and fights
 * `--per-slide` PDF export, so all pacing is click-driven.
 */
import { computed, ref, watch } from 'vue'
import { useIsSlideActive, useSlideContext } from '@slidev/client'

export function useScriptedDemo() {
  const { $clicks } = useSlideContext()
  const isActive = useIsSlideActive()

  const playCount = ref(0)
  const wasActive = ref(false)
  watch(
    () => !!isActive.value,
    (active) => {
      if (active && !wasActive.value) playCount.value++
      wasActive.value = active
    },
    { immediate: true },
  )

  const clicks = computed(() => ($clicks?.value ?? 0) as number)
  const shown = (at: number) => clicks.value >= at

  return { clicks, shown, playCount, isActive }
}
