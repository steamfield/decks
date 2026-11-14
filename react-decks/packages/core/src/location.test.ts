import { describe, expect, it } from "vitest";
import { type DeckView, formatHash, parseLocation } from "./location";

describe("parseLocation", () => {
  it.each(["", "#", "#/"])("empty, #, #/: %s parses as play, slide 1, click 0", (hash) => {
    expect(parseLocation(hash, "")).toEqual({
      view: "play",
      slide: 1,
      click: 0,
      embedded: false,
      bridge: false,
    });
  });

  it("#/5 parses as play, slide 5, click 0", () => {
    expect(parseLocation("#/5", "")).toEqual({
      view: "play",
      slide: 5,
      click: 0,
      embedded: false,
      bridge: false,
    });
  });

  it("#/5?clicks=2 parses as play, slide 5, click 2", () => {
    expect(parseLocation("#/5?clicks=2", "")).toEqual({
      view: "play",
      slide: 5,
      click: 2,
      embedded: false,
      bridge: false,
    });
  });

  it("#/presenter parses as presenter, slide 1, click 0", () => {
    expect(parseLocation("#/presenter", "")).toEqual({
      view: "presenter",
      slide: 1,
      click: 0,
      embedded: false,
      bridge: false,
    });
  });

  it("#/presenter/5?clicks=2 parses as presenter, slide 5, click 2", () => {
    expect(parseLocation("#/presenter/5?clicks=2", "")).toEqual({
      view: "presenter",
      slide: 5,
      click: 2,
      embedded: false,
      bridge: false,
    });
  });

  it("#/overview parses as overview, slide 1, click 0", () => {
    expect(parseLocation("#/overview", "")).toEqual({
      view: "overview",
      slide: 1,
      click: 0,
      embedded: false,
      bridge: false,
    });
  });

  it("#/overview/5?clicks=2 preserves the talk position", () => {
    expect(parseLocation("#/overview/5?clicks=2", "")).toEqual({
      view: "overview",
      slide: 5,
      click: 2,
      embedded: false,
      bridge: false,
    });
  });

  it("#/overview/5 defaults to click zero", () => {
    expect(parseLocation("#/overview/5", "").click).toBe(0);
    expect(parseLocation("#/overview/5", "").slide).toBe(5);
  });

  it("#/print parses as print, slide 1, click 0", () => {
    expect(parseLocation("#/print", "")).toEqual({
      view: "print",
      slide: 1,
      click: 0,
      embedded: false,
      bridge: false,
    });
  });

  it.each([
    "#/abc",
    "#/5/extra",
    "#/-1",
    "#/1.5",
    "#/NaN",
    "#/Infinity",
    "#/presenter/-1",
    "#/presenter/5/extra",
    "#/overview/5/extra",
    "#/overview/-1",
    "#/overview/9007199254740993",
    "#/print/5",
    "#/play/5",
    "#/abc?clicks=2",
    "#/99999999999999999999",
    "#/9007199254740993",
    "#/1e21",
    "#/presenter/9007199254740993?clicks=2",
  ])("anything unrecognized (%s) parses as play, slide 1, click 0", (hash) => {
    expect(parseLocation(hash, "")).toEqual({
      view: "play",
      slide: 1,
      click: 0,
      embedded: false,
      bridge: false,
    });
  });

  it.each(["\n", "\r", "\r\n", "\u2028", "\u2029"])(
    "rejects hashes ending in the line terminator %j",
    (ending) => {
      for (const path of ["#/5", "#/presenter/5", "#/presenter", "#/overview/5", "#/overview"]) {
        expect(parseLocation(`${path}${ending}`, "")).toEqual({
          view: "play",
          slide: 1,
          click: 0,
          embedded: false,
          bridge: false,
        });
      }
    },
  );

  it.each([
    "",
    "?clicks",
    "?clicks=",
    "?clicks=-1",
    "?clicks=1.5",
    "?clicks=2x",
    "?clicks=NaN",
    "?clicks=Infinity",
    "?clicks=%20",
    "?clicks=2%0A",
    "?clicks=2%0D",
    "?clicks=2%0D%0A",
    "?clicks=2%E2%80%A8",
    "?clicks=2%E2%80%A9",
    "?clicks=9007199254740993",
  ])("a missing or malformed clicks value (%s) parses as 0", (query) => {
    expect(parseLocation(`#/5${query}`, "")).toEqual({
      view: "play",
      slide: 5,
      click: 0,
      embedded: false,
      bridge: false,
    });
  });

  it("does not clamp slide or click to a manifest", () => {
    expect(parseLocation("#/999?clicks=888", "")).toEqual({
      view: "play",
      slide: 999,
      click: 888,
      embedded: false,
      bridge: false,
    });
  });

  it.each([
    { search: "?embedded", expected: true },
    { search: "?embedded=1", expected: true },
    { search: "?embedded=0", expected: false },
    { search: "?embedded=false", expected: false },
    { search: "?embedded=other", expected: true },
    { search: "", expected: false },
  ])("embedded in search $search is $expected", ({ search, expected }) => {
    expect(parseLocation("#/5?clicks=2", search)).toEqual({
      view: "play",
      slide: 5,
      click: 2,
      embedded: expected,
      bridge: false,
    });
  });

  it.each([
    { search: "?decks-bridge", expected: true },
    { search: "?decks-bridge=1", expected: true },
    { search: "?decks-bridge=0", expected: false },
    { search: "?decks-bridge=false", expected: false },
    { search: "?decks-bridge=other", expected: true },
    { search: "", expected: false },
  ])("bridge in search $search is $expected", ({ search, expected }) => {
    expect(parseLocation("#/5?clicks=2", search)).toEqual({
      view: "play",
      slide: 5,
      click: 2,
      embedded: false,
      bridge: expected,
    });
  });

  it("reads embedded and bridge independently in the same search", () => {
    expect(parseLocation("#/presenter/5?clicks=2", "?embedded=false&decks-bridge")).toEqual({
      view: "presenter",
      slide: 5,
      click: 2,
      embedded: false,
      bridge: true,
    });
    expect(parseLocation("#/5", "?embedded&decks-bridge=0")).toEqual({
      view: "play",
      slide: 5,
      click: 0,
      embedded: true,
      bridge: false,
    });
  });

  it("reads only clicks from hash parameters and only flags from search", () => {
    expect(parseLocation("#/5?clicks=2&embedded&decks-bridge", "?clicks=9")).toEqual({
      view: "play",
      slide: 5,
      click: 2,
      embedded: false,
      bridge: false,
    });
    expect(parseLocation("#/5", "?clicks=9&embedded&decks-bridge")).toEqual({
      view: "play",
      slide: 5,
      click: 0,
      embedded: true,
      bridge: true,
    });
  });

  it("keeps search flags when an unrecognized hash falls back", () => {
    expect(parseLocation("#/abc?clicks=2", "?embedded&decks-bridge")).toEqual({
      view: "play",
      slide: 1,
      click: 0,
      embedded: true,
      bridge: true,
    });
  });

  it("print always uses slide 1 click 0 even with hash clicks", () => {
    const view = "print";
    expect(parseLocation(`#/${view}?clicks=9`, "?embedded")).toEqual({
      view,
      slide: 1,
      click: 0,
      embedded: true,
      bridge: false,
    });
  });
});

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
  it.each(views)("round-trips safe integer boundaries in %s", (view) => {
    for (const slide of [0, 1, Number.MAX_SAFE_INTEGER]) {
      for (const click of [0, 1, Number.MAX_SAFE_INTEGER]) {
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
