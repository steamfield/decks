/**
 * useStage: the wiring every story stage has, in one call.
 *
 * A stage is a beat script over a state object, a card copy array indexed by
 * beat, and an optional enter motion for the first landing. Written out by
 * hand that was `useScriptedDemo`, `beatCopy`, `useStageEntrance` and a run
 * of `tl.addLabel('beatN')` calls per stage, plus three numbers that had to
 * agree: the copy array's length, the `:beats` count handed to StoryStage,
 * and `clicks` in the deck manifest. This composes the same four pieces in
 * the same order and returns `beats` derived from the copy, so a stage passes
 * that through and the first two can no longer disagree (`beats.test.ts`
 * checks the manifest).
 *
 * Both timelines are built inside `onMounted` (see `useStageEntrance`), so a
 * beat script may drive a child through a template ref.
 */
import { beatCopy } from './copy'
import { useStageEntrance } from './entrance'
import { beat } from './timeline'
import { gsap } from './easings'
import { useScriptedDemo } from '../composables/scripted-demo'
import type { BeatCopy } from './types'

export interface StageOptions<C extends BeatCopy> {
  /** Card copy per beat, in beat order. Its length is the beat count. */
  copy: readonly C[]
  /** One shot settle on landing at beat 0. Runs after mount; child refs exist. */
  enter?: (tl: gsap.core.Timeline) => void
  /** The beat script. `beat(n)` adds the label; the first call must be `beat(0)`. */
  beats: (tl: gsap.core.Timeline, beat: (n: number) => void) => void
}

export function useStage<C extends BeatCopy>(opts: StageOptions<C>) {
  const { clicks, isActive, playCount } = useScriptedDemo()
  const copy = beatCopy(opts.copy, clicks)
  useStageEntrance(opts.enter ?? (() => {}), {
    clicks,
    isActive,
    beats: (tl) => opts.beats(tl, (n) => beat(tl, n)),
  })
  return { clicks, isActive, playCount, copy, beats: opts.copy.length }
}
