import { expect } from "@playwright/test";
import { test } from "./motion.fixture";

test("A span Step applies its scale to the rendered box.", async ({ page }) => {
  await page.goto("/#/5");
  await expect(page.getByRole("heading", { name: "Step / scale", exact: true })).toBeVisible();
  const step = page.locator("[data-deck-active] [data-step-state]");
  const before = await step.evaluate((element) => element.getBoundingClientRect().width);
  await page.keyboard.press("ArrowRight");
  await expect(step).toHaveCSS("transform", "none");
  const natural = await step.evaluate((element) => element.getBoundingClientRect().width);
  expect(natural).toBeGreaterThan(0);
  expect(before / natural).toBeCloseTo(0.92, 2);
});
