import { describe, expect, it } from "vitest";
import { parseCodeOptions } from "./code-options";

describe("code options", () => {
  it.each([
    ["", { at: 0 }],
    ["{2,4-5|7|all|none}", { at: 0, steps: [[2, 4, 5], [7], "all", "none"] }],
    ["{1|2} at=3", { at: 3, steps: [[1], [2]] }],
    ["at=0", { at: 0 }],
    ["lines", { at: 0, lines: 1 }],
    ["lines=10", { at: 0, lines: 10 }],
    ['title="store file.ts"', { at: 0, title: "store file.ts" }],
    ['title=""', { at: 0, title: "" }],
    ["maxHeight=420", { at: 0, maxHeight: 420 }],
    ["{1,1-2}", { at: 0, steps: [[1, 2]] }],
    [
      '  lines  title="store.ts"  {2|all} at=1 maxHeight=420  ',
      { at: 1, lines: 1, title: "store.ts", steps: [[2], "all"], maxHeight: 420 },
    ],
  ])("parses %s", (meta, expected) => {
    expect(parseCodeOptions(meta, 7, "slide.mdx")).toEqual(expected);
  });

  it.each([
    "typo",
    "line=3",
    "{5-2}",
    "{8}",
    "{0}",
    "{-1}",
    "{1.5}",
    "{}",
    "{1|}",
    "{all,1}",
    "{1-2-3}",
    "{2,}",
    "{1",
    "{12",
    "at=-1",
    "at=1.5",
    "at=no",
    "at=",
    "at=9007199254740992",
    "at",
    "lines=0",
    "lines=-1",
    "lines=2.5",
    "lines=",
    "maxHeight=0",
    "maxHeight=-1",
    "maxHeight=1.5",
    "maxHeight=",
    "maxHeight",
    "title=file.ts",
    'title="unterminated',
    'title="a"extra',
    "lines lines=2",
    "{1} {2}",
  ])("rejects %s with the filename and option", (meta) => {
    expect(() => parseCodeOptions(meta, 7, "slides/broken.mdx")).toThrow(
      "slides/broken.mdx: invalid code option",
    );
    try {
      parseCodeOptions(meta, 7, "slides/broken.mdx");
    } catch (error) {
      expect(String(error)).toContain(meta.split(" ").at(-1));
    }
  });
});
