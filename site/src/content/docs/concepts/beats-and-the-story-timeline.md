---
title: Beats and the story timeline
description: How a story stage turns Slidev's click count into beats, why stepping back replays in reverse, and what useStage returns.
group: concepts
order: 1
---

A story slide pins one visualization to the slide and advances it in beats on the arrow keys. The beat timeline is a function of Slidev's click count, so stepping backward replays the transition in reverse instead of snapping. Prose sits in a floating card whose copy changes per beat, and a visual can carry over from one slide to the next.

## `useStage`

Everything a stage needs comes from one import:

```ts
import { useStage, DUR, stagger, type BeatCopy } from 'slidev-addon-decks/story'
```

```ts
export interface StageOptions<C extends BeatCopy> {
  copy: readonly C[]
  enter?: (tl: gsap.core.Timeline) => void
  beats: (tl: gsap.core.Timeline, beat: (n: number) => void) => void
}
function useStage<C extends BeatCopy>(opts: StageOptions<C>): {
  clicks: Ref<number>
  isActive: Ref<boolean>
  playCount: Ref<number>
  copy: ComputedRef<C>
  beats: number
}
```

`beats` comes from `opts.copy.length`, so a stage's beat count and its copy array can't disagree. A guard test, `beats.test.ts`, checks that value against the `clicks:` in the deck's manifest: `clicks` is the beat count minus one.

## Seek or tween

The beat timeline seeks or tweens to the current click on every change. It seeks on first run, on an inactive slide, under reduced motion, or on a jump of more than one beat, and tweens otherwise. An interrupted tween retargets from where it is and catches up within one beat's duration, so rapid clicks don't build a backlog.

## Entrances

When a stage mounts it builds its entrance timeline, paused. Then:

- Not the real slide view (presenter, overview, print): jump to the end state.
- Slide inactive: hold at zero, so the next entry replays.
- Active but not landing on beat 0, or motion turned down: jump to the end state.
- Otherwise: hold until any view transition lands, then play once.

| Context | Entrance | Beat timeline |
| --- | --- | --- |
| `slide` (the real view) | Plays per the rules above | Seeks or tweens |
| `presenter` | Jumps to the end state | Seeks |
| `overview` | Jumps to the end state | Seeks |
| print and export | Jumps to the end state | Seeks |

## Durations

Stages use three easings (`SETTLE`, `DRAW`, `TRACE`) and one duration table, `DUR`, from `slidev-addon-decks/story`. A guard test fails on a numeric duration literal anywhere else, so timing stays consistent across stages. `DUR.card` (0.3 s) is the card copy swap; `DUR.grow` (0.56 s) is a bar or number growing in.
