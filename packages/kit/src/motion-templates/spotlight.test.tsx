import { fireEvent, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";
import type { TemplateProps } from "./motion-template-props";

const props: TemplateProps<"spotlight"> = {
  template: "spotlight",
  src: "/field.svg",
  alt: "Six paths meeting at a buoy",
  x: 0.54,
  y: 0.5,
  label: "Harbour entrance",
};
const first = () => screen.getByAltText(props.alt);

beforeEach(() => installTheme(resolveTheme()));

it("spotlight hides its parts before click at and shows the finished pose from click at", async () => {
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

it("spotlight shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "print" });
  expect(first()).toBeVisible();
});

const invalid: [Partial<typeof props>, string][] = [
  [{ at: -1 }, "at must be a non-negative whole number, got -1"],
  [{ at: Infinity }, "at must be a non-negative whole number, got Infinity"],
  ...["src", "alt", "label"].map((key): [Partial<typeof props>, string] => [
    { [key]: "" },
    `${key} must contain text, got ""`,
  ]),
  ...["x", "y"].flatMap((key) =>
    [-0.01, 1.01, NaN].map((value): [Partial<typeof props>, string] => [
      { [key]: value },
      `${key} must be between 0 and 1, got ${value}`,
    ]),
  ),
];

it.each(invalid)(
  "spotlight throws naming itself and the prop for invalid input %j",
  (overrides, message) => {
    expect(() => renderToStaticMarkup(<MotionTemplate {...props} {...overrides} />)).toThrow(
      new Error(`spotlight: ${message}`),
    );
  },
);

it("holds the label until the image loads or fails", async () => {
  await setup(() => <MotionTemplate {...props} />, { instant: true });
  expect(screen.getByText(props.label)).not.toBeVisible();
  fireEvent.error(screen.getByAltText(props.alt));
  expect(screen.getByText(props.label)).toBeVisible();
});
