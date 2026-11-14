import { expect } from "@playwright/test";
import { test } from "./fixtures/motion.fixture";

test("Character reveals preserve visible line breaks.", async ({ page }) => {
  await page.goto("/#/11");
  await expect(page.getByRole("heading", { name: "TextReveal / char", exact: true })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  const first = page.getByText("S", { exact: true });
  const second = page.getByText("c", { exact: true });
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  const top = await first.evaluate((element) => element.getBoundingClientRect().top);
  const nextLine = await second.evaluate((element) => element.getBoundingClientRect().top);
  expect(nextLine).toBeGreaterThan(top);
});
