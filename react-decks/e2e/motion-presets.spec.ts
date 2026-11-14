import { expect } from "@playwright/test";

import { test } from "./fixtures/motion.fixture";
import { position, settled } from "./fixtures/motion-gallery";

test("Each preset starts hidden and settles into its natural pose.", async ({ page }) => {
  for (let no = 2; no <= 7; no++) {
    await page.goto(`/#/${no}`);
    await position(page, no);
    const step = page.locator("[data-deck-active] [data-step-state]");
    if (no === 7) await expect(step).toHaveCSS("clip-path", "inset(0px 100% 0px 0px)");
    else await expect(step).toHaveCSS("opacity", "0");
    await page.keyboard.press("ArrowRight");
    await position(page, no, 1);
    await settled(page, no, 1);
    await expect(step).toHaveCSS("opacity", "1");
    await expect(step).toHaveCSS("transform", "none");
    await expect(step).toHaveCSS("filter", "none");
    await expect(step).toHaveCSS("clip-path", no === 7 ? "inset(0px)" : "none");
    await expect(step).toHaveCSS("visibility", "visible");
  }
});
