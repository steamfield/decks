import { screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const content = { name: "Mara Lin", role: "River survey lead" };
beforeEach(() => installTheme(resolveTheme()));
function show(at: number, options?: Parameters<typeof setup>[1]) {
  return setup(() => <MotionTemplate template="lower-third" {...content} at={at} />, options);
}
function finished() {
  expect(screen.getByText("River survey lead")).toBeVisible();
  expect(screen.getByRole("heading", { name: content.name })).toBeVisible();
}
it("lower-third hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await show(2);
  expect(screen.getByText("River survey lead")).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(screen.getByText("River survey lead")).not.toBeVisible();
  await view.next();
  await tick(1.2);
  finished();
  await view.previous();
  await tick(1.2);
  expect(screen.getByText("River survey lead")).not.toBeVisible();
});
it.each([0, 1])(
  "the lower-third entrance in the live slide plays and settles within about 1.2 s of virtual time (at %i)",
  async (at) => {
    const view = await show(at);
    if (at) await view.next();
    const pose = () => getComputedStyle(screen.getByText(content.role)).transform;
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
it("lower-third shows its finished pose for the click in print", async () => {
  await show(2, { click: 2, context: "print" });
  finished();
});

it.each([
  [{ name: " " }, 'lower-third name must contain text, got " "'],
  [{ role: " " }, 'lower-third role must contain text, got " "'],
  [{ at: -1 }, "lower-third at must be a nonnegative integer, got -1"],
  [{ at: NaN }, "lower-third at must be a nonnegative integer, got NaN"],
] as const)(
  "lower-third throws naming itself and the prop for invalid input %j",
  async (overrides, message) => {
    const view = await setup(
      () => <MotionTemplate template="lower-third" {...content} {...overrides} />,
      { error: true },
    );
    expect(view.errors).toEqual([new Error(message)]);
  },
);
