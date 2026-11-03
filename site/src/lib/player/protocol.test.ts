import { describe, expect, it } from "vitest";
import { atEnd, atStart, command, type DeckState, parseDeckMessage } from "./protocol";

const state: DeckState = {
  slide: 2,
  slides: 5,
  beat: 1,
  beats: 2,
  lead: "Lead.",
  body: "Body.",
  settled: true,
  direction: "forward",
};

describe("parseDeckMessage", () => {
  it("reads ready, meta and state messages", () => {
    expect(parseDeckMessage({ type: "decks:ready" })).toEqual({ type: "decks:ready" });
    expect(
      parseDeckMessage({ type: "decks:meta", title: "Tides", slides: 5, slideTitles: ["a", 3] }),
    ).toEqual({ type: "decks:meta", title: "Tides", slides: 5, slideTitles: ["a", ""] });
    expect(parseDeckMessage({ type: "decks:state", ...state })).toEqual({
      type: "decks:state",
      ...state,
    });
  });

  it("retains optional request identifiers, including settled no-op replies", () => {
    expect(parseDeckMessage({ type: "decks:state", ...state, requestId: 7 })).toEqual({
      type: "decks:state",
      ...state,
      requestId: 7,
    });
    expect(parseDeckMessage({ type: "decks:state", ...state, requestId: "7" })).not.toHaveProperty(
      "requestId",
    );
    expect(parseDeckMessage({ type: "decks:state", ...state, requestId: -1 })).not.toHaveProperty(
      "requestId",
    );
  });

  it("reads iframe navigation, interaction, and explicit failures", () => {
    expect(parseDeckMessage({ type: "decks:navigate", cmd: "prevSlide" })).toEqual({
      type: "decks:navigate",
      cmd: "prevSlide",
    });
    expect(parseDeckMessage({ type: "decks:interaction" })).toEqual({ type: "decks:interaction" });
    expect(parseDeckMessage({ type: "decks:error", message: "Chart could not load." })).toEqual({
      type: "decks:error",
      message: "Chart could not load.",
    });
    expect(parseDeckMessage({ type: "decks:navigate", cmd: "reload" })).toBeNull();
    expect(parseDeckMessage({ type: "decks:error", message: 5 })).toBeNull();
  });

  it("fills missing card text and an unknown direction", () => {
    const { lead: _lead, body: _body, ...bare } = state;
    expect(parseDeckMessage({ type: "decks:state", ...bare, direction: "sideways" })).toMatchObject(
      { lead: "", body: "", direction: null },
    );
  });

  it("rejects other messages and malformed states", () => {
    expect(parseDeckMessage("decks:ready")).toBeNull();
    expect(parseDeckMessage({ type: "webpackOk" })).toBeNull();
    expect(parseDeckMessage({ type: "decks:state", ...state, slide: -1 })).toBeNull();
    expect(parseDeckMessage({ type: "decks:state", ...state, beat: 1.5 })).toBeNull();
    expect(parseDeckMessage({ type: "decks:meta", slides: 2 })).toBeNull();
  });
});

describe("commands", () => {
  it("builds the contract's command shapes", () => {
    expect(command.next()).toEqual({ type: "decks:cmd", cmd: "next" });
    expect(command.prevSlide()).toEqual({ type: "decks:cmd", cmd: "prevSlide" });
    expect(command.go(2)).toEqual({ type: "decks:cmd", cmd: "go", slide: 2, beat: 0 });
  });
});

describe("deck ends", () => {
  it("knows the first and the last beat", () => {
    expect(atEnd({ ...state, slide: 5, beat: 2 })).toBe(true);
    expect(atEnd({ ...state, slide: 5, beat: 1 })).toBe(false);
    expect(atEnd({ ...state, slide: 5, beat: 0, beats: 0 })).toBe(true);
    expect(atEnd({ ...state, slide: 4, beat: 2 })).toBe(false);
    expect(atStart({ ...state, slide: 1, beat: 0 })).toBe(true);
    expect(atStart(state)).toBe(false);
  });
});
