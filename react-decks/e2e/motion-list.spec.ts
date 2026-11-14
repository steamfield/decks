import { expect } from "@playwright/test";
import { test } from "./motion.fixture";

test("The markdown Steps list reveals one top-level item on each click.", async ({ page }) => {
  await page.goto("/#/8");
  await expect(page.getByRole("heading", { name: "Steps", exact: true })).toBeVisible();
  const list = page.getByRole("list");
  await expect(list).toHaveCount(1);
  await expect(list.locator(":scope > li")).toHaveCount(4);
  for (let click = 0; click <= 4; click++) {
    await expect(list.getByRole("listitem")).toHaveCount(click);
    if (click < 4) await page.keyboard.press("ArrowRight");
  }
});
