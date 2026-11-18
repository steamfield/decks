import { screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";
import type { TemplateProps } from "./motion-template-props";

const props: TemplateProps<"process-flow"> = {
  template: "process-flow",
  steps: ["Scan the boarding pass.", "Assign a berth.", "Release the gangway."],
};
const first = () => screen.getByText("Scan the boarding pass.", { exact: true });
const last = () => screen.getByText("Release the gangway.", { exact: true });

beforeEach(() => installTheme(resolveTheme()));

it("process-flow hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={2} />);
  expect(first()).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(first()).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(first()).toBeVisible();
  await view.previous();
  await tick(1.2);
  expect(first()).not.toBeVisible();
});

it("plays the first beat on arrival at click zero in the live slide", async () => {
  await setup(() => <MotionTemplate {...props} />);
  expect(first()).not.toBeVisible();
  await tick(1.2);
  expect(first()).toBeVisible();
});

it("process-flow shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "print" });
  expect(first()).toBeVisible();
  expect(last()).not.toBeVisible();
});

it("process-flow shows item i from click at plus i", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={1} />, { click: 1, instant: true });
  expect(first()).toBeVisible();
  expect(last()).not.toBeVisible();
  const middle = screen.getByText("Assign a berth.", { exact: true });
  expect(middle).not.toBeVisible();
  await view.next();
  expect(middle).toBeVisible();
  expect(last()).not.toBeVisible();
  await view.next();
  expect(first()).toBeVisible();
  expect(last()).toBeVisible();
});

const invalid: [Partial<typeof props>, string][] = [
  [{ at: -1 }, "at must be a non-negative whole number, got -1"],
  [{ at: Infinity }, "at must be a non-negative whole number, got Infinity"],
  [{ steps: [] }, "steps must contain 1 to 5 entries, got 0"],
  [{ steps: Array(6).fill("Board") }, "steps must contain 1 to 5 entries, got 6"],
  [{ steps: [" "] }, 'steps[0] must contain text, got " "'],
];

it.each(invalid)(
  "process-flow throws naming itself and the prop for invalid input %j",
  (overrides, message) => {
    expect(() => renderToStaticMarkup(<MotionTemplate {...props} {...overrides} />)).toThrow(
      new Error(`process-flow: ${message}`),
    );
  },
);
