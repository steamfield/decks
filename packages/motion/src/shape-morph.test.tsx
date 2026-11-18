import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { duration, ShapeMorph } from "./index";
import { setupMotion, tick } from "./motion.test-support";

const paths = ["M0 0H10V10Z", "M0 0H30V30Z", "M0 0H20V20Z"];

function Shape({ at = 1, values = paths }: { at?: number; values?: string[] }) {
  return (
    <svg role="img" aria-label="Outline">
      <ShapeMorph at={at} paths={values} />
    </svg>
  );
}

function outline() {
  return screen.getByRole("img", { name: "Outline" }).firstElementChild?.getAttribute("d");
}

it("ShapeMorph shows paths[0] before click at and paths[i] from click at plus i minus 1", async () => {
  const view = await setupMotion(() => <Shape at={2} />);
  for (const expected of [paths[0], ...paths, paths[2]]) {
    await tick(duration.slow);
    expect(outline()).toBe(expected);
    await view.next();
  }
});

it("an interrupted morph keeps the visible outline and ends on the new path", async () => {
  const view = await setupMotion(Shape);
  await view.next();
  await tick(0.1);
  const visible = outline();
  expect(visible).toBeTruthy();
  expect(paths).not.toContain(visible);
  const extent = (d: string | null | undefined) =>
    Math.max(...(d?.match(/[\d.]+/g) ?? []).map(Number));
  const before = extent(visible);
  await view.next();
  expect(outline()).toBe(visible);
  await tick(0.016);
  const next = extent(outline());
  expect(next).toBeGreaterThan(Math.min(before, 20));
  expect(next).toBeLessThan(Math.max(before, 20));
  await tick(duration.slow - 0.016);
  expect(outline()).toBe(paths[2]);
  await view.previous();
  await tick(0.1);
  expect(paths).not.toContain(outline());
  await tick(duration.slow - 0.1);
  expect(outline()).toBe(paths[1]);
});

it.each(["", "M10 10"])(
  "seeks on live arrival at and return from a non-drawable path %j",
  async (d) => {
    const triangle = "M0 0H10V10Z";
    const view = await setupMotion(() => <Shape values={[triangle, d]} />);
    await view.next();
    expect(outline()).toBe(d);
    await tick(duration.slow);
    expect(outline()).toBe(d);
    await view.previous();
    expect(outline()).toBe(triangle);
    await tick(duration.slow);
    expect(outline()).toBe(triangle);
  },
);

it.each([
  ["empty paths", [], 1, "ShapeMorph paths must contain at least one path, got []"],
  [
    "an at that is not a whole number",
    paths,
    Number.NaN,
    "at must be a positive whole number, got NaN",
  ],
] satisfies [string, string[], number, string][])(
  "ShapeMorph throws naming the prop for %s",
  async (_case, values, at, message) => {
    const view = await setupMotion(() => <Shape values={values} at={at} />, { error: true });
    expect(view.errors).toEqual([new Error(message)]);
  },
);
