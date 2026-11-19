// How many clicks each motion template takes, counted 2026-11-19 from `MOTION_TEMPLATE_BEATS`
// in packages/core/src/motion-template-beats.ts, the table the click counter and the templates
// both read: a `list` template takes one click per item, a `two` template two clicks, and a
// `one` template one. See ../data-sources.md, slide 05-one-click.
import { TEMPLATES } from "./reel";

type Template = (typeof TEMPLATES)[number];

/** `kind: "list"` in the table: one click per item. */
const PER_ITEM: readonly Template[] = [
  "list-cascade",
  "timeline-sweep",
  "process-flow",
  "word-swap",
  "donut-build",
];
/** `kind: "two"` in the table. */
const TWO: readonly Template[] = ["comparison-split", "myth-fact", "bar-board"];

const oneClick = TEMPLATES.filter((name) => !PER_ITEM.includes(name) && !TWO.includes(name));

/** One row per group, largest first, as `bar-board` requires. Every template is in exactly one. */
export const TEMPLATE_CLICKS = [
  { label: "One click", value: oneClick.length },
  { label: "One per item", value: PER_ITEM.length },
  { label: "Two clicks", value: TWO.length },
];

/** The finding, built from the counts so the headline cannot drift from the bars. */
export const ONE_CLICK_HEADLINE = `${oneClick.length} of ${TEMPLATES.length} take one click.`;

export const TEMPLATE_CLICKS_SOURCE =
  "Templates by clicks · core/src/motion-template-beats.ts";
