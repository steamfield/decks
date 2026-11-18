import { gsap } from "@react-decks/motion";
import { fireEvent, isInaccessible, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { setup, tick } from "../kit.test-support";
import { installTheme, resolveTheme } from "../theme/theme";
import { MotionTemplate } from "./motion-template";

const props = {
  template: "photo-reveal",
  src: "/north-inlet.svg",
  alt: "Pine silhouettes above the water at North Inlet",
  caption: "Fog rolls through North Inlet.",
  credit: "Field sketch by Mira Chen",
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

it("photo-reveal hides its parts before click at and shows the finished pose from click at", async () => {
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

it("photo-reveal with at 0 shows the finished pose outside the live slide", async () => {
  await setup(() => <MotionTemplate {...props} />, { context: "overview" });
  load();
  expect(image()).toBeVisible();
  expect(text()).toBeVisible();
});

it("the photo-reveal entrance in the live slide plays and settles within about 1.2 s of virtual time", async () => {
  await setup(() => <MotionTemplate {...props} />);
  await tick(2);
  load();
  expect(text()).not.toBeVisible();
  const poses = [];
  for (let frame = 0; frame < 12; frame++) {
    await tick(0.1);
    poses.push(Number(getComputedStyle(text()).opacity));
    if (frame === 1) {
      expect(Number(gsap.getProperty(image(), "scaleX"))).toBeGreaterThan(1);
    }
  }
  expect(poses.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
  expect(poses.at(-1)).toBe(1);
  expect(gsap.getProperty(image(), "scaleX")).toBe(1);
  expect(image()).toBeVisible();
});

it.each(["presenter", "preview", "overview", "print", "instant"] as const)(
  "%s shows the finished photo-reveal pose for the click with no tween",
  async (mode) => {
    await setup(() => <MotionTemplate {...props} at={1} />, {
      click: 1,
      ...(mode === "instant" ? { instant: true } : { context: mode }),
    });
    load();
    expect(text()).toBeVisible();
    expect(image()).toBeVisible();
    expect(text()).toHaveStyle({ opacity: "1" });
  },
);

it("text is read once as the full sentence and is whole after unmount", async () => {
  const view = await setup(() => <MotionTemplate {...props} />, { instant: true });
  load();
  expect(screen.getByRole("img", { name: props.alt })).toBeVisible();
  const sentence = text();
  expect(screen.getByRole("heading", { name: props.caption })).toBe(sentence);
  expect(isInaccessible(sentence)).toBe(false);
  expect(sentence).toBeVisible();
  expect(screen.getByText(props.credit)).toBeVisible();
  view.unmount();
  expect(sentence.textContent).toBe(props.caption);
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
    expect(screen.getByRole("figure", { name: props.alt })).toBeVisible();
    expect(warnings).toEqual([`photo-reveal: could not load ${props.src}`]);
  },
);

it.each([
  [{ at: -1 }, "photo-reveal: invalid at -1"],
  [{ at: 1.5 }, "photo-reveal: invalid at 1.5"],
  [{ at: Infinity }, "photo-reveal: invalid at Infinity"],
  [{ at: NaN }, "photo-reveal: invalid at NaN"],
  [{ src: " " }, 'photo-reveal: invalid src " "'],
  [{ alt: "" }, 'photo-reveal: invalid alt ""'],
  [{ caption: " " }, 'photo-reveal: invalid caption " "'],
] as const)(
  "photo-reveal throws naming itself and the prop for invalid input %j",
  async (invalid, message) => {
    const { errors } = await setup(() => <MotionTemplate {...props} {...invalid} />, {
      error: true,
    });
    expect(errors).toEqual([new Error(message)]);
  },
);

it.each(["src", "alt", "caption"] as const)(
  "names an omitted %s in the render error",
  async (field) => {
    const incomplete = { ...props };
    Reflect.deleteProperty(incomplete, field);
    const { errors } = await setup(() => <MotionTemplate {...incomplete} />, { error: true });
    expect(errors).toEqual([new Error(`photo-reveal: invalid ${field} undefined`)]);
  },
);
