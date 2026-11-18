import { screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";
import type { TemplateProps } from "./motion-template-props";

const props: TemplateProps<"timeline-sweep"> = {
  template: "timeline-sweep",
  events: [
    { date: "April", label: "Dock trials begin." },
    { date: "June", label: "Passenger service opens." },
    { date: "July", label: "The evening route opens." },
  ],
};
const first = () => screen.getByText("Dock trials begin.", { exact: true });
const last = () => screen.getByText("The evening route opens.", { exact: true });

beforeEach(() => installTheme(resolveTheme()));

it("timeline-sweep hides its parts before click at and shows the finished pose from click at", async () => {
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

it("timeline-sweep shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "print" });
  expect(first()).toBeVisible();
  expect(last()).not.toBeVisible();
});

it("timeline-sweep shows item i from click at plus i", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={1} />, { click: 1, instant: true });
  expect(first()).toBeVisible();
  expect(last()).not.toBeVisible();
  const middle = screen.getByText("Passenger service opens.", { exact: true });
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
  [{ events: [] }, "events must contain 1 to 6 entries, got 0"],
  [{ events: Array(7).fill(props.events[0]) }, "events must contain 1 to 6 entries, got 7"],
  [
    { events: [{ date: "", label: "Dock trials begin." }] },
    'events[0].date must contain text, got ""',
  ],
  [{ events: [{ date: "May", label: " " }] }, 'events[0].label must contain text, got " "'],
];

it.each(invalid)(
  "timeline-sweep throws naming itself and the prop for invalid input %j",
  (overrides, message) => {
    expect(() => renderToStaticMarkup(<MotionTemplate {...props} {...overrides} />)).toThrow(
      new Error(`timeline-sweep: ${message}`),
    );
  },
);
