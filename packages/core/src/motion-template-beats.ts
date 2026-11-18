/**
 * How many clicks each kit motion template takes, owned here so the MDX click counter (`node`)
 * and the templates (`kit`) read one table. A template's first beat plays on its `at` click and
 * each further beat on the click after; the kit's beats test renders every template against
 * this table so the two cannot drift.
 */

/** Every `<MotionTemplate template="...">` name, in alphabetical order. */
export const MOTION_TEMPLATE_NAMES = [
  "agenda",
  "comparison-split",
  "device-mockup",
  "end-card",
  "icon-array",
  "list-cascade",
  "logo-reveal",
  "lower-third",
  "metric-grid",
  "myth-fact",
  "photo-reveal",
  "process-flow",
  "quote-card",
  "section-wipe",
  "spotlight",
  "stat-burst",
  "stat-compare",
  "team-grid",
  "timeline-sweep",
  "title-reveal",
  "venn-overlap",
] as const;

/** A motion template name the click counter knows. */
export type MotionTemplateBeatName = (typeof MOTION_TEMPLATE_NAMES)[number];

/** One beat, two beats, or one beat per entry of the named list prop. */
export type MotionTemplateBeatRule =
  | { readonly kind: "one" }
  | { readonly kind: "two" }
  | { readonly kind: "list"; readonly prop: "events" | "items" | "steps" };

/** Each template's beat rule. */
export const MOTION_TEMPLATE_BEATS: Readonly<
  Record<MotionTemplateBeatName, MotionTemplateBeatRule>
> = {
  agenda: { kind: "one" },
  "comparison-split": { kind: "two" },
  "device-mockup": { kind: "one" },
  "end-card": { kind: "one" },
  "icon-array": { kind: "one" },
  "list-cascade": { kind: "list", prop: "items" },
  "logo-reveal": { kind: "one" },
  "lower-third": { kind: "one" },
  "metric-grid": { kind: "one" },
  "myth-fact": { kind: "two" },
  "photo-reveal": { kind: "one" },
  "process-flow": { kind: "list", prop: "steps" },
  "quote-card": { kind: "one" },
  "section-wipe": { kind: "one" },
  spotlight: { kind: "one" },
  "stat-burst": { kind: "one" },
  "stat-compare": { kind: "one" },
  "team-grid": { kind: "one" },
  "timeline-sweep": { kind: "list", prop: "events" },
  "title-reveal": { kind: "one" },
  "venn-overlap": { kind: "one" },
};
