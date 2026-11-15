import { expect } from "@playwright/test";

import { keys, open, settle, test } from "./fixtures/transitions";

test("Presenter controls animate the audience while the presenter stays still", async ({
  page,
}) => {
  await open(page);
  const popup = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await popup;
  await expect(presenter.getByRole("region", { name: "Current slide" })).toBeVisible();
  await keys(presenter, ["ArrowRight"]);
  await expect(page).toHaveURL(/#\/18$/);
  await settle(page);
  await settle(presenter);
  await expect.poll(() => page.evaluate(() => window.e2eTransitionAttributes)).toContain("push");
  await expect.poll(() => page.evaluate(() => window.e2eNavAttributes)).toContain("forward");
  await expect(presenter.locator("html")).not.toHaveAttribute("data-deck-transition");
  await expect(presenter.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  await expect.poll(() => presenter.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
});
