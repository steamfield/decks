import { isInaccessible, screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "section-wipe",
  number: "02",
  title: "Where the handoff breaks",
} as const;
// The title is split into masked words, so it is found by the label SplitText gives it.
const part = () => screen.getByLabelText(props.title);
beforeEach(() => installTheme(resolveTheme()));

it("section-wipe hides its parts before click at and shows the finished pose from click at", async () => {
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

it("the section-wipe entrance in the live slide plays and settles within about 1.2 s of virtual time per beat", async () => {
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

it("reads the number as text rather than as a label on a block", async () => {
  await setup(() => <MotionTemplate {...props} />, { instant: true });
  expect(isInaccessible(screen.getByText(props.number))).toBe(false);
  expect(screen.queryByLabelText(props.number)).toBeNull();
});

it("section-wipe shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} at={1} />, { click: 1, context: "print" });
  expect(part()).toHaveStyle({ opacity: "1" });
  expect(part()).toBeVisible();
});

it.each([
  [{ at: -1 }, "section-wipe: invalid at -1"],
  [{ at: 1.5 }, "section-wipe: invalid at 1.5"],
  [{ number: " " }, 'section-wipe: invalid number " "'],
  [{ title: " " }, 'section-wipe: invalid title " "'],
] as const)(
  "section-wipe throws naming itself and the prop for invalid input %j",
  async (invalid, message) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(message)]);
  },
);
