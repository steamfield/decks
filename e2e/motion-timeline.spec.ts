import { expect } from "@playwright/test";

import { motionClockURL, test } from "./fixtures/motion.fixture";
import { position } from "./fixtures/motion-gallery";

test("A rapid second timeline click continues from the visible pose and ends at beat two.", async ({
  page,
}) => {
  await page.goto("/#/15");
  await position(page, 15);
  const svg = page.getByRole("img", { name: "Three beats move and recolor two shapes" });
  const result = await svg.evaluate(async (element, clockURL) => {
    const { gsap, duration } = await import(clockURL);
    const group = element.querySelector("g");
    if (!group) throw new Error("Missing timeline shapes");
    const read = () => Number(group.getAttribute("transform")?.match(/translate\(([-\d.]+)/)?.[1]);
    const press = () => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight" }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight" }));
    };
    const clock = gsap.globalTimeline;
    clock.pause();
    try {
      press();
      await Promise.resolve();
      const start = clock.time();
      clock.time(start + duration.slow / 2);
      await Promise.resolve();
      const before = read();
      press();
      await Promise.resolve();
      const retargeted = read();
      const frames = [before, retargeted];
      for (const elapsed of [duration.slow / 4, duration.slow / 2, duration.slow]) {
        clock.time(start + duration.slow / 2 + elapsed);
        await Promise.resolve();
        frames.push(read());
      }
      return { before, retargeted, frames };
    } finally {
      clock.resume();
    }
  }, motionClockURL);
  await page.evaluate(() => window.__deck?.settled());
  expect(result.before).toBeGreaterThan(140);
  expect(result.before).toBeLessThan(460);
  expect(result.retargeted).toBe(result.before);
  expect(result.frames.at(-1)).toBe(780);
  expect(result.frames.every((value, index) => value >= (result.frames[index - 1] ?? 140))).toBe(
    true,
  );
  await position(page, 15, 2);
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
  await page.goto("/#/15?clicks=2");
  await position(page, 15, 2);
  await page.reload();
  await position(page, 15, 2);
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "motionPaints")))
    .toEqual(["translate(780 260)"]);
});

test("useTween paints intermediate SVG radii and settles at the endpoint.", async ({ page }) => {
  await page.goto("/#/16");
  await position(page, 16);
  const result = await page
    .getByRole("img", { name: "A circle grows from radius 48 to 180" })
    .evaluate(async (svg, clockURL) => {
      const { gsap, duration } = await import(clockURL);
      const circle = svg.querySelector("circle:last-of-type");
      if (!circle) throw new Error("Missing tween circle");
      const clock = gsap.globalTimeline;
      clock.pause();
      try {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight" }),
        );
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight" }));
        await Promise.resolve();
        const start = clock.time();
        const values: number[] = [];
        for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
          clock.time(start + duration.slow * progress);
          await Promise.resolve();
          values.push(Number(circle.getAttribute("r")));
        }
        return values;
      } finally {
        clock.resume();
      }
    }, motionClockURL);
  await page.evaluate(() => window.__deck?.settled());
  expect(result[0]).toBe(48);
  expect(result.at(-1)).toBe(180);
  expect(result.slice(1, -1).every((value) => value > 48 && value < 180)).toBe(true);
  expect(result.every((value, index) => value >= (result[index - 1] ?? 48))).toBe(true);
  await expect(
    page
      .getByRole("img", { name: "A circle grows from radius 48 to 180" })
      .locator("circle")
      .last(),
  ).toHaveAttribute("r", "180");
});
