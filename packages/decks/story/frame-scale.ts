/**
 * useFrameScale: the story frame's width as a fraction of the 1920 canvas.
 *
 * The frame (`.od-story-frame`, story-frame.css) is the largest 16:9 box that
 * fits the viewport, so CSS inside it sizes in --sw/--sh. Anything that takes
 * plain pixels instead, an OpenChart spec's font sizes for one, has to be
 * multiplied by this to stay in proportion with the frame on a smaller screen.
 * It mirrors `--od-fw: min(100vw, 177.7778vh)` and is 1 on a 1920x1080 window.
 */
import { onMounted, onScopeDispose, ref, type Ref } from 'vue'
import { STAGE } from './stage-map'

export function frameScale(width: number, height: number): number {
  return Math.min(width, (height * STAGE.width) / STAGE.height) / STAGE.width
}

export function useFrameScale(): Ref<number> {
  const scale = ref(1)
  const update = () => {
    scale.value = frameScale(window.innerWidth, window.innerHeight)
  }
  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })
  onScopeDispose(() => {
    if (typeof window !== 'undefined') window.removeEventListener('resize', update)
  })
  return scale
}
