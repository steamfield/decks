import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Command, DeckState } from "../player/protocol";
import { createStageController, STAGE_TIMEOUT_MS, type StageController } from "./controller";

// Slide 3 has three beats, slides 5 and 8 two; the rest one.
const BEATS: Record<number, number> = { 3: 2, 5: 1, 8: 1 };
const SLIDES = 9;

/**
 * The deck's side of the contract. happy-dom loads no iframe page, so the frame's window is a
 * stand-in that records what the stage sends; `say` speaks as that window.
 */
function deck() {
  const sent: Command[] = [];
  const win = { postMessage: (message: Command) => sent.push(message) };
  const frame = document.createElement("iframe");
  document.body.append(frame);
  Object.defineProperty(frame, "contentWindow", { value: win, configurable: true });
  const say = (data: unknown, source: unknown = win) =>
    window.dispatchEvent(
      new MessageEvent("message", {
        data,
        origin: window.location.origin,
        source: source as Window,
      }),
    );
  const state = (patch: Partial<DeckState>) =>
    say({
      type: "decks:state",
      slide: 1,
      slides: SLIDES,
      beat: 0,
      beats: BEATS[patch.slide ?? 1] ?? 0,
      lead: "",
      body: "",
      settled: true,
      direction: null,
      ...patch,
    });
  return { frame, sent, say, state };
}

/**
 * A deck that answers every command it receives the way the real one does: it moves, then
 * reports the move settled with the command's requestId.
 */
function answeringDeck() {
  const d = deck();
  let slide = 1;
  let beat = 0;
  const beats = () => BEATS[slide] ?? 0;
  const win = {
    postMessage: (message: Command) => {
      d.sent.push(message);
      if (message.cmd === "go" || message.cmd === "show") {
        slide = message.slide;
        beat = message.beat;
      } else if (message.cmd === "next") {
        if (beat < beats()) beat += 1;
        else if (slide < SLIDES) [slide, beat] = [slide + 1, 0];
      } else if (message.cmd === "nextSlide" && slide < SLIDES) {
        [slide, beat] = [slide + 1, 0];
      }
      const at = { slide, beat };
      queueMicrotask(() =>
        d.say(
          {
            type: "decks:state",
            requestId: message.requestId,
            ...at,
            slides: SLIDES,
            beats: BEATS[at.slide] ?? 0,
            lead: "",
            body: "",
            settled: true,
            direction: "direction" in message ? (message.direction ?? null) : null,
          },
          win,
        ),
      );
    },
  };
  Object.defineProperty(d.frame, "contentWindow", { value: win, configurable: true });
  return { ...d, say: (data: unknown) => d.say(data, win) };
}

