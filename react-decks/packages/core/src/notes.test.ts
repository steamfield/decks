import { describe, expect, it } from "vitest";
import { type NoteSegment, noteClickCount, segmentNotes } from "./notes";

describe("markdown notes", () => {
  it.each<{ name: string; markdown: string; segments: NoteSegment[]; count: number }>([
    {
      name: "keeps unmarked notes at click zero",
      markdown: "Intro",
      segments: [{ click: 0, markdown: "Intro" }],
      count: 0,
    },
    {
      name: "splits successive markers into whole markdown blocks",
      markdown: "Intro\n\n[click] First\n\n[click] Second",
      segments: [
        { click: 0, markdown: "Intro" },
        { click: 1, markdown: "First" },
        { click: 2, markdown: "Second" },
      ],
      count: 2,
    },
    {
      name: "keeps an empty segment before a leading marker",
      markdown: "[click]\nFirst",
      segments: [
        { click: 0, markdown: "" },
        { click: 1, markdown: "First" },
      ],
      count: 1,
    },
    {
      name: "adds a numbered marker to the running click",
      markdown: "A\n[click:3] B",
      segments: [
        { click: 0, markdown: "A" },
        { click: 3, markdown: "B" },
      ],
      count: 3,
    },
    {
      name: "keeps empty segments between markers",
      markdown: "[click]\n[click] B",
      segments: [
        { click: 0, markdown: "" },
        { click: 1, markdown: "" },
        { click: 2, markdown: "B" },
      ],
      count: 2,
    },
    {
      name: "leaves an inline marker in the text",
      markdown: "Say [click] here",
      segments: [{ click: 0, markdown: "Say [click] here" }],
      count: 0,
    },
    {
      name: "recognizes a marker after spaces",
      markdown: "  [click] indented",
      segments: [
        { click: 0, markdown: "" },
        { click: 1, markdown: "indented" },
      ],
      count: 1,
    },
    {
      name: "recognizes tabs before a marker",
      markdown: "Before\n \t\t[click]\t  **After**",
      segments: [
        { click: 0, markdown: "Before" },
        { click: 1, markdown: "**After**" },
      ],
      count: 1,
    },
    {
      name: "reads leading zeros and accumulates mixed increments",
      markdown: "[click:002]Two\n[click:3] Five\n[click] Six",
      segments: [
        { click: 0, markdown: "" },
        { click: 2, markdown: "Two" },
        { click: 5, markdown: "Five" },
        { click: 6, markdown: "Six" },
      ],
      count: 6,
    },
    {
      name: "segments CRLF markdown without converting it to HTML",
      markdown: "# Intro\r\n\r\n[click] - One\r\n- Two\r\n\r\n[click] **End**\r\n",
      segments: [
        { click: 0, markdown: "# Intro" },
        { click: 1, markdown: "- One\r\n- Two" },
        { click: 2, markdown: "**End**" },
      ],
      count: 2,
    },
    {
      name: "keeps an empty segment for a marker on the last line",
      markdown: "Before\n[click]",
      segments: [
        { click: 0, markdown: "Before" },
        { click: 1, markdown: "" },
      ],
      count: 1,
    },
    {
      name: "leaves a second marker on the same line in the text",
      markdown: "[click][click:2]  [click]",
      segments: [
        { click: 0, markdown: "" },
        { click: 1, markdown: "[click:2]  [click]" },
      ],
      count: 1,
    },
  ])("$name", ({ markdown, segments, count }) => {
    expect(segmentNotes(markdown)).toEqual(segments);
    expect(noteClickCount(markdown)).toBe(count);
  });

  it.each(["", " \n "])("keeps a click-zero segment for empty input %j", (markdown) => {
    expect(segmentNotes(markdown)).toEqual([{ click: 0, markdown: "" }]);
    expect(noteClickCount(markdown)).toBe(0);
  });

  it("trims the markdown source", () => {
    expect(segmentNotes("  **Opening** \n")).toEqual([{ click: 0, markdown: "**Opening**" }]);
    expect(noteClickCount("  **Opening** \n")).toBe(0);
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
  ])("leaves malformed marker %s in place", (marker) => {
    const markdown = `Before\n  ${marker} after\n[click] End`;
    expect(segmentNotes(markdown)).toEqual([
      { click: 0, markdown: `Before\n  ${marker} after` },
      { click: 1, markdown: "End" },
    ]);
    expect(noteClickCount(markdown)).toBe(1);
    expect(noteClickCount(marker)).toBe(0);
  });
});
