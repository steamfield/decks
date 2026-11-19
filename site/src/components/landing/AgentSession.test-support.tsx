/**
 * Shared setup for the AgentSession tests: the deck's side of the embed contract as a stand-in
 * window, a matchMedia stand-in the tests can flip, the session's clock (fake timers) and
 * queries for what the transcript and the stage show.
 */
import { act, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { site } from "../../config";
import { agentSession } from "../../data/agent-session";
import type { Command } from "../../lib/player/protocol";
import { AgentSession, LIVE_TRANSCRIPT } from "./AgentSession";

const poster = (base: string) => ({ base, width: 1920, height: 1080 });
export const posters = {
  start: poster("/posters/agent-hero"),
  finished: poster("/posters/agent-hero-finished"),
};

// The demo deck's step counts: the trend has three steps, the reel and the scoreboard two each.
const BEATS: Record<number, number> = { 3: 2, 7: 2, 8: 2 };
const SLIDES = 9;

/** The stage's accessible names, in build order. */
export const stageLabels = site.agentSession.stageLabels;

/**
 * The deck's side of the contract. happy-dom loads no iframe page, so the frame's window is a
 * stand-in that records each command. With `answer` on it moves and reports each one settled,
 * as the built deck does; with it off, commands wait for `settleAll`.
 */
export function deck() {
  const sent: Command[] = [];
  const held: Command[] = [];
  let answer = true;
  let slide = 1;
  let beat = 0;
  const win = {
    postMessage: (message: Command) => {
      sent.push(message);
      if (answer) queueMicrotask(() => settle(message));
      else held.push(message);
    },
  };
  const say = (data: unknown) =>
    act(() => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data,
          origin: window.location.origin,
          source: win as unknown as Window,
        }),
      );
    });
  function settle(message: Command) {
    if (message.cmd === "go" || message.cmd === "show")
      [slide, beat] = [message.slide, message.beat];
    else if (message.cmd === "next") {
      if (beat < (BEATS[slide] ?? 0)) beat += 1;
      else [slide, beat] = [slide + 1, 0];
    } else if (message.cmd === "nextSlide") [slide, beat] = [slide + 1, 0];
    say({
      type: "decks:state",
      requestId: message.requestId,
      slide,
      slides: SLIDES,
      beat,
      beats: BEATS[slide] ?? 0,
      lead: "",
      body: "",
      settled: true,
      direction: null,
    });
  }
  const frame = document.querySelector("iframe");
  if (!frame) throw new Error("AgentSession mounted no deck frame");
  Object.defineProperty(frame, "contentWindow", { value: win, configurable: true });
  return {
    sent,
    say,
    ready: () => say({ type: "decks:ready" }),
    hold: () => {
      answer = false;
    },
    settleAll: async () => {
      answer = true;
      await act(async () => {
        for (const message of held.splice(0)) settle(message);
      });
    },
  };
}

/** matchMedia's stand-in: motion allowed or reduced, desktop or phone width, flipped live. */
function media() {
  const matches = { reduce: false, "max-width": false };
  const listeners = new Set<{ query: string; change: () => void }>();
  const keyOf = (query: string) => (query.includes("reduce") ? "reduce" : "max-width");
  vi.stubGlobal("matchMedia", (query: string) => ({
    get matches() {
      return matches[keyOf(query)];
    },
    media: query,
    addEventListener: (_: string, change: () => void) => listeners.add({ query, change }),
    removeEventListener: (_: string, change: () => void) => {
      for (const entry of listeners) if (entry.change === change) listeners.delete(entry);
    },
  }));
  return (key: keyof typeof matches, value: boolean) =>
    act(() => {
      matches[key] = value;
      for (const { query, change } of listeners) if (keyOf(query) === key) change();
    });
}

let setMedia: ReturnType<typeof media> = () => {};

/** Sets reduced motion before a render, or flips it after. */
export const setReduced = (reduced: boolean) => setMedia("reduce", reduced);
/** Moves the session to phone width (or back), which swaps its script. */
export const setPhone = (phone: boolean) => setMedia("max-width", phone);

/** Fake timers and the media stand-in for every test in the calling file. */
export function withSessionEnvironment() {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        "setTimeout",
        "clearTimeout",
        "requestAnimationFrame",
        "cancelAnimationFrame",
        "performance",
        "Date",
      ],
    });
    vi.stubGlobal("IntersectionObserver", undefined);
    setMedia = media();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
}

export const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

/** The playing transcript (the still one, for reduced motion, sits beside it). */
const live = () => screen.getByRole("group", { name: LIVE_TRANSCRIPT });
export const playing = (text: string) => within(live()).queryByText(text);

/** The lead lines on screen so far: every turn's lead is "Done.". */
export const leads = () => within(live()).queryAllByText("Done.").length;

/** The stage, by its accessible name. */
export const stage = (name: string | RegExp) => screen.getByRole("img", { name });

/**
 * Moves the clock 50 ms at a time until `done` holds, running `meanwhile` at every tick before
 * it does, so a test can assert what stays true until then.
 */
export async function until(done: () => boolean, meanwhile: () => void = () => {}, limit = 60_000) {
  for (let t = 0; t < limit; t += 50) {
    if (done()) return;
    meanwhile();
    await advance(50);
  }
  throw new Error(`still waiting after ${limit} ms`);
}

export const prompt = (turn: number) => {
  const step = agentSession.steps.filter((s) => s.kind === "user")[turn];
  if (step?.kind !== "user") throw new Error(`no prompt ${turn}`);
  return step.text;
};

export const shows = (sent: Command[]) =>
  sent.filter((m) => m.cmd === "show").map((m) => ("slide" in m ? [m.slide, m.beat] : []));

export const renderSession = () =>
  render(<AgentSession src="/d/agent-hero/index.html" href="/d/agent-hero/" posters={posters} />);

/** Renders the session and, once it has hydrated and mounted its stage, the stand-in deck. */
export async function mount({ ready = true } = {}) {
  const view = renderSession();
  await advance(0);
  const d = deck();
  if (ready) d.ready();
  return { ...view, deck: d };
}
