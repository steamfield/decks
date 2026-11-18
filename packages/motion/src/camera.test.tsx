import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Camera, type CameraStop, duration, ShapeMorph } from "./index";
import { setupMotion, tick } from "./motion.test-support";

const stops = [
  { x: 40, y: 80, zoom: 1 },
  { x: 200, y: 70, zoom: 3 },
  { x: 100, y: 90, zoom: 0.5 },
];
const paths = ["M0 0H10V10Z", "M0 0H20V20Z", "M0 0H30V30Z"];

function Tour({ at = 1 }: { at?: number }) {
  return (
    <Camera stops={stops} at={at}>
      <span>Map</span>
    </Camera>
  );
}

function transform(label = "Map") {
  const layer = screen.getByText(label).parentElement;
  if (!layer) throw new Error("Map has no camera layer");
  return getComputedStyle(layer).transform;
}

function ReferenceStops() {
  return stops.map((stop, i) => (
    <Camera key={stop.x} at={1} stops={[stop]}>
      <span>Reference {i}</span>
    </Camera>
  ));
}

it("Camera shows stops[0] before click at and stops[i] from click at plus i minus 1", async () => {
  const view = await setupMotion(() => (
    <>
      <Tour at={2} />
      <ReferenceStops />
    </>
  ));
  const poses = stops.map((_, i) => transform(`Reference ${i}`));
  expect(new Set(poses).size).toBe(stops.length);
  for (const index of [0, 0, 1, 2, 2]) {
    await tick(duration.slow);
    expect(transform()).toBe(poses[index]);
    await view.next();
  }
});

it("a live arrival preserves the same small positive zoom as a direct seek", async () => {
  const destination = { x: 0, y: 0, zoom: 0.0000004 };
  const view = await setupMotion(() => (
    <>
      <Camera at={1} stops={[{ x: 0, y: 0, zoom: 1 }, destination]}>
        <span>Map</span>
      </Camera>
      <Camera at={1} stops={[destination]}>
        <span>Destination</span>
      </Camera>
    </>
  ));
  expect(transform()).not.toBe(transform("Destination"));
  await view.next();
  await tick(duration.slow);
  expect(transform()).toBe(transform("Destination"));
});

function Pair({ at = 1 }: { at?: number }) {
  return (
    <>
      <Tour at={at} />
      <ReferenceStops />
      <svg role="img" aria-label="Outline">
        <ShapeMorph paths={paths} at={at} />
      </svg>
    </>
  );
}

function expectPose(index: number, path: string | undefined) {
  expect(transform()).toBe(transform(`Reference ${index}`));
  expect(screen.getByRole("img", { name: "Outline" }).firstElementChild).toHaveAttribute("d", path);
}

it("a jump of two clicks seeks with no tween", async () => {
  const view = await setupMotion(Pair, { click: 1 });
  await view.next();
  await tick(0.1);
  // Home goes back to click 0 of the first slide: from click 2 that is a jump of two.
  await view.user.keyboard("{Home}");
  expectPose(0, paths[0]);
  await tick(duration.slow);
  expectPose(0, paths[0]);
});

it.each(["instant", "presenter", "preview", "overview", "print"] as const)(
  "motion instant, presenter, preview, overview and print render the click's pose with no tween (%s)",
  async (mode) => {
    const view = await setupMotion(Pair, {
      context: mode === "instant" ? "slide" : mode,
      instant: mode === "instant",
    });
    await view.next();
    expectPose(1, paths[1]);
  },
);

it("an inactive slide seeks its final pose when a click interrupts travel", async () => {
  const view = await setupMotion(() => <Pair at={4} />, { click: 3 });
  await view.next();
  await tick(0.1);
  await view.user.keyboard("{ArrowDown}");
  expect(transform()).toBe(transform("Reference 2"));
  expect(screen.getByLabelText("Outline").firstElementChild).toHaveAttribute("d", paths[2]);
});

it.each([
  ["empty stops", [], 1, "Camera stops must contain at least one stop, got []"],
  ["at below 1", stops, 0, "at must be a positive whole number, got 0"],
  [
    "a non-finite x",
    [{ x: Number.NaN, y: 0, zoom: 1 }],
    1,
    "Camera stops[0].x must be finite, got NaN",
  ],
  [
    "a non-finite y",
    [{ x: 0, y: Number.NEGATIVE_INFINITY, zoom: 1 }],
    1,
    "Camera stops[0].y must be finite, got -Infinity",
  ],
  [
    "a non-finite zoom",
    [{ x: 0, y: 0, zoom: Number.NaN }],
    1,
    "Camera stops[0].zoom must be finite and positive, got NaN",
  ],
  [
    "a zoom of 0",
    [{ x: 0, y: 0, zoom: 0 }],
    1,
    "Camera stops[0].zoom must be finite and positive, got 0",
  ],
] satisfies [string, CameraStop[], number, string][])(
  "Camera throws naming the prop for %s",
  async (_case, values, at, message) => {
    const view = await setupMotion(() => <Camera at={at} stops={values} />, { error: true });
    expect(view.errors).toEqual([new Error(message)]);
  },
);
