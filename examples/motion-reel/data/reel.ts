// Every figure in the reel is counted from this repository, never typed from memory.
// Counted 2026-11-18 at @steamfield/decks 1.2.0; the commands are in ../data-sources.md.

/** The `template` names `MotionTemplate` accepts: the table in docs/guide/motion-templates.md. */
export const TEMPLATES = [
  "title-reveal",
  "lower-third",
  "stat-burst",
  "stat-compare",
  "metric-grid",
  "list-cascade",
  "quote-card",
  "section-wipe",
  "agenda",
  "end-card",
  "timeline-sweep",
  "process-flow",
  "comparison-split",
  "myth-fact",
  "spotlight",
  "device-mockup",
  "photo-reveal",
  "logo-reveal",
  "icon-array",
  "team-grid",
  "venn-overlap",
] as const;

/** Slide transition presets: the table under "Slide transitions" in docs/guide/motion.md. */
export const TRANSITIONS = [
  "fade",
  "push",
  "zoom",
  "rise",
  "cover",
  "reveal",
  "wipe",
  "iris",
  "blur",
  "flip",
  "cube",
  "cut",
  "story",
] as const;

/** Step components: the headings under "Step components" in docs/guide/motion.md. */
export const STEP_COMPONENTS = [
  "Step",
  "Steps",
  "Stagger",
  "TextReveal",
  "Highlight",
  "CountUp",
  "Draw",
  "Mark",
] as const;

/** Where one slide can render: `RenderContext` in packages/runtime/src/hooks.ts. */
export const RENDER_CONTEXTS = ["slide", "presenter", "preview", "overview", "print"] as const;

/** The scoreboard on slide 08-package. */
export const PACKAGE_COUNTS = [
  { value: STEP_COMPONENTS.length, label: "step components" },
  { value: TRANSITIONS.length, label: "slide transitions" },
  { value: RENDER_CONTEXTS.length, label: "views of every slide" },
];

/** The outputs named on slide 07-views: docs/guide/presenting.md and docs/guide/cli.md. */
export const OUTPUTS = ["Presenter.", "Overview.", "Print.", "PDF."] as const;

/** The install line: README.md and docs/guide/getting-started.md. */
export const INSTALL = "bun add @steamfield/decks react react-dom";

/** `homepage` in packages/decks/package.json. */
export const SITE = "https://decks.steamfield.io";
