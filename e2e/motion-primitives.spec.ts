import { expect } from "@playwright/test";

import { test } from "./fixtures/motion.fixture";
import { pauseEntry, position, settled, slideNo } from "./fixtures/motion-gallery";

const [stagger, highlight, countUp, draw] = [
  slideNo("stagger"),
  slideNo("highlight"),
  slideNo("count-up"),
  slideNo("draw"),
];

test("Stagger enters in order with different opacities partway through entry.", async ({
  page,
}) => {
  await page.goto(`/#/${stagger}`);
  await position(page, stagger);
  const items = page.locator("[data-deck-active] [data-step-state] [data-step-state]");
  const paused = await pauseEntry(page);
  await expect(items).toHaveCount(paused);
  const values = await items.evaluateAll((elements) =>
    elements.map((element) => Number(getComputedStyle(element).opacity)),
  );
  expect(values).toHaveLength(4);
  expect(values[0]).toBeGreaterThan(values[3] ?? 0);
  expect(values.every((value, i) => i === 0 || value <= (values[i - 1] ?? 0))).toBe(true);
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation.playState === "paused") animation.finish();
    }
  });
});

test("CountUp shows zero, its final number, and an immediate reset.", async ({ page }) => {
  await page.goto(`/#/${countUp}`);
  await position(page, countUp);
  const number = page.locator('[data-deck-active] span[aria-hidden="true"]');
  await expect(number).toHaveText("0");
  await page.keyboard.press("ArrowRight");
  await expect(number).toHaveText("1,200");
  await page.keyboard.press("ArrowLeft");
  await expect(number).toHaveText("0");
});

test("Highlight keeps its text visible before and after the marker sweep.", async ({ page }) => {
  await page.goto(`/#/${highlight}`);
  await position(page, highlight);
  const mark = page.getByText("the important part", { exact: true });
  for (let click = 0; click <= 2; click++) {
    await settled(page, highlight, click);
    await expect(mark).toHaveCSS("opacity", "1");
    await expect(mark).toHaveCSS("visibility", "visible");
    await expect(mark).toHaveCSS("background-size", click === 1 ? "100% 100%" : "0% 100%");
    if (click < 2) await page.keyboard.press("ArrowRight");
  }
});

test("An SVG Step with a normalized path fades while Draw animates its stroke.", async ({
  page,
}) => {
  await page.goto(`/#/${draw}`);
  await position(page, draw);
  const svg = page.getByRole("img", { name: "A rising curve" });
  const shape = svg.locator("rect");
  const step = shape.locator("..");
  const path = svg.locator("path");
  await expect(step).toHaveCSS("opacity", "0");
  await expect(shape).toHaveCSS("stroke-dasharray", "none");
  await expect(path).toHaveCSS("stroke-dashoffset", "1px");
  await page.keyboard.press("ArrowRight");
  await position(page, draw, 1);
  await settled(page, draw, 1);
  await expect(step).toHaveCSS("opacity", "1");
  await expect(path).toHaveCSS("stroke-dashoffset", "0px");
  await page.keyboard.press("ArrowRight");
  await position(page, draw, 2);
  await settled(page, draw, 2);
  await expect(step).toHaveCSS("opacity", "0");
  await expect(shape).toHaveCSS("stroke-dasharray", "none");
});
