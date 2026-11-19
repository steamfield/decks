import { describe, expect, it, vi } from "vitest";
import { answeringDeck, deck, withStage } from "./controller.test-support";

const start = withStage();

describe("pausing the stage controller", () => {
  it("pause holds a play's dwell and sends no step; resume runs the time the dwell had left", async () => {
    const d = answeringDeck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    const done = s.play({ first: 4, last: 5, stepBeatsOn: [] }, { dwellMs: 1000 });
    await vi.advanceTimersByTimeAsync(400);
    s.pause();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go"]);
    s.resume();
    await vi.advanceTimersByTimeAsync(599);
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go"]);
    await vi.advanceTimersByTimeAsync(1);
    await expect(done).resolves.toMatchObject({ cancelled: false, state: { slide: 5 } });
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go", "nextSlide"]);
  });

  it("lets a step sent before the pause settle, then holds the next one", async () => {
    const d = deck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    const results: unknown[] = [];
    void s
      .play({ first: 4, last: 6, stepBeatsOn: [] }, { dwellMs: 0 })
      .then((r) => results.push(r));
    d.state({ slide: 4, requestId: 1 });
    await vi.advanceTimersByTimeAsync(0);
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go", "nextSlide"]);
    s.pause();
    d.state({ slide: 5, requestId: 2 });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go", "nextSlide"]);
    // A show while paused goes at once, and cancels the held play.
    void s.show(1, 0);
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go", "nextSlide", "show"]);
    await vi.advanceTimersByTimeAsync(0);
    expect(results).toEqual([{ cancelled: true }]);
  });

  it("a play started while paused holds after its first move until resumed", async () => {
    const d = answeringDeck();
    const s = start(d.frame);
    d.say({ type: "decks:ready" });
    s.pause();
    const done = s.play({ first: 2, last: 3, stepBeatsOn: [] }, { dwellMs: 500 });
    await vi.advanceTimersByTimeAsync(5000);
    expect(d.sent.map(({ cmd }) => cmd)).toEqual(["go"]);
    s.resume();
    await vi.advanceTimersByTimeAsync(500);
    await expect(done).resolves.toMatchObject({ cancelled: false, state: { slide: 3 } });
  });
});
