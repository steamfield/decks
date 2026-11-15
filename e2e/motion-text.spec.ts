import { expect } from "@playwright/test";
import { test } from "./fixtures/motion.fixture";
import { slideNo } from "./fixtures/motion-gallery";

const textChar = slideNo("text-char");

test("Character reveals preserve visible line breaks.", async ({ page, deck }) => {
  await page.goto(`/#/${textChar}`);
  await expect(page.getByRole("heading", { name: "TextReveal / char", exact: true })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await deck.settled();
  const first = page.getByText("S", { exact: true });
  const second = page.getByText("c", { exact: true });
  await expect(first).toBeVisible();
  await expect(second).toBeVisible();
  const top = await first.evaluate((element) => element.getBoundingClientRect().top);
  const nextLine = await second.evaluate((element) => element.getBoundingClientRect().top);
  expect(nextLine).toBeGreaterThan(top);
});
