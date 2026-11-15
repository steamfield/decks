import { expect } from "@playwright/test";
import { expectMonotone, record } from "./fixtures/deck.fixture";
import { test } from "./fixtures/motion.fixture";
import { position, slideNo } from "./fixtures/motion-gallery";

const timeline = slideNo("timeline");

test("A rapid second timeline click continues from the visible pose and ends at beat two.", async ({
  page,
  deck,
  motionClock,
}) => {
  await deck.goto(15);
  const group = page
    .getByRole("img", { name: "Three beats move and recolor two shapes" })
    .locator("g");
  const read = (element: Element) =>
    Number(element.getAttribute("transform")?.match(/translate\(([-\d.]+)/)?.[1]);
  await motionClock.pauseAt();
  const recording = await record(group, read, motionClock.settle);
  await deck.press("ArrowRight");
  await motionClock.step(200);
  const before = await group.evaluate(read);
  await deck.press("ArrowRight");
  const retargeted = await group.evaluate(read);
  expect(before).toBeGreaterThan(140);
  expect(before).toBeLessThan(460);
  expect(retargeted).toBe(before);
  expectMonotone(await recording.log(), 140, 780);
  await position(page, timeline, 2);
});

test("Reloading timeline click two paints the click-two pose in its first frame.", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const frames: string[] = [];
    Reflect.set(window, "motionPaints", frames);
    const frame = () => {
      const group = document.querySelector("[data-deck-active] svg g");
      if (group) frames.push(group.getAttribute("transform") ?? "missing");
      if (!frames.length) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await page.goto(`/#/${timeline}?clicks=2`);
  await position(page, timeline, 2);
  await page.reload();
  await position(page, timeline, 2);
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "motionPaints")))
    .toEqual(["translate(780 260)"]);
});

test("useTween paints intermediate SVG radii and settles at the endpoint.", async ({
  page,
  deck,
  motionClock,
}) => {
  await deck.goto(16);
  const circle = page
    .getByRole("img", { name: "A circle grows from radius 48 to 180" })
    .locator("circle")
    .last();
  await motionClock.pauseAt();
  const recording = await record(
    circle,
    (element) => Number(element.getAttribute("r")),
    motionClock.settle,
  );
  await deck.press("ArrowRight");
  expectMonotone(await recording.log(), 48, 180);
  await expect(circle).toHaveAttribute("r", "180");
});
