import { isInaccessible, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "quote-card",
  quote: "One missed handoff can hold up the whole crew.",
  source: "Shift supervisor, demo interview",
} as const;
const part = () => screen.getByText(props.source);
beforeEach(() => installTheme(resolveTheme()));

it("quote-card hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={2} />);
  expect(part()).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(part()).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(part()).toBeVisible();
  await view.previous();
  await tick(1.2);
  expect(part()).not.toBeVisible();
});

it("the quote-card entrance in the live slide plays and settles within about 1.2 s of virtual time per beat", async () => {
  await setup(() => <MotionTemplate {...props} />);
  expect(part()).not.toBeVisible();
  const element = part();
  if (!element) throw new Error("Missing entrance text");
  const opacities = [];
  for (let frame = 0; frame < 12; frame++) {
    await tick(0.1);
    opacities.push(Number(getComputedStyle(element).opacity));
  }
  expect(opacities.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
  expect(part()).toHaveStyle({ opacity: "1" });
});

it("quote-card shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} at={1} />, { click: 1, context: "print" });
  expect(part()).toHaveStyle({ opacity: "1" });
  expect(part()).toBeVisible();
});

it("reads the split quote once as the whole sentence and leaves it whole after unmount", async () => {
  const view = await setup(() => <MotionTemplate {...props} />, { instant: true });
  const heading = screen.getByRole("heading", { name: props.quote });
  expect(heading.children.length).toBeGreaterThan(1);
  for (const word of heading.children) expect(isInaccessible(word)).toBe(true);
  view.unmount();
  expect(Array.from(heading.childNodes, (node) => node.nodeValue)).toEqual([props.quote]);
});

it.each([
  [{ at: -1 }, "quote-card: invalid at -1"],
  [{ at: 1.5 }, "quote-card: invalid at 1.5"],
  [{ quote: " " }, 'quote-card: invalid quote " "'],
  [{ source: " " }, 'quote-card: invalid source " "'],
] as const)(
  "quote-card throws naming itself and the prop for invalid input %j",
  async (invalid, message) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(message)]);
  },
);

it("reveals a Japanese quote word by word while keeping its original accessible name", async () => {
  const quote = "終電が駅に着いた。";
  await setup(() => <MotionTemplate {...props} quote={quote} />);
  await tick(0.25);
  const heading = screen.getByRole("heading", { name: quote });
  const visible = Array.from(heading.children)
    .filter((part) => Number(getComputedStyle(part).opacity) > 0)
    .map((part) => part.textContent)
    .join("");
  expect(visible.length).toBeGreaterThan(0);
  expect(visible.length).toBeLessThan(quote.length);
  expect(quote.startsWith(visible)).toBe(true);
  await tick(0.95);
  expect(heading.textContent).toBe(quote);
});
