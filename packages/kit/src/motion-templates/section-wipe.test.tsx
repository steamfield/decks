import { screen } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "section-wipe",
  number: "02",
  title: "Where the handoff breaks",
} as const;
const part = () => screen.getByText(props.title);
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

it("section-wipe with at 0 shows the finished pose outside the live slide", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "overview" });
  expect(part()).toBeVisible();
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

it.each(["presenter", "preview", "overview", "print", "instant"] as const)(
  "%s shows the finished section-wipe pose for the click with no tween",
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
  const text = screen.getByRole("heading", { name: props.title });
  expect(text).toHaveTextContent("Where the handoff breaks");
  view.unmount();
  expect(text.textContent).toBe("Where the handoff breaks");
});

it.each([
  [{ at: -1 }, "section-wipe: invalid at -1"],
  [{ at: Number.NaN }, "section-wipe: invalid at NaN"],
  [{ at: Infinity }, "section-wipe: invalid at Infinity"],
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
