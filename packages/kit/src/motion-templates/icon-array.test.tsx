import { screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "icon-array",
  total: 4,
  filled: 2,
  label: "Two of the four reviewers",
} as const;
const parts = () => [screen.getByLabelText("2 of 4 highlighted"), screen.getByText(props.label)];
beforeEach(() => installTheme(resolveTheme()));

it("icon-array hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={2} />);
  for (const part of parts()) expect(part).not.toBeVisible();
  await view.next();
  await tick(1.2);
  for (const part of parts()) expect(part).not.toBeVisible();
  await view.next();
  await tick(1.2);
  for (const part of parts()) expect(part).toBeVisible();
  await view.previous();
  await tick(1.2);
  for (const part of parts()) expect(part).not.toBeVisible();
});

it("the icon-array entrance in the live slide plays and settles within about 1.2 s of virtual time", async () => {
  await setup(() => <MotionTemplate {...props} />);
  const [first] = parts();
  if (!first) throw new Error("Missing first part");
  expect(first).not.toBeVisible();
  await tick(0.06);
  const opacity = Number(getComputedStyle(first).opacity);
  expect(opacity).toBeGreaterThan(0);
  expect(opacity).toBeLessThan(1);
  await tick(0.25);
  expect(screen.getByText(props.label)).not.toBeVisible();
  await tick(0.89);
  for (const part of parts()) expect(part).toHaveStyle({ opacity: "1" });
});

it("icon-array shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} at={1} />, { click: 1, context: "print" });
  for (const part of parts()) expect(part).toHaveStyle({ opacity: "1" });
});

it.each([
  [{ at: -1 }, "icon-array: invalid at -1"],
  [{ at: 0.5 }, "icon-array: invalid at 0.5"],
  [{ label: " " }, 'icon-array: invalid label " "'],
] as const)(
  "icon-array throws naming itself and the prop for invalid input %j",
  async (invalid, message) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(message)]);
  },
);

it.each([
  [{ filled: -1 }, "filled -1"],
  [{ filled: 5 }, "filled 5"],
  [{ filled: 0.5 }, "filled 0.5"],
  [{ total: 0 }, "total 0"],
  [{ total: 2.5 }, "total 2.5"],
  [{ total: 101 }, "total 101"],
])(
  "icon-array throws for filled outside 0..total or total above 100 (%j)",
  async (invalid, reason) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(`icon-array: invalid ${reason}`)]);
  },
);

it.each([0, 37, 100])(
  "icon-array exposes the highlighted count (%i of 100) without assigning a unit",
  async (filled) => {
    await setup(() => <MotionTemplate {...props} total={100} filled={filled} accent="rose" />, {
      instant: true,
    });
    const grid = screen.getByRole("img", { name: `${filled} of 100 highlighted` });
    expect(grid).toBeVisible();
  },
);
