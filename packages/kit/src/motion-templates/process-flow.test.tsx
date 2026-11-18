import { type RenderContext, SlideHost, useSlide } from "@react-decks/runtime";
import { act, screen } from "@testing-library/react";
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

it("each template hides its parts before click at and shows the finished pose from click at", async () => {
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

it("each template with at 0 shows the finished pose outside the live slide", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "preview" });
  expect(first()).toBeVisible();
  expect(last()).not.toBeVisible();
});

function ChangingContext({ context }: { context: RenderContext | "instant" }) {
  const slide = useSlide();
  if (context !== "instant" && slide.renderContext === "slide" && slide.clicks > 0)
    return <SlideHost no={1} context={context} clicks={slide.clicks} />;
  return <MotionTemplate {...props} at={2} />;
}

it.each(["presenter", "preview", "overview", "print", "instant"] as const)(
  "presenter, preview, overview, print and instant mode show the finished pose for the click with no tween (%s)",
  async (context) => {
    const view = await setup(() => <ChangingContext context={context} />, {
      instant: context === "instant",
    });
    await view.next();
    expect(first()).not.toBeVisible();
    act(() => view.store.dispatch({ type: "next" }));
    expect(first()).toBeVisible();
  },
);

it("text is read once as the full sentence and is whole after unmount", async () => {
  const view = await setup(() => <MotionTemplate {...props} />, { instant: true });
  const sentence = screen.getByText("Scan the boarding pass.", { exact: true });
  view.unmount();
  expect(Array.from(sentence.childNodes, (node) => node.nodeValue)).toEqual([
    "Scan the boarding pass.",
  ]);
});

it("timeline-sweep and process-flow show item i from click at plus i", async () => {
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
  "each template throws naming itself and the prop for empty required text, an empty list, a negative at and a list over its limit (%j)",
  (overrides, message) => {
    expect(() => renderToStaticMarkup(<MotionTemplate {...props} {...overrides} />)).toThrow(
      new Error(`process-flow: ${message}`),
    );
  },
);
