import { screen } from "@testing-library/react";
import { beforeEach, expect, it, onTestFinished } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const content = {
  metrics: [
    { value: 1350, label: "Samples" },
    { value: 12.5, suffix: " km", label: "Reach" },
  ],
};
beforeEach(() => {
  installTheme(resolveTheme());
  const previous = document.documentElement.lang;
  document.documentElement.lang = "en-US";
  onTestFinished(() => {
    document.documentElement.lang = previous;
  });
});
it("keeps small nonzero tile values and uses the deck language for visible and accessible numbers", async () => {
  document.documentElement.lang = "de-DE";
  await setup(
    () => (
      <MotionTemplate
        template="metric-grid"
        metrics={[
          { value: 1234.5, label: "Yield" },
          { value: 0.0004, label: "Concentration" },
        ]}
      />
    ),
    { context: "print" },
  );
  for (const expected of ["1.234,5", "4E-4"])
    expect(screen.getByRole("heading", { name: expected })).toHaveTextContent(expected);
});
function show(at: number, options?: Parameters<typeof setup>[1]) {
  return setup(() => <MotionTemplate template="metric-grid" {...content} at={at} />, options);
}
function finished() {
  expect(screen.getByText("Samples")).toBeVisible();
  expect(screen.getByText("1,350", { exact: true })).toBeVisible();
  expect(screen.getByText("12.5 km", { exact: true })).toBeVisible();
}
it("each template hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await show(2);
  expect(screen.getByText("Samples")).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(screen.getByText("Samples")).not.toBeVisible();
  await view.next();
  await tick(1.2);
  finished();
  await view.previous();
  await tick(1.2);
  expect(screen.getByText("Samples")).not.toBeVisible();
});
it("each template with at 0 shows the finished pose outside the live slide", async () => {
  await show(0, { context: "preview" });
  finished();
});
it.each([0, 1])(
  "each entrance in the live slide plays and settles within about 1.2 s of virtual time per beat (at %i)",
  async (at) => {
    const view = await show(at);
    if (at) await view.next();
    const pose = () => screen.getByLabelText("1,350").textContent;
    const start = pose();
    await tick(0.42);
    const moving = pose();
    expect(moving).not.toBe(start);
    await tick(0.78);
    const end = pose();
    expect(end).not.toBe(moving);
    finished();
    await tick(0.6);
    expect(pose()).toBe(end);
  },
);
it.each(["presenter", "preview", "overview", "print", "instant"] as const)(
  "presenter, preview, overview, print and instant mode show the finished pose for the click with no tween (%s)",
  async (mode) => {
    await show(2, mode === "instant" ? { click: 2, instant: true } : { click: 2, context: mode });
    finished();
  },
);
it("stat-burst, stat-compare and metric-grid show the formatted final values and never a partial value outside the live slide", async () => {
  await show(0, { context: "print" });
  finished();
  await tick(0.25);
  finished();
});
it.each([
  [{ at: -1 }, "metric-grid at must be a nonnegative integer, got -1"],
  [{ at: NaN }, "metric-grid at must be a nonnegative integer, got NaN"],
] as const)(
  "each template throws naming itself and the prop for empty required text, an empty list, a negative at and a list over its limit (%j)",
  async (overrides, message) => {
    const view = await setup(
      () => <MotionTemplate template="metric-grid" {...content} {...overrides} />,
      { error: true },
    );
    expect(view.errors).toEqual([new Error(message)]);
  },
);

it("shows all four tiles at the upper limit, including a repeated label", async () => {
  const metrics = [
    { value: 0, label: "Upstream" },
    { value: 17, label: "Upstream" },
    { value: -3, label: "Downstream" },
    { value: 1.5, label: "Estuary" },
  ];
  await setup(() => <MotionTemplate template="metric-grid" metrics={metrics} />, { instant: true });
  expect(screen.getAllByRole("heading").map((heading) => heading.textContent)).toEqual([
    "0",
    "17",
    "-3",
    "1.5",
  ]);
});
it.each([
  ["metric-grid throws for an empty list", 0],
  ["metric-grid throws for a single tile", 1],
  ["metric-grid throws for more than four metrics", 5],
] as const)("%s", async (_name, count) => {
  const view = await setup(
    () => (
      <MotionTemplate
        template="metric-grid"
        metrics={Array.from({ length: count }, (_, value) => ({ value, label: "Sample" }))}
      />
    ),
    { error: true },
  );
  expect(view.errors).toEqual([
    new Error(`metric-grid metrics must contain 2 to 4 tiles, got ${count}`),
  ]);
});
it.each([
  [{ value: 1, label: " " }, 'metric-grid metrics[1].label must contain text, got " "'],
  [
    { value: Infinity, label: "Distance" },
    "metric-grid metrics[1].value must be finite, got Infinity",
  ],
])("identifies the invalid metric and its value (%j)", async (metric, message) => {
  const view = await setup(
    () => (
      <MotionTemplate template="metric-grid" metrics={[{ value: 2, label: "Samples" }, metric]} />
    ),
    { error: true },
  );
  expect(view.errors).toEqual([new Error(message)]);
});
