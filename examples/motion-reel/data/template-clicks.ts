// How many clicks each motion template takes, counted 2026-11-18 at @steamfield/decks 1.2.0
// from the "Clicks" section of docs/guide/motion-templates.md: "Most templates use one click,
// at `at`. `list-cascade`, `timeline-sweep` and `process-flow` take one click per item, from
// `at`; `comparison-split` and `myth-fact` take two". See ../data-sources.md, slide 05-one-click.
import { TEMPLATES } from "./reel";

type Template = (typeof TEMPLATES)[number];

/** Named in the guide as taking one click per item. */
const PER_ITEM: readonly Template[] = ["list-cascade", "timeline-sweep", "process-flow"];
/** Named in the guide as taking two clicks. */
const TWO: readonly Template[] = ["comparison-split", "myth-fact"];

const oneClick = TEMPLATES.filter((name) => !PER_ITEM.includes(name) && !TWO.includes(name));

/** One row per group, largest first. Every template is in exactly one group. */
export const TEMPLATE_CLICKS = [
  { group: "One click", templates: oneClick.length },
  { group: "One per item", templates: PER_ITEM.length },
  { group: "Two clicks", templates: TWO.length },
];

/** The finding, built from the counts so the headline cannot drift from the bars. */
export const ONE_CLICK_HEADLINE = `${oneClick.length} of ${TEMPLATES.length} take one click.`;

export const TEMPLATE_CLICKS_SOURCE = "Templates by clicks taken · docs/guide/motion-templates.md";
