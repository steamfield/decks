import { screen } from "@testing-library/react";
import { beforeEach, expect, it, onTestFinished } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const content = { value: 1234.5, suffix: " km", label: "Channel surveyed" };
beforeEach(() => {
  installTheme(resolveTheme());
  const previous = document.documentElement.lang;
  document.documentElement.lang = "en-US";
  onTestFinished(() => {
    document.documentElement.lang = previous;
  });
});
it.each([
  [1234.5, "1.234,5"],
  [0.0004, "4E-4"],
] as const)(
  "formats the measurement %s in the document language without losing a nonzero value",
  async (value, expected) => {
    document.documentElement.lang = "de-DE";
    await setup(
      () => <MotionTemplate template="stat-burst" value={value} label="Concentration" />,
      { context: "print" },
    );
    expect(screen.getByRole("heading", { name: expected })).toHaveTextContent(expected);
  },
);
function show(at: number, options?: Parameters<typeof setup>[1]) {
  return setup(() => <MotionTemplate template="stat-burst" {...content} at={at} />, options);
}
function finished() {
  expect(screen.getByText("Channel surveyed")).toBeVisible();
  expect(screen.getByText("1,234.5 km", { exact: true })).toBeVisible();
}
it("each template hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await show(2);
  expect(screen.getByText("Channel surveyed")).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(screen.getByText("Channel surveyed")).not.toBeVisible();
  await view.next();
  await tick(1.2);
  finished();
  await view.previous();
  await tick(1.2);
  expect(screen.getByText("Channel surveyed")).not.toBeVisible();
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
    const pose = () => screen.getByLabelText("1,234.5 km").textContent;
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
  [{ label: " " }, 'stat-burst label must contain text, got " "'],
  [{ value: Infinity }, "stat-burst value must be finite, got Infinity"],
  [{ at: -1 }, "stat-burst at must be a nonnegative integer, got -1"],
  [{ at: NaN }, "stat-burst at must be a nonnegative integer, got NaN"],
] as const)(
  "each template throws naming itself and the prop for empty required text, an empty list, a negative at and a list over its limit (%j)",
  async (overrides, message) => {
    const view = await setup(
      () => <MotionTemplate template="stat-burst" {...content} {...overrides} />,
      { error: true },
    );
    expect(view.errors).toEqual([new Error(message)]);
  },
);
