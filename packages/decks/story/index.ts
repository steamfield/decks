/**
 * The story engine's public surface. Stages and shared components import from
 * here and nowhere deeper, so the barrel doubles as the list of what a stage
 * may reach for. That includes the lower-level composables a stage rarely
 * wants but `README.md` documents, alongside `useStage` itself.
 */
export type {
  BarsHandle,
  BeatCopy,
  DrawOptions,
  GrowHandle,
  InkBarRow,
  LineHandle,
  Point,
  RowStripColumn,
  RuleHandle,
  TickState,
  TimelineTick,
  UnitGridItem,
} from './types'
export { hash, hashRange, hashSigned } from './hash'
export { BRUSH_DEFAULTS, brushRibbon } from './brush'
export { FILTER_IDS, ensureStoryDefs, filterUrl } from './filters'
export { CANVAS, ink, type Hue, type InkStep } from './ramps'
export { DRAW, DRAW_CSS, DUR, SETTLE, SETTLE_CSS, TRACE, gsap } from './easings'
export { beat, prefersReducedMotion, resolvePosition, useStoryTimeline } from './timeline'
export { useStageEntrance } from './entrance'
export { useStage, type StageOptions } from './stage'
export { beatCopy } from './copy'
export { clamp01, lerp, stackEndLabels, stagger, xScale, yScale } from './scales'
export { rippleProgress, type RippleOptions } from './ripple'
export { UNIT_GRID_DEFAULTS, unitCellCenter, unitCellHeight, type UnitGridGeometry } from './grid'
export { STORY_STYLE, STROKE, inkStyle, polylinePath } from './style'
export { RISE, easeHeight, entrance, fadeIn, fadeOutInPlace, riseIn } from './motion'
export {
  afterViewTransition,
  startStoryTransition,
  supportsViewTransition,
  viewTransitionInFlight,
} from './view-transition'
export { tokenizeSql } from './code-tokens'
export { CATEGORICAL_COLORS } from './palette'
export { STAGE, useStageMap } from './stage-map'
export { frameScale, useFrameScale } from './frame-scale'
export { useScriptedDemo } from '../composables/scripted-demo'
