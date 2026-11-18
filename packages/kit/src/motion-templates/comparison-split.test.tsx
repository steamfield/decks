import { screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";
import type { TemplateProps } from "./motion-template-props";

const props: TemplateProps<"comparison-split"> = {
  template: "comparison-split",
  left: { title: "Paper tickets", points: ["Queue at the kiosk.", "Keep the stub."] },
  right: { title: "Mobile passes", points: ["Book from home.", "Scan at the gate."] },
};
const first = () => screen.getByText("Paper tickets", { exact: true });
const last = () => screen.getByText("Mobile passes", { exact: true });

beforeEach(() => installTheme(resolveTheme()));

it("comparison-split hides its parts before click at and shows the finished pose from click at", async () => {
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

it("comparison-split shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "print" });
  expect(first()).toBeVisible();
  expect(last()).not.toBeVisible();
});

it("comparison-split shows the second beat from click at plus 1", async () => {
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
  ...["left", "right"].flatMap(
    (side) =>
      [
        [{ [side]: { title: "", points: ["Board"] } }, `${side}.title must contain text, got ""`],
        [
          { [side]: { title: "Dock", points: [] } },
          `${side}.points must contain 1 to 4 entries, got 0`,
        ],
        [
          { [side]: { title: "Dock", points: Array(5).fill("Board") } },
          `${side}.points must contain 1 to 4 entries, got 5`,
        ],
        [
          { [side]: { title: "Dock", points: [" "] } },
          `${side}.points[0] must contain text, got " "`,
        ],
      ] satisfies [Partial<typeof props>, string][],
  ),
];

it.each(invalid)(
  "comparison-split throws naming itself and the prop for invalid input %j",
  (overrides, message) => {
    expect(() => renderToStaticMarkup(<MotionTemplate {...props} {...overrides} />)).toThrow(
      new Error(`comparison-split: ${message}`),
    );
  },
);
