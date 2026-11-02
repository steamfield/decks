import { describe, expect, it } from "vitest";
import { packRadii, sides, tapePosition } from "./tape";

const states = [
  { slide: 1, beat: 0, beats: 0, lead: "", body: "" },
  { slide: 2, beat: 0, beats: 2, lead: "a", body: "" },
  { slide: 2, beat: 1, beats: 2, lead: "b", body: "" },
  { slide: 2, beat: 2, beats: 2, lead: "c", body: "" },
  { slide: 3, beat: 0, beats: 0, lead: "", body: "" },
];

describe("tape position", () => {
  it("finds a recorded step", () => {
    expect(tapePosition({ states }, 2, 1)).toEqual({ index: 2, total: 5 });
  });

  it("falls back to the last recorded step before an unrecorded one", () => {
    expect(tapePosition({ states }, 2, 5)).toEqual({ index: 3, total: 5 });
    expect(tapePosition({ states: [] }, 1, 0)).toEqual({ index: 0, total: 0 });
  });
});

describe("tape packs", () => {
  it("moves tape from the supply hub to the take-up hub, keeping its area", () => {
    const start = packRadii(0);
    const end = packRadii(1);
    expect(start.supply).toBeCloseTo(1);
    expect(start.takeup).toBeCloseTo(0.36);
    expect(end).toEqual({ supply: start.takeup, takeup: start.supply });
    const mid = packRadii(0.5);
    expect(mid.supply).toBeCloseTo(mid.takeup);
    expect(mid.supply ** 2 + mid.takeup ** 2).toBeCloseTo(start.supply ** 2 + start.takeup ** 2);
  });
});

describe("J-card sides", () => {
  it("gives side A the extra track", () => {
    expect(sides([1, 2, 3, 4, 5])).toEqual({ a: [1, 2, 3], b: [4, 5] });
    expect(sides([])).toEqual({ a: [], b: [] });
  });
});
