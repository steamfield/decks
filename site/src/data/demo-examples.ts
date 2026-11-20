// The player data for one guide demo: its deck's recording, held to the demo's slides and
// starting at their last step, so the poster, the live deck and the end of a replay match. A reel
// is the whole deck from its gallery start step.
// Kept apart from guide-demos.ts, which scripts/demo.mjs imports under plain Node.
import type { Example } from "../lib/player/example";
import { entryFor, loadExample } from "./examples";
import { type DemoRef, demoPoster, type RangeRef, type ReelRef, resolveDemo } from "./guide-demos";

export type ReelPlayer = { kind: "reel"; example: Example };
export type RangePlayer = {
  kind: "range";
  example: Example;
  range: { first: number; last: number };
};
export type DemoPlayer = ReelPlayer | RangePlayer;

export function demoPlayer(ref: RangeRef): RangePlayer;
export function demoPlayer(ref: ReelRef): ReelPlayer;
export function demoPlayer(ref: DemoRef): DemoPlayer;
export function demoPlayer(ref: DemoRef): DemoPlayer {
  const entry = entryFor(ref.deck);
  if (!entry)
    throw new Error(`demo="${ref.deck}…": ${ref.deck} is not registered in src/data/examples.json`);
  // A reel may play any registered deck; a range demo's deck stays out of the gallery.
  if (ref.kind === "range" && entry.listed !== false)
    throw new Error(
      `demo="${ref.deck}/…": add ${ref.deck} to src/data/examples.json with "listed": false`,
    );
  const deck = loadExample(entry);
  // A reel keeps the deck's own start step and gallery poster; the page needs neither its loop,
  // its run nor its edits, which would only ride along in the player's data attribute.
  if (ref.kind === "reel")
    return { kind: "reel", example: { ...deck, loop: null, run: null, edits: null } };
  const { first, last } = resolveDemo(ref);
  const states = deck.states.filter((state) => state.slide >= first && state.slide <= last);
  if (!states.some((state) => state.slide === last))
    throw new Error(
      `demo="${ref.deck}/${ref.last}": the ${ref.deck} recording has no slide ${last}; run node scripts/demo.mjs --only ${ref.deck}`,
    );
  const base = demoPoster(ref);
  const title = deck.slideTitles[first - 1] ?? ref.first;
  return {
    kind: "range",
    range: { first, last },
    example: {
      ...deck,
      title: `${title} demo`,
      startSlide: last,
      startBeat: Math.max(0, ...states.filter((s) => s.slide === last).map((s) => s.beats)),
      states,
      poster: base ? { base, width: 1920, height: 1080 } : null,
      loop: null,
      run: null,
      edits: null,
    },
  };
}
