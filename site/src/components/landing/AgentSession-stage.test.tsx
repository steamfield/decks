import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STAGE_TIMEOUT_MS } from "../../lib/stage/controller";
import {
  advance,
  leads,
  mount,
  playing,
  prompt,
  stage,
  stageLabels,
  until,
  withSessionEnvironment,
} from "./AgentSession.test-support";

withSessionEnvironment();

// The session reports a failed deck on the console, once; the tests read what it reported.
let reported: unknown[][] = [];
beforeEach(() => {
  reported = [];
  vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    reported.push(args);
  });
});
afterEach(() => {
  vi.restoreAllMocks();
});

const messages = () =>
  reported.map(([, error]) => (error instanceof Error ? error.message : error));

/** How long the transcript takes from a turn's lead line to the next prompt. */
async function leadToPrompt(turn: number) {
  await until(() => leads() === turn + 1);
  const leadAt = Date.now();
  await until(() => playing(prompt(turn + 1)) !== null);
  return Date.now() - leadAt;
}

describe("AgentSession's stage", () => {
  it("gives up on a deck that never boots once, then runs every turn without waiting for it", async () => {
    const { deck: d } = await mount({ ready: false });
    // Turn 1 waits the deck's whole budget, once.
    expect(await leadToPrompt(0)).toBeGreaterThanOrEqual(STAGE_TIMEOUT_MS);
    expect(messages()).toEqual([
      `The deck did not settle go 2.0 within ${STAGE_TIMEOUT_MS / 1000} s`,
    ]);
    for (const turn of [1, 2, 3]) expect(await leadToPrompt(turn)).toBeLessThan(5000);
    expect(d.sent).toEqual([]);
    // The start poster is still what shows, and the stage's name says so.
    expect(stage(stageLabels[0] ?? "")).toBeInTheDocument();
    expect(reported).toHaveLength(1);
  });

  it("carries on when the deck reports an error mid-result, and stops driving it", async () => {
    const { deck: d } = await mount();
    d.hold();
    await until(() => leads() === 1);
    d.say({ type: "decks:error", message: "slide 2 failed to load" });
    const failedAt = d.sent.length;
    await until(
      () => playing(prompt(1)) !== null,
      () => {},
      5000,
    );
    for (const turn of [1, 2]) expect(await leadToPrompt(turn)).toBeLessThan(5000);
    expect(d.sent).toHaveLength(failedAt);
    expect(messages()).toEqual(["The deck failed go 2.0: slide 2 failed to load"]);
    expect(stage(stageLabels[0] ?? "")).toBeInTheDocument();
  });

  it("unmounting mid-result sends the deck nothing more and reports nothing", async () => {
    const { deck: d, unmount } = await mount();
    await until(() => leads() === 1);
    await until(() => d.sent.length === 3);
    unmount();
    await advance(60_000);
    expect(d.sent.map((m) => m.cmd)).toEqual(["show", "go", "nextSlide"]);
    expect(reported).toEqual([]);
  });
});
