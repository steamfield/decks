import { describe, expect, it } from "vitest";
import { type DeckView, formatHash, parseLocation } from "./location";

describe("formatHash", () => {
  it("formats play as #/5 and omits click 0", () => {
    expect(formatHash({ view: "play", slide: 5, click: 0 })).toBe("#/5");
  });

  it("formats play with clicks as #/5?clicks=2", () => {
    expect(formatHash({ view: "play", slide: 5, click: 2 })).toBe("#/5?clicks=2");
  });

  it("formats presenter as #/presenter/5 and omits click 0", () => {
    expect(formatHash({ view: "presenter", slide: 5, click: 0 })).toBe("#/presenter/5");
  });

  it("formats presenter with clicks as #/presenter/5?clicks=2", () => {
    expect(formatHash({ view: "presenter", slide: 5, click: 2 })).toBe("#/presenter/5?clicks=2");
  });

  it("formats overview with the talk's slide and click", () => {
    expect(formatHash({ view: "overview", slide: 5, click: 2 })).toBe("#/overview/5?clicks=2");
  });

  it("formats overview without a query for click zero", () => {
    expect(formatHash({ view: "overview", slide: 5, click: 0 })).toBe("#/overview/5");
  });

  it("formats print as #/print regardless of slide and click", () => {
    expect(formatHash({ view: "print", slide: 5, click: 2 })).toBe("#/print");
  });

  it("never writes embedded or bridge search flags", () => {
    const position = {
      view: "play",
      slide: 5,
      click: 2,
      embedded: true,
      bridge: true,
    } satisfies Parameters<typeof formatHash>[0] & { embedded: boolean; bridge: boolean };
    expect(formatHash(position)).toBe("#/5?clicks=2");
  });

  const views: DeckView[] = ["play", "presenter", "overview", "print"];
  it.each(views)("round-trips a range of non-negative integer slides and clicks in %s", (view) => {
    for (let slide = 0; slide <= 12; slide++) {
      for (let click = 0; click <= 6; click++) {
        expect(parseLocation(formatHash({ view, slide, click }), "")).toEqual({
          view,
          slide: view === "print" ? 1 : slide,
          click: view === "print" ? 0 : click,
          embedded: false,
          bridge: false,
        });
      }
    }
  });
});