let stage: StageController | undefined;
const start = (frame: HTMLIFrameElement) => {
  stage = createStageController(frame);
  return stage;
};

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  stage?.dispose();
  stage = undefined;
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe("the stage controller", () => {
  it("holds commands until the deck is ready and sends only the newest", async () => {
    const d = deck();
    const s = start(d.frame);
    const first = s.show(2, 0);
    const second = s.go(4, 0, { direction: "forward" });
    expect(d.sent).toEqual([]);
    await expect(first).resolves.toEqual({ cancelled: true });

    d.say({ type: "decks:ready" });
    await expect(s.ready()).resolves.toBeUndefined();
    expect(d.sent).toEqual([
      { type: "decks:cmd", cmd: "go", slide: 4, beat: 0, direction: "forward", requestId: 2 },
    ]);
    d.state({ slide: 4, requestId: 2, direction: "forward" });
    await expect(second).resolves.toMatchObject({
      cancelled: false,
      state: { slide: 4, beat: 0, direction: "forward", requestId: 2 },
    });
  });

  it("resolves a superseded command as cancelled and ignores its late states", async () => {
    const d = deck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    const first = s.show(2, 0);
    const second = s.show(5, 0);
    await expect(first).resolves.toEqual({ cancelled: true });
    d.state({ slide: 2, requestId: 1 });
    d.state({ slide: 5, requestId: 2 });
    await expect(second).resolves.toMatchObject({ cancelled: false, state: { slide: 5 } });
    expect(d.sent).toEqual([
      { type: "decks:cmd", cmd: "show", slide: 2, beat: 0, requestId: 1 },
      { type: "decks:cmd", cmd: "show", slide: 5, beat: 0, requestId: 2 },
    ]);
  });

  it("waits for its own requestId settled, not other states or other windows", async () => {
    const d = deck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    const results: unknown[] = [];
    void s.go(6, 0).then((result) => results.push(result));
    d.state({ slide: 6 });
    d.state({ slide: 6, requestId: 99 });
    d.state({ slide: 6, requestId: 1, settled: false });
    d.say(
      { type: "decks:state", slide: 6, slides: 9, beat: 0, beats: 0, requestId: 1, settled: true },
      window,
    );
    await vi.advanceTimersByTimeAsync(0);
    expect(results).toEqual([]);
    d.state({ slide: 6, requestId: 1, lead: "Done." });
    await vi.advanceTimersByTimeAsync(0);
    expect(results).toEqual([
      { cancelled: false, state: expect.objectContaining({ slide: 6, lead: "Done." }) },
    ]);
  });

  it("rejects naming the command when the deck never settles it", async () => {
    const d = deck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    const move = s.show(4, 1);
    const outcome = expect(move).rejects.toThrow("The deck did not settle show 4.1 within 15 s");
    await vi.advanceTimersByTimeAsync(STAGE_TIMEOUT_MS - 1);
    d.state({ slide: 4, beat: 1, requestId: 1, settled: false });
    await vi.advanceTimersByTimeAsync(1);
    await outcome;
  });

  it("plays a range: beats on stepped slides, whole slides elsewhere, to the end of the last", async () => {
    const d = answeringDeck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    const done = s.play({ first: 2, last: 8, stepBeatsOn: [3, 8] }, { dwellMs: 500 });
    await vi.advanceTimersByTimeAsync(500 * 10);
    await expect(done).resolves.toMatchObject({ cancelled: false, state: { slide: 8, beat: 1 } });
    expect(d.sent.map(({ requestId: _, ...rest }) => rest)).toEqual([
      { type: "decks:cmd", cmd: "go", slide: 2, beat: 0, direction: "forward" },
      { type: "decks:cmd", cmd: "nextSlide" },
      { type: "decks:cmd", cmd: "next" },
      { type: "decks:cmd", cmd: "next" },
      { type: "decks:cmd", cmd: "nextSlide" },
      { type: "decks:cmd", cmd: "nextSlide" },
      { type: "decks:cmd", cmd: "nextSlide" },
      { type: "decks:cmd", cmd: "nextSlide" },
      { type: "decks:cmd", cmd: "nextSlide" },
      { type: "decks:cmd", cmd: "next" },
    ]);
    expect(d.sent.map(({ requestId }) => requestId)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("ends a play on the last slide's first beat when that slide is not stepped", async () => {
    const d = answeringDeck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    const done = s.play({ first: 7, last: 8, stepBeatsOn: [] }, { dwellMs: 0 });
    await vi.advanceTimersByTimeAsync(0);
    await expect(done).resolves.toMatchObject({ cancelled: false, state: { slide: 8, beat: 0 } });
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go", "nextSlide"]);
  });

  it("waits the dwell after each settle before the next step", async () => {
    const d = answeringDeck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    void s.play({ first: 4, last: 6, stepBeatsOn: [] }, { dwellMs: 1000 });
    await vi.advanceTimersByTimeAsync(999);
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go"]);
    await vi.advanceTimersByTimeAsync(1);
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go", "nextSlide"]);
  });

  it("stops a play superseded during its dwell and resolves it cancelled", async () => {
    const d = answeringDeck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    const played = s.play({ first: 2, last: 6, stepBeatsOn: [] }, { dwellMs: 1000 });
    await vi.advanceTimersByTimeAsync(1000);
    const shown = s.show(9, 0);
    await expect(played).resolves.toEqual({ cancelled: true });
    await expect(shown).resolves.toMatchObject({ cancelled: false, state: { slide: 9 } });
    await vi.advanceTimersByTimeAsync(5000);
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go", "nextSlide", "show"]);
  });

  it("cancel resolves the pending command and sends nothing", async () => {
    const d = deck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    const move = s.go(3, 0);
    s.cancel();
    await expect(move).resolves.toEqual({ cancelled: true });
    expect(d.sent).toHaveLength(1);
  });

  it("rejects the pending command with the deck's error", async () => {
    const d = deck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    const move = s.go(3, 0);
    d.say({ type: "decks:error", message: "settle failed" });
    await expect(move).rejects.toThrow("The deck failed go 3.0: settle failed");
  });

  it("dispose cancels the pending command, rejects ready, and stops listening", async () => {
    const d = deck();
    const s = start(d.frame);
    const move = s.show(2, 0);
    s.dispose();
    await expect(move).resolves.toEqual({ cancelled: true });
    await expect(s.ready()).rejects.toThrow("disposed before the deck was ready");
    d.say({ type: "decks:ready" });
    expect(d.sent).toEqual([]);
    await expect(s.show(3, 0)).rejects.toThrow("disposed");
  });
});
