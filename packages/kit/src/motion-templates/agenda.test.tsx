import { screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "agenda",
  items: ["Field notes", "Handoff gaps", "Trial run"],
  current: 2,
} as const;
const part = () => screen.getByText("Handoff gaps").closest("li");
beforeEach(() => installTheme(resolveTheme()));

it("agenda hides its parts before click at and shows the finished pose from click at", async () => {
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

it("the agenda entrance in the live slide plays and settles within about 1.2 s of virtual time per beat", async () => {
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

it("agenda shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} at={1} />, { click: 1, context: "print" });
  expect(part()).toHaveStyle({ opacity: "1" });
  expect(part()).toBeVisible();
});

it.each([
  [{ at: -1 }, "agenda: invalid at -1"],
  [{ at: 1.5 }, "agenda: invalid at 1.5"],
  [{ items: [] }, "agenda: invalid items []"],
  [{ items: [" "] }, 'agenda: invalid items[0] " "'],
  [
    { items: Array(8).fill("Item") },
    'agenda: invalid items ["Item","Item","Item","Item","Item","Item","Item","Item"]',
  ],
] as const)(
  "agenda throws naming itself and the prop for invalid input %j",
  async (invalid, message) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(message)]);
  },
);

it("agenda checks off items before current and marks current as the step", async () => {
  await setup(() => <MotionTemplate {...props} />, { instant: true });
  const [done, current, later] = screen.getAllByRole("listitem");
  expect(done).toHaveTextContent("✓");
  expect(current).toHaveAttribute("aria-current", "step");
  expect(current).not.toHaveTextContent("✓");
  expect(later).not.toHaveAttribute("aria-current");
  expect(later).not.toHaveTextContent("✓");
});

it.each([0, 4, 1.5])("agenda throws for current outside the list: %s", async (current) => {
  const { errors } = await setup(() => <MotionTemplate {...props} current={current} />, {
    error: true,
  });
  expect(errors).toEqual([new Error(`agenda: invalid current ${current}`)]);
});

it("highlights the seventh and last section", async () => {
  const items = Array.from({ length: 7 }, (_, index) => String(index + 1));
  await setup(() => <MotionTemplate {...props} items={items} current={7} />, { instant: true });
  expect(screen.getAllByRole("listitem")).toHaveLength(7);
  expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("7");
});
