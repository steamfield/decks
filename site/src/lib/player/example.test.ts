import { describe, expect, it } from "vitest";
import { draftLine, firstStorySlide, markAt, posterSrcset, stateAt } from "./example";

const states = [
  { slide: 1, beat: 0, beats: 0, lead: "", body: "" },
  { slide: 2, beat: 1, beats: 2, lead: "b", body: "" },
];

describe("example data", () => {
  it("finds a recorded step", () => {
    expect(stateAt({ states }, 2, 1)?.lead).toBe("b");
    expect(stateAt({ states }, 2, 2)).toBeUndefined();
  });

  it("lists both poster widths for one format", () => {
    expect(posterSrcset({ base: "/posters/tides", width: 1280, height: 720 }, "avif")).toBe(
      "/posters/tides-640.avif 640w, /posters/tides-1280.avif 1280w",
    );
  });
});

describe("loop marks", () => {
  const loop = {
    marks: [
      { t: 0, slide: 2, beat: 1 },
      { t: 2.5, slide: 2, beat: 2 },
      { t: 5, slide: 3, beat: 0 },
    ],
  };

  it("gives the step shown at a time: the last mark at or before it", () => {
    expect(markAt(loop, 0)).toEqual({ t: 0, slide: 2, beat: 1 });
    expect(markAt(loop, 2.49)?.beat).toBe(1);
    expect(markAt(loop, 2.5)?.beat).toBe(2);
    expect(markAt(loop, 99)?.slide).toBe(3);
  });

  it("falls back to the first mark, and to nothing without marks", () => {
    expect(markAt(loop, -1)?.beat).toBe(1);
    expect(markAt({ marks: [] }, 1)).toBeNull();
  });
});

describe("the draft line", () => {
  const run = {
    prompt: "p",
    setup: "repo" as const,
    turns: 87,
    minutes: "8.3",
    cost: "$3.17",
  };
  const edits = { by: "hand" as const, files: 6, insertions: 49, deletions: 11, pairs: [] };

  it("names the setup the run used and the size of the hand edit", () => {
    expect(draftLine(run, edits)).toBe(
      "Drafted in 8 minutes from this prompt with this repository's agent setup, then edited by hand (+49/−11 in 6 files).",
    );
    expect(draftLine({ ...run, setup: "init" }, null)).toBe(
      "Drafted in 8 minutes from this prompt in a fresh project set up with decks init.",
    );
  });

  it("says when a second Claude Code session made the edit", () => {
    expect(draftLine({ ...run, setup: "init" }, { ...edits, by: "claude" })).toBe(
      "Drafted in 8 minutes from this prompt in a fresh project set up with decks init, then fact-checked and edited in a second Claude Code session (+49/−11 in 6 files).",
    );
  });
});

describe("the first story slide", () => {
  it("is the first slide with a caption, else the start slide", () => {
    expect(firstStorySlide({ states, startSlide: 5 })).toBe(2);
    expect(firstStorySlide({ states: [], startSlide: 5 })).toBe(5);
  });
});
