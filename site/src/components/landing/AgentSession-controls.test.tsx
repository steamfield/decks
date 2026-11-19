import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { turns } from "../../data/agent-session";
import {
  advance,
  leads,
  mount,
  playing,
  prompt,
  setPhone,
  shows,
  until,
  withSessionEnvironment,
} from "./AgentSession.test-support";

withSessionEnvironment();

const press = (name: string) => fireEvent.click(screen.getByRole("button", { name }));

describe("AgentSession controls", () => {
  it("stays paused when the deck finishes after the viewer pressed Pause", async () => {
    const { deck: d } = await mount();
    d.hold();
    await until(() => leads() === 1);
    press("Pause");
    await d.settleAll();
    await advance(30_000);
    expect(playing(prompt(1))).toBeNull();
    press("Play");
    await until(() => playing(prompt(1)) !== null);
  });

  it("Pause during a result stops the deck stepping, and Play steps on from there", async () => {
    const { deck: d } = await mount();
    await until(() => leads() === 1);
    // Turn 1's result is a go and then a step every 1.5 s; pause after the second step.
    await until(() => d.sent.length === 3);
    press("Pause");
    await advance(30_000);
    expect(d.sent.map((m) => m.cmd)).toEqual(["show", "go", "nextSlide"]);
    expect(playing(prompt(1))).toBeNull();
    press("Play");
    await until(() => d.sent.length === 4);
    await until(() => playing(prompt(1)) !== null);
  });

  it("jumps to a step: cancels the deck, holds the target's slide and skips the turns between", async () => {
    const { deck: d } = await mount();
    await advance(1000);
    press("Check");
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

  it("Replay mid-result stops the result and starts over on turn 1's hold", async () => {
    const { deck: d } = await mount();
    await until(() => leads() === 1);
    await until(() => d.sent.length === 3);
    press("Replay");
    const replayed = d.sent.length;
    expect(shows(d.sent.slice(replayed - 1))).toEqual([
      [turns[0]?.hold.slide, turns[0]?.hold.beat],
    ]);
    // Nothing more of the old result: the next command is turn 1's result again.
    await until(() => d.sent.length > replayed);
    expect(d.sent.slice(replayed)).toEqual([
      expect.objectContaining({ cmd: "go", slide: turns[0]?.result.first }),
    ]);
  });

  it("Pause during the finished hold keeps the finished session until Play starts it over", async () => {
    const { deck: d } = await mount();
    await until(() => leads() === turns.length);
    const sinceLastShow = () => d.sent.slice(d.sent.findLastIndex((m) => m.cmd === "show") + 1);
    await until(() => sinceLastShow().length === 3);
    await advance(1000);
    press("Pause");
    await advance(30_000);
    expect(playing(prompt(4))).not.toBeNull();
    press("Play");
    await until(() => playing(prompt(4)) === null);
    expect(shows(d.sent).at(-1)).toEqual([turns[0]?.hold.slide, turns[0]?.hold.beat]);
  });

  it("Play resumes a transcript whose waiting result a new script cancelled", async () => {
    const { deck: d } = await mount();
    d.hold();
    await until(() => leads() === 1);
    // The phone's script starts over and asks for turn 1's hold, which cancels the result.
    setPhone(true);
    await advance(0);
    press("Pause");
    press("Play");
    await d.settleAll();
    await until(() => playing(prompt(1)) !== null);
  });
});
