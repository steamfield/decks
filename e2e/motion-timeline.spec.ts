import { expect } from "@playwright/test";

import { test } from "./fixtures/motion.fixture";
import { position } from "./fixtures/motion-gallery";

test("A rapid second timeline click continues from the visible pose and ends at beat two.", async ({
  page,
}) => {
  await page.goto("/#/15");
  await position(page, 15);
  const svg = page.getByRole("img", { name: "Three beats move and recolor two shapes" });
  const samples = svg.evaluate(async (element) => {
    const group = element.querySelector("g");
    if (!group) throw new Error("Missing timeline shapes");
    const frames: number[] = [];
    const read = () => Number(group.getAttribute("transform")?.match(/translate\(([-\d.]+)/)?.[1]);
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
    );
    while (read() === 140) await new Promise<void>((done) => requestAnimationFrame(() => done()));
    const before = read();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
    );
    const retargeted = read();
    frames.push(before, retargeted);
    while (read() < 780) {
      await new Promise<void>((done) =>
        requestAnimationFrame(() => {
          frames.push(read());
          done();
        }),
      );
    }
    return { before, retargeted, frames };
  });
  const { before, retargeted, frames } = await samples;
  expect(before).toBeGreaterThan(140);
  expect(before).toBeLessThan(460);
  expect(retargeted).toBe(before);
  expect(frames.at(-1)).toBe(780);
  expect(frames.every((value, index) => value >= (frames[index - 1] ?? 140))).toBe(true);
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

test("useTween updates its SVG attribute on each active frame and stops at the endpoint.", async ({
  page,
}) => {
  await page.goto("/#/16");
  await position(page, 16);
  const result = await page
    .getByRole("img", { name: "A circle grows from radius 48 to 180" })
    .evaluate(async (svg) => {
      const circle = svg.querySelector("circle:last-of-type");
      if (!circle) throw new Error("Missing tween circle");
      const read = () => Number(circle.getAttribute("r"));
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
      );
      const values: number[] = [];
      while (read() < 180) {
        await new Promise<void>((done) =>
          requestAnimationFrame(() => {
            values.push(read());
            done();
          }),
        );
      }
      const idle: number[] = [];
      for (let i = 0; i < 10; i++)
        await new Promise<void>((done) =>
          requestAnimationFrame(() => {
            idle.push(read());
            done();
          }),
        );
      return { values, idle };
    });
  const active = result.values.filter((value) => value > 48 && value < 180);
  expect(new Set(active).size).toBeGreaterThanOrEqual(3);
  expect(
    result.values.every((value, index) => index === 0 || value >= (result.values[index - 1] ?? 0)),
  ).toBe(true);
  expect(result.idle).toEqual(Array(10).fill(180));
});
