/**
 * Shared types for the story deck ink layer.
 *
 * Geometry is expressed in viewBox units of the 1920x1080 stage, never in
 * screen pixels, so a resize never changes a stroke.
 */
import type { Hue, InkStep } from './ramps'

export interface Point {
  x: number
  y: number
}

/** One data series drawn as an ink ribbon. */
export interface Series {
  id: string
  hue: string
  points: Point[]
}

/**
 * One closed filled polygon of a ribbon. `d` is a 16 point path that starts
 * with M and ends with Z. `overpaint`, when present, is the fill opacity of a
 * darker same hue second pass over the identical polygon.
 */
export interface Dab {
  d: string
  fillOpacity: number
  overpaint?: number
}

/** Options for brushRibbon. Every field has a default in BRUSH_DEFAULTS. */
export interface InkOpts {
  /** Nominal stroke width in viewBox units at the belly of the stroke. */
  width: number
  /** Seed derived from data identity (series id plus index), never geometry. */
  seed: number | string
  /** Fraction of the stroke spent ramping up from startWidth. */
  taperIn: number
  /** Fraction of the stroke spent ramping down to endWidth. */
  taperOut: number
  /** Width multiplier at the very start of the stroke. */
  startWidth: number
  /** Width multiplier at the very end of the stroke. */
  endWidth: number
  /** Width multiplier through the middle of the stroke. */
  belly: number
  /** Per edge offset jitter amplitude in viewBox units. */
  wobble: number
  /** Per vertex offset jitter amplitude in viewBox units. */
  edge: number
  /** Nib shear in radians. Non zero gives the ribbon a chisel tip. */
  chisel: number
  /** Arc length in viewBox units between resampled centreline points. */
  samples: number
}

/**
 * The prose card's copy at one beat. A stage keeps one of these per beat, in
 * beat order, and `useStage` derives the beat count from the array's length.
 * A beat with no card is `{ lead: '' }`: the entry still counts as a beat and
 * the stage renders its card with `v-if="copy.lead"`.
 */
export interface BeatCopy {
  /** Bold lead line. At most eight words. */
  lead: string
  /** Supporting sentence. At most twenty words. */
  body?: string
}

/** A labelled stop on a story timeline. Labels are `beat0`..`beatN`. */
export interface Beat {
  index: number
  label: string
}

/**
 * A child that grows itself off its own baseline on the caller's timeline.
 *
 * Beat pacing lives in the parent, so `InkNumber` and `InkBars` do not own a
 * timeline: they add their tweens to one they are handed. Declared here so a
 * stage that holds a ref to one does not restate the signature.
 */
export interface GrowHandle {
  /** Appends when `at` is omitted; pass `'<'` to move with the previous tween. */
  addGrow(tl: gsap.core.Timeline, at?: gsap.Position): gsap.core.Timeline
}

/** One row of an `InkBars` set. Values are in domain units. */
export interface InkBarRow {
  /** Stable identity. Seeds derive from it, so a row keeps its ink. */
  id: string
  /** Typeset label, right aligned into the label column. */
  label: string
  /** Value in domain units. */
  value: number
  /** End label. Defaults to the value formatted by the `format` prop. */
  text?: string
  hue?: Hue
  step?: InkStep
}

/** What `InkBars` exposes: grow, then reorder, retire and recolor rows. */
export interface BarsHandle extends GrowHandle {
  /** `spread` (seconds, a DUR value) cascades the rows on `easedStagger`; 0 grows them together. */
  addGrow(tl: gsap.core.Timeline, at?: gsap.Position, opts?: { spread?: number }): gsap.core.Timeline
  addReorder(
    tl: gsap.core.Timeline,
    next: InkBarRow[],
    domain?: [number, number],
    at?: gsap.Position,
    opts?: { spread?: number },
  ): gsap.core.Timeline
  addExit(tl: gsap.core.Timeline, ids: string[], at?: gsap.Position): gsap.core.Timeline
  addRecolor(
    tl: gsap.core.Timeline,
    id: string,
    color: string,
    at?: gsap.Position,
  ): gsap.core.Timeline
}

/** What `InkLine` exposes: draw on, erase, or land drawn with no tween. */
export interface LineHandle {
  addDraw(tl: gsap.core.Timeline, position?: gsap.Position, opts?: DrawOptions): gsap.core.Timeline
  addErase(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline
  settle(): void
}

/** What `InkRule` exposes: its group, and a draw the caller times. */
export interface RuleHandle {
  root: SVGGElement | null
  addDraw(tl: gsap.core.Timeline, position?: gsap.Position): gsap.core.Timeline
}

/** Per call overrides for `InkLine.addDraw`. Defaults are the grow beat and the draw curve. */
export interface DrawOptions {
  duration?: number
  ease?: string
}

/** One dated stop on an `InkTimeline`. `at` is in the same units as `domain`. */
export interface TimelineTick {
  id: string
  at: number
  label: string
  /** Render at the bright ramp step, for the recent set. */
  bright?: boolean
  /**
   * A date that has not happened yet: the tick is drawn dashed, so "past" and
   * "ahead" read apart without reading the labels. Clean ink style only.
   */
  projected?: boolean
}

/**
 * Per tick beat state for `InkTimeline`, one entry per tick. `ink` draws the
 * mark in, `lift` hands it off to whatever the slide is morphing it into.
 *
 * A slide that builds its timeline at setup, which is where `useStoryTimeline`
 * runs, cannot reach a child through a template ref yet. So it can own this
 * array itself and pass it in, exactly as the drift slide owns its own beat
 * object. Left unset, the component keeps its own and drives it through the
 * exposed builders.
 */
export interface TickState {
  ink: number
  lift: number
}

/** One column of a `RowStrip`: mono header over a single value. */
export interface RowStripColumn {
  header: string
  value: string
  highlight?: boolean
}

/** One cell of a `UnitGrid`. */
export interface UnitGridItem {
  id: string
  /** Drives `colorBy` and, with no `colorBy`, nothing else. */
  category?: string
  /** Per item ink, used when `colorBy` returns nothing. */
  hue?: Hue
  step?: InkStep
}
