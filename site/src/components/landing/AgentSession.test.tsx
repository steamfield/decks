import { screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { turns } from "../../data/agent-session";
import { startFakeAnalytics } from "../../lib/analytics.test-support";
import { Events } from "../../lib/events";
import { FINISHED_HOLD_MS, STILL_TRANSCRIPT } from "./AgentSession";
import {
  advance,
  leads,
  mount,
  playing,
  prompt,
  renderSession,
  setReduced,
  shows,
  stage,
  stageLabels,
  until,
  withSessionEnvironment,
} from "./AgentSession.test-support";

withSessionEnvironment();

// The real analytics module, started once (it accepts one init) against a fake SDK. Each test
// reads only the events captured after it began.
let sdk: Awaited<ReturnType<typeof startFakeAnalytics>>;
let captured: () => unknown[][];
beforeAll(async () => {
  sdk = await startFakeAnalytics();
});
beforeEach(() => {
  const seen = sdk.calls.length;
  captured = () => sdk.calls.slice(seen);
});

describe("AgentSession", () => {
  it("holds each prompt's slide, and plays the result when the lead line lands", async () => {
    const { deck: d } = await mount();
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
    expect(stage(stageLabels[1] ?? "")).toBeInTheDocument();
  });

  it("keeps the transcript on the lead line until the deck has played the result", async () => {
    const { deck: d } = await mount();
    d.hold();
    await until(() => leads() === 1);
    // Inside the deck's 15 s budget, after which the transcript carries on without it.
    await advance(10_000);
    expect(playing(prompt(1))).toBeNull();
    await d.settleAll();
    await until(() => playing(prompt(1)) !== null);
  });

  it("holds the finished deck for 4 s, then loops into turn 1's hold", async () => {
    const { deck: d } = await mount();
    await until(() => leads() === turns.length);
    // The last result is a go and a step through each of the reel's two further beats.
    const sinceLastShow = () => d.sent.slice(d.sent.findLastIndex((m) => m.cmd === "show") + 1);
    await until(() => sinceLastShow().length === 3);
    const played = d.sent.length;
    const settledAt = Date.now();
    await until(
      () => playing(prompt(4)) === null,
      () => expect(d.sent).toHaveLength(played),
    );
    const held = Date.now() - settledAt;
    expect(held).toBeGreaterThanOrEqual(FINISHED_HOLD_MS);
    expect(held).toBeLessThan(FINISHED_HOLD_MS + 1000);
    expect(shows(d.sent.slice(played))).toEqual([[turns[0]?.hold.slide, turns[0]?.hold.beat]]);
    await until(() => leads() === 1);
  });

  it("records each turn reached once and the completion once per page view", async () => {
    await mount();
    await until(() => leads() === turns.length);
    // Into the second loop, whose turn 1 is not reached a second time.
    await until(() => leads() === 0);
    await advance(1000);
    expect(captured()).toEqual([
      ...turns.map((_, k) => ["capture", Events.agentDemoTurnReached, { turn: k + 1 }]),
      ["capture", Events.agentDemoCompleted, undefined],
    ]);
  });

  it("sends the deck nothing under reduced motion and shows the finished deck and transcript", async () => {
    setReduced(true);
    renderSession();
    await advance(10_000);
    expect(document.querySelector("iframe")).toBeNull();
    // One picture: the browser takes the finished poster's sources under reduced motion.
    const finished = stage(stageLabels.at(-1) ?? "");
    const reduced = [...finished.querySelectorAll("source")].filter(
      (source) => source.getAttribute("media") === "(prefers-reduced-motion: reduce)",
    );
    expect(reduced.map((source) => source.getAttribute("srcset"))).toEqual([
      expect.stringContaining("/posters/agent-hero-finished-1920.avif 1920w"),
      expect.stringContaining("/posters/agent-hero-finished-1920.webp 1920w"),
    ]);
    expect(finished.querySelectorAll("img")).toHaveLength(1);
    const still = screen.getByRole("group", { name: STILL_TRANSCRIPT });
    for (const turn of [0, 1, 2, 3, 4]) expect(within(still).getByText(prompt(turn))).toBeVisible();
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
  });
});
