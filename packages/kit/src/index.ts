export { gsap } from "@react-decks/motion";
export { useSlideScale as useFrameScale } from "@react-decks/runtime";
export { OdByline } from "./chrome/od-byline";
export { OdCoverHead } from "./chrome/od-cover-head";
export { OdEyebrow } from "./chrome/od-eyebrow";
export { OdLogo } from "./chrome/od-logo";
export { OdQrCard } from "./chrome/od-qr-card";
export {
  BRUSH_DEFAULTS,
  brushRibbon,
  type Dab,
  type InkOpts,
  type Point,
  type Series,
} from "./geometry/brush";
export {
  UNIT_GRID_DEFAULTS,
  type UnitGridGeometry,
  type UnitGridItem,
  unitCellCenter,
  unitCellHeight,
} from "./geometry/grid";
export { hash, hashRange, hashSigned } from "./geometry/hash";
export * as parliament from "./geometry/parliament";
export { type RippleOptions, rippleProgress } from "./geometry/ripple";
export { clamp01, lerp, stackEndLabels, stagger, xScale, yScale } from "./geometry/scales";
export { ChartSteps } from "./ink/chart-steps";
export { CodeInk } from "./ink/code-ink";
export { tokenizeSql } from "./ink/code-tokens";
export { Graph3D } from "./ink/graph-3d";
export { type BarsHandle, type InkBarRow, InkBars } from "./ink/ink-bars";
export { InkCardRect } from "./ink/ink-card-rect";
export { InkChip } from "./ink/ink-chip";
export { type DrawOptions, InkLine, type LineHandle } from "./ink/ink-line";
export { type GrowHandle, InkNumber } from "./ink/ink-number";
export { InkPing } from "./ink/ink-ping";
export { InkRule, type RuleHandle } from "./ink/ink-rule";
export { inkStyle, polylinePath, STORY_STYLE, STROKE } from "./ink/ink-style";
export {
  InkTimeline,
  type TickState,
  type TimelineHandle,
  type TimelineTick,
} from "./ink/ink-timeline";
export { InkTimelineCursor } from "./ink/ink-timeline-cursor";
export { OpenChart } from "./ink/open-chart";
export { Scene3D } from "./ink/scene-3d";
export { Underline } from "./ink/underline";
export { UnitGrid, type UnitGridHandle } from "./ink/unit-grid";
export { useStageEntrance } from "./story/entrance";
export { useScriptedDemo } from "./story/scripted-demo";
export { useStage } from "./story/stage";
export { useStageMap } from "./story/stage-map";
export { StoryCard } from "./story/story-card";
export { StoryCover } from "./story/story-cover";
export { StoryLayer } from "./story/story-layer";
export { StoryLink } from "./story/story-link";
export { easeHeight, entrance, fadeIn, fadeOutInPlace, RISE, riseIn } from "./story/story-motion";
export { STAGE, StoryStage } from "./story/story-stage";
export { prefersReducedMotion, resolvePosition } from "./story/timeline-position";
export { LiveTerm, type LiveTermStatus } from "./term/live-term";
export { scaleChartTheme, slideChartAnimation, slideChartTheme } from "./theme/chart-theme";
export {
  DRAW,
  DRAW_CSS,
  DUR,
  easedStagger,
  SETTLE,
  SETTLE_CSS,
  TRACE,
  TRACE_CSS,
} from "./theme/easings";
export { FILTER_IDS, filterUrl } from "./theme/filters";
export {
  CANVAS,
  CATEGORICAL_COLORS,
  type InkStep,
  ink,
  installTheme,
  resolveTheme,
  theme,
} from "./theme/theme";
export type { Hue, Theme } from "./theme/theme-resolve";
