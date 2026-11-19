/**
 * Shared setup for the stage controller tests: the deck's side of the embed contract as a
 * stand-in iframe window, and a controller per test that is disposed after it.
 */
import { afterEach, beforeEach, vi } from "vitest";
import type { Command, DeckState } from "../player/protocol";
import { createStageController, type StageController } from "./controller";

// Slide 3 has three beats, slides 5 and 8 two; the rest one.
const BEATS: Record<number, number> = { 3: 2, 5: 1, 8: 1 };
const SLIDES = 9;

/**
 * The deck's side of the contract. happy-dom loads no iframe page, so the frame's window is a
 * stand-in that records what the stage sends; `say` speaks as that window.
 */
export function deck() {
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
export function answeringDeck() {
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

/**
 * Fake timers for every test in the calling file, and `start`, which creates the test's
 * controller and disposes it (and the frame) after the test.
 */
export function withStage() {
  let stage: StageController | undefined;
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    stage?.dispose();
    stage = undefined;
    document.body.replaceChildren();
    vi.useRealTimers();
  });
  return (frame: HTMLIFrameElement) => {
    stage = createStageController(frame);
    return stage;
  };
}
