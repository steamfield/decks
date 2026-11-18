import { screen } from "@testing-library/react";
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

it("quote-card with at 0 shows the finished pose outside the live slide", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "overview" });
  expect(part()).toBeVisible();
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

it.each(["presenter", "preview", "overview", "print", "instant"] as const)(
  "%s shows the finished quote-card pose for the click with no tween",
  async (mode) => {
    await setup(() => <MotionTemplate {...props} at={1} />, {
      click: 1,
      ...(mode === "instant" ? { instant: true } : { context: mode }),
    });
    expect(part()).toHaveStyle({ opacity: "1" });
    expect(part()).toBeVisible();
  },
);

it("text is read once as the full sentence and is whole after unmount", async () => {
  const view = await setup(() => <MotionTemplate {...props} />, { instant: true });
  const text = screen.getByRole("heading", { name: props.quote });
  expect(text).toHaveTextContent("One missed handoff can hold up the whole crew.");
  const split = text;
  expect(split).toHaveAccessibleName(props.quote);
  view.unmount();
  expect(split.childNodes).toHaveLength(1);
  expect(split.textContent).toBe(props.quote);
});

it.each([
  [{ at: -1 }, "quote-card: invalid at -1"],
  [{ at: Number.NaN }, "quote-card: invalid at NaN"],
  [{ at: Infinity }, "quote-card: invalid at Infinity"],
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
