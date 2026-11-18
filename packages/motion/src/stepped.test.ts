import { expect, it } from "vitest";
import { stepIndex } from "./stepped";

it("a single item holds for every click, including before a delayed start", () => {
  expect([0, 1, 2, 3].map((click) => stepIndex(click, 2, 1))).toEqual([0, 0, 0, 0]);
});
