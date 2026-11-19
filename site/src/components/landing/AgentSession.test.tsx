import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { agentSession, turns } from "../../data/agent-session";
import type { Command } from "../../lib/player/protocol";
import { AgentSession } from "./AgentSession";

const poster = (base: string) => ({ base, width: 1920, height: 1080 });
const posters = {
  start: poster("/posters/agent-hero"),
  finished: poster("/posters/agent-hero-finished"),
};

// The demo deck's step counts: the trend has three steps, the reel and the scoreboard two each.
const BEATS: Record<number, number> = { 3: 2, 7: 2, 8: 2 };
const SLIDES = 9;

/**
 * The deck's side of the contract. happy-dom loads no iframe page, so the frame's window is a
 * stand-in that records each command. With `answer` on it moves and reports each one settled,
 * as the built deck does; with it off, commands wait for `settleAll`.
 */
function deck() {
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

/** Stubs matchMedia: motion allowed or reduced, at desktop width. */
function media({ reduced }: { reduced: boolean }) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("reduce") ? reduced : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms));

/** The playing transcript (the still one, for reduced motion, sits beside it). */
function live() {
  const transcript = document.querySelector<HTMLElement>(".agent-session-live");
  if (!transcript) throw new Error("AgentSession rendered no live transcript");
  return transcript;
}
const playing = (text: string) => within(live()).queryByText(text);

/** The lead lines on screen so far. */
const leads = () => live().querySelectorAll('[data-part="lead"]').length;

/**
 * Moves the clock 50 ms at a time until `done` holds, running `meanwhile` at every tick before
 * it does, so a test can assert what stays true until then.
 */
async function until(done: () => boolean, meanwhile: () => void = () => {}, limit = 60_000) {
  for (let t = 0; t < limit; t += 50) {
    if (done()) return;
    meanwhile();
    await advance(50);
  }
  throw new Error(`still waiting after ${limit} ms`);
}

const prompt = (turn: number) => {
  const step = agentSession.steps.filter((s) => s.kind === "user")[turn];
  if (step?.kind !== "user") throw new Error(`no prompt ${turn}`);
  return step.text;
};

const shows = (sent: Command[]) =>
  sent.filter((m) => m.cmd === "show").map((m) => ("slide" in m ? [m.slide, m.beat] : []));

async function mount() {
  render(<AgentSession src="/d/agent-hero/index.html" href="/d/agent-hero/" posters={posters} />);
  // The deck stage mounts once the session hydrates.
  await advance(0);
  const d = deck();
  d.ready();
  return d;
}

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
  media({ reduced: false });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("AgentSession", () => {
  it("holds each prompt's slide, and plays the result when the lead line lands", async () => {
    const d = await mount();
    expect(shows(d.sent)).toEqual([[1, 0]]);
    // Turn 1's prompt and tool calls run on the empty first slide.
    await until(
      () => leads() === 1,
      () => expect(d.sent.map((m) => m.cmd)).toEqual(["show"]),
    );
    expect(d.sent.at(-1)).toMatchObject({ cmd: "go", slide: 2, beat: 0, direction: "forward" });
    // The whole result plays before the next prompt asks for its hold.
    await until(() => playing(prompt(1)) !== null);
    const turn2 = d.sent.findIndex((m) => m.cmd === "show" && m.slide === turns[1]?.hold.slide);
    const result = d.sent.slice(1, turn2);
    expect(result.map((m) => ("slide" in m ? `${m.cmd} ${m.slide}` : m.cmd))).toEqual([
      "go 2",
      "nextSlide",
      "next",
      "next",
      "nextSlide",
      "nextSlide",
      "nextSlide",
    ]);
  });

  it("keeps the transcript on the lead line until the deck has played the result", async () => {
    const d = await mount();
    d.hold();
    await until(() => leads() === 1);
    // Inside the deck's 15 s budget, after which the transcript carries on without it.
    await advance(10_000);
    expect(playing(prompt(1))).toBeNull();
    await d.settleAll();
    await until(() => playing(prompt(1)) !== null);
  });

  it("stays paused when the deck finishes after the viewer pressed Pause", async () => {
    const d = await mount();
    d.hold();
    await until(() => leads() === 1);
    fireEvent.click(screen.getByRole("button", { name: "Pause" }));
    await d.settleAll();
    await advance(30_000);
    expect(playing(prompt(1))).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Play" }));
    await until(() => playing(prompt(1)) !== null);
  });

  it("jumps to a step: cancels the deck, holds the target's slide and skips the turns between", async () => {
    const d = await mount();
    await advance(1000);
    fireEvent.click(screen.getByRole("button", { name: "Check" }));
    expect(shows(d.sent)).toEqual([
      [1, 0],
      [turns[3]?.hold.slide, turns[3]?.hold.beat],
    ]);
    expect(screen.getByRole("button", { name: "Check" })).toHaveAttribute("aria-current", "step");
    await until(() => playing(prompt(3)) !== null);
    expect(shows(d.sent)).toHaveLength(2);
    // The next command is turn 4's result, after its tool calls.
    const jumped = d.sent.length;
    await until(() => d.sent.length > jumped);
    expect(d.sent.slice(jumped)).toEqual([
      expect.objectContaining({ cmd: "go", slide: turns[3]?.result.first, direction: "forward" }),
    ]);
  });

  it("sends the deck nothing under reduced motion and shows the finished deck and transcript", async () => {
    media({ reduced: true });
    render(<AgentSession src="/d/agent-hero/index.html" href="/d/agent-hero/" posters={posters} />);
    await advance(10_000);
    expect(document.querySelector("iframe")).toBeNull();
    // landing.css shows the still views under the same media query; a browser test checks that.
    const stage = screen.getByRole("img", { name: /^The finished build-time talk/ });
    expect(stage.querySelector("img")).toHaveAttribute(
      "src",
      "/posters/agent-hero-finished-1280.webp",
    );
    const still = document.querySelector<HTMLElement>(
      '.agent-session-still[data-part="agent-demo"]',
    );
    if (!still) throw new Error("AgentSession rendered no still transcript");
    for (const turn of [0, 1, 2, 3, 4]) expect(within(still).getByText(prompt(turn))).toBeVisible();
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
  });
});
