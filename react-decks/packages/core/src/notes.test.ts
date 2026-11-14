import { describe, expect, it } from "vitest";
import { noteClickCount, segmentNotes } from "./notes";

describe("segmentNotes", () => {
  it("keeps notes without markers at click zero and trims the text", () => {
    expect(segmentNotes("  <p>Opening notes</p> \n")).toEqual([
      { click: 0, html: "<p>Opening notes</p>" },
    ]);
  });

  it("keeps an empty segment for empty input", () => {
    expect(segmentNotes("")).toEqual([{ click: 0, html: "" }]);
    expect(segmentNotes(" \n ")).toEqual([{ click: 0, html: "" }]);
  });

  it("assigns the text before the first marker to click zero", () => {
    expect(segmentNotes("Before [click] After")).toEqual([
      { click: 0, html: "Before" },
      { click: 1, html: "After" },
    ]);
  });

  it("accumulates plain and numbered markers instead of setting an absolute click", () => {
    expect(segmentNotes("Zero [click] One [click:3] Four [click] Five [click:2] Seven")).toEqual([
      { click: 0, html: "Zero" },
      { click: 1, html: "One" },
      { click: 4, html: "Four" },
      { click: 5, html: "Five" },
      { click: 7, html: "Seven" },
    ]);
  });

  it("keeps empty segments before, between and after adjacent markers", () => {
    expect(segmentNotes("[click][click:2]  [click]")).toEqual([
      { click: 0, html: "" },
      { click: 1, html: "" },
      { click: 3, html: "" },
      { click: 4, html: "" },
    ]);
  });

  it.each([
    "[click:0]",
    "[click:-1]",
    "[click:x]",
    "[click:1.5]",
    "[click:]",
    "[click:+1]",
    "[click: 1]",
    "[click:1 ]",
    "[click:1e2]",
    "[Click]",
    "[click",
    "[click:NaN]",
    "[click:Infinity]",
  ])("leaves malformed marker %s in the text", (marker) => {
    expect(segmentNotes(`Before ${marker} after [click] End`)).toEqual([
      { click: 0, html: `Before ${marker} after` },
      { click: 1, html: "End" },
    ]);
  });

  it("reads a positive integer with leading zeroes", () => {
    expect(segmentNotes("[click:002]Two")).toEqual([
      { click: 0, html: "" },
      { click: 2, html: "Two" },
    ]);
  });
});

describe("noteClickCount", () => {
  it.each([
    ["", 0],
    ["Plain notes", 0],
    ["[click:0] [click:-1] [click:x]", 0],
    ["[click]One[click]Two", 2],
    ["Zero[click:3]Three[click]Four[click:2]Six", 6],
    ["[click][click:2][click]", 4],
  ])("returns the last click for %s", (html, expected) => {
    expect(noteClickCount(html)).toBe(expected);
  });
});
