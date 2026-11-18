import { screen } from "@testing-library/react";
import { beforeEach, expect, it, onTestFinished } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const content = { from: 1200, to: 1238, suffix: "%", label: "Gauge readings" };
beforeEach(() => {
  installTheme(resolveTheme());
  const previous = document.documentElement.lang;
  document.documentElement.lang = "en-US";
  onTestFinished(() => {
    document.documentElement.lang = previous;
  });
});
it.each([
  [1234.5, 1250.75, "1.234,5", "1.250,75", "+16,25"],
  [0.0001, 0.0004, "1E-4", "4E-4", "+3E-4"],
] as const)(
  "formats both measurements and their signed difference in the deck language (%s to %s)",
  async (from, to, before, after, delta) => {
    document.documentElement.lang = "de-DE";
    await setup(
      () => <MotionTemplate template="stat-compare" from={from} to={to} label="Concentration" />,
      { context: "print" },
    );
    expect(screen.getByRole("heading", { name: before })).toHaveTextContent(before);
    expect(screen.getByRole("heading", { name: after })).toHaveTextContent(after);
    expect(screen.getByText(delta)).toBeVisible();
  },
);
function show(at: number, options?: Parameters<typeof setup>[1]) {
  return setup(() => <MotionTemplate template="stat-compare" {...content} at={at} />, options);
}
function finished() {
  expect(screen.getByText("Gauge readings")).toBeVisible();
  expect(screen.getByText("1,200%", { exact: true })).toBeVisible();
  expect(screen.getByText("1,238%", { exact: true })).toBeVisible();
  expect(screen.getByText("+38 pp", { exact: true })).toBeVisible();
}
it("stat-compare hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await show(2);
  expect(screen.getByText("Gauge readings")).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(screen.getByText("Gauge readings")).not.toBeVisible();
  await view.next();
  await tick(1.2);
  finished();
  await view.previous();
  await tick(1.2);
  expect(screen.getByText("Gauge readings")).not.toBeVisible();
});
it.each([0, 1])(
  "the stat-compare entrance in the live slide plays and settles within about 1.2 s of virtual time (at %i)",
  async (at) => {
    const view = await show(at);
    if (at) await view.next();
    const pose = () => screen.getByLabelText("1,238%").textContent;
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
it("stat-compare shows the formatted final values in print and never a partial value as time passes", async () => {
  await show(0, { context: "print" });
  finished();
  await tick(0.25);
  finished();
});
it.each([
  [{ label: " " }, 'stat-compare label must contain text, got " "'],
  [{ from: Infinity }, "stat-compare from must be finite, got Infinity"],
  [{ to: Infinity }, "stat-compare to must be finite, got Infinity"],
  [{ at: -1 }, "stat-compare at must be a nonnegative integer, got -1"],
  [{ at: NaN }, "stat-compare at must be a nonnegative integer, got NaN"],
] as const)(
  "stat-compare throws naming itself and the prop for invalid input %j",
  async (overrides, message) => {
    const view = await setup(
      () => <MotionTemplate template="stat-compare" {...content} {...overrides} />,
      { error: true },
    );
    expect(view.errors).toEqual([new Error(message)]);
  },
);

it.each([
  ["20% to 58% shows +38 pp", 20, 58, "%", "+38 pp"],
  ['a "k" suffix still shows +38k', 20, 58, "k", "+38k"],
  ["a rate falling from 42% to 37.5% shows -4.5 pp", 42, 37.5, "%", "-4.5 pp"],
  ["equal percentages show 0 pp", 42, 42, "%", "0 pp"],
] as const)("%s", async (_name, from, to, suffix, change) => {
  await setup(
    () => (
      <MotionTemplate template="stat-compare" from={from} to={to} label="Change" suffix={suffix} />
    ),
    { instant: true },
  );
  expect(screen.getAllByRole("heading").map((heading) => heading.textContent)).toEqual([
    `${from}${suffix}`,
    `${to}${suffix}`,
  ]);
  expect(screen.getByText(change)).toBeVisible();
});
