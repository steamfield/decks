import { fireEvent, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "device-mockup",
  src: "/trail-desk.svg",
  alt: "Trail Desk showing the lake and ridge patrols",
  caption: "Both crews can read the handoff before they leave.",
  device: "laptop",
} as const;

const text = () => screen.getByText(props.caption);
const image = () => screen.getByAltText(props.alt);
function load(width = 640, height = 480) {
  const img = image();
  Object.defineProperties(img, {
    naturalWidth: { value: width },
    naturalHeight: { value: height },
  });
  fireEvent.load(img);
}
beforeEach(() => installTheme(resolveTheme()));

it("device-mockup hides its parts before click at and shows the finished pose from click at", async () => {
  const view = await setup(() => <MotionTemplate {...props} at={2} />);
  load();
  await view.next();
  await tick(1.2);
  expect(image()).not.toBeVisible();
  expect(text()).not.toBeVisible();
  await view.next();
  await tick(1.2);
  expect(image()).toBeVisible();
  expect(text()).toBeVisible();
  await view.previous();
  await tick(1.2);
  expect(image()).not.toBeVisible();
  expect(text()).not.toBeVisible();
});

it("the device-mockup entrance in the live slide plays and settles within about 1.2 s of virtual time", async () => {
  await setup(() => <MotionTemplate {...props} />);
  await tick(2);
  load();
  expect(text()).not.toBeVisible();
  const poses = [];
  for (let frame = 0; frame < 12; frame++) {
    await tick(0.1);
    poses.push(Number(getComputedStyle(text()).opacity));
    if (frame === 1) {
      const opacity = Number(getComputedStyle(image()).opacity);
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThan(1);
    }
  }
  expect(poses.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
  expect(poses.at(-1)).toBe(1);
  expect(image()).toHaveStyle({ opacity: "1" });
  expect(image()).toBeVisible();
});

it("device-mockup shows its finished pose for the click in print", async () => {
  await setup(() => <MotionTemplate {...props} at={1} />, { click: 1, context: "print" });
  load();
  expect(text()).toBeVisible();
  expect(image()).toBeVisible();
  expect(text()).toHaveStyle({ opacity: "1" });
});

it.each(["error", "zero-width", "zero-height"] as const)(
  "an image that errors shows the text, no frame, and one warning naming src (%s)",
  async (failure) => {
    const warnings: string[] = [];
    using _capture = vi
      .spyOn(console, "warn")
      .mockImplementation((msg) => warnings.push(String(msg)));
    const view = await setup(() => <MotionTemplate {...props} at={1} />, { instant: true });
    if (failure === "error") fireEvent.error(image());
    else load(failure === "zero-width" ? 0 : 640, failure === "zero-height" ? 0 : 480);
    expect(text()).not.toBeVisible();
    await view.next();
    expect(text()).toBeVisible();
    expect(screen.queryByAltText(props.alt)).toBeNull();
    const fallback = screen.getByRole("figure", { name: props.alt });
    expect(fallback).toBeVisible();

    expect(warnings).toEqual([`device-mockup: could not load ${props.src}`]);
  },
);

it.each([
  [{ at: -1 }, "device-mockup: invalid at -1"],
  [{ at: 1.5 }, "device-mockup: invalid at 1.5"],
  [{ src: " " }, 'device-mockup: invalid src " "'],
  [{ alt: "" }, 'device-mockup: invalid alt ""'],
] as const)(
  "device-mockup throws naming itself and the prop for invalid input %j",
  async (invalid, message) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(message)]);
  },
);

it.each(["src", "alt"] as const)("names an omitted %s in the render error", async (field) => {
  const incomplete = { ...props };
  Reflect.deleteProperty(incomplete, field);
  const { errors } = await setup(() => <MotionTemplate {...incomplete} />, { error: true });
  expect(errors).toEqual([new Error(`device-mockup: invalid ${field} undefined`)]);
});
