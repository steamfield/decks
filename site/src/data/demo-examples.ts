// The player data for one guide demo: its deck's recording, held to the demo's slides and
// starting at their last step, so the poster, the live deck and the end of a replay match.
// Kept apart from guide-demos.ts, which scripts/demo.mjs imports under plain Node.
import type { Example } from "../lib/player/example";
import { entryFor, loadExample } from "./examples";
import { type DemoRef, demoPoster, resolveDemo } from "./guide-demos";

export type DemoPlayer = { example: Example; range: { first: number; last: number } };

export function demoPlayer(ref: DemoRef): DemoPlayer {
  const entry = entryFor(ref.deck);
  if (entry?.listed !== false)
    throw new Error(
      `demo="${ref.deck}/…": add ${ref.deck} to src/data/examples.json with "listed": false`,
    );
  const deck = loadExample(entry);
  const { first, last } = resolveDemo(ref);
  const states = deck.states.filter((state) => state.slide >= first && state.slide <= last);
  if (!states.some((state) => state.slide === last))
    throw new Error(
      `demo="${ref.deck}/${ref.last}": the ${ref.deck} recording has no slide ${last}; run node scripts/demo.mjs --only ${ref.deck}`,
    );
  const base = demoPoster(ref);
  const title = deck.slideTitles[first - 1] ?? ref.first;
  return {
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
