import { screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";
import type { TemplateProps } from "./motion-template-props";

const props: TemplateProps<"myth-fact"> = {
  template: "myth-fact",
  myth: "The tide sets the departure time.",
  fact: "The ramp adjusts to the tide.",
};
const first = () => screen.getByText("The tide sets the departure time.", { exact: true });
const last = () => screen.getByText("The ramp adjusts to the tide.", { exact: true });

beforeEach(() => installTheme(resolveTheme()));

it("myth-fact hides its parts before click at and shows the finished pose from click at", async () => {
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

it("myth-fact shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "print" });
  expect(first()).toBeVisible();
  expect(last()).not.toBeVisible();
});

it("myth-fact shows the second beat from click at plus 1", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={1} />, { click: 1, instant: true });
  expect(first()).toBeVisible();
  expect(last()).not.toBeVisible();

  await view.next();
  expect(first()).toBeVisible();
  expect(last()).toBeVisible();
});

const invalid: [Partial<typeof props>, string][] = [
  [{ at: -1 }, "at must be a non-negative whole number, got -1"],
  [{ at: Infinity }, "at must be a non-negative whole number, got Infinity"],
  [{ myth: " " }, 'myth must contain text, got " "'],
  [{ fact: "" }, 'fact must contain text, got ""'],
];

it.each(invalid)(
  "myth-fact throws naming itself and the prop for invalid input %j",
  (overrides, message) => {
    expect(() => renderToStaticMarkup(<MotionTemplate {...props} {...overrides} />)).toThrow(
      new Error(`myth-fact: ${message}`),
    );
  },
);
