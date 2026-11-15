import { expect } from "@playwright/test";

import { test } from "./fixtures/motion.fixture";
import { position, settled, slideNo } from "./fixtures/motion-gallery";

const [first, wipe] = [slideNo("fade"), slideNo("wipe")];

test("Each preset starts hidden and settles into its natural pose.", async ({ page }) => {
  for (let no = first; no <= wipe; no++) {
    await page.goto(`/#/${no}`);
    await position(page, no);
    const step = page.locator("[data-deck-active] [data-step-state]");
    if (no === wipe) await expect(step).toHaveCSS("clip-path", "inset(0px 100% 0px 0px)");
    else await expect(step).toHaveCSS("opacity", "0");
    await page.keyboard.press("ArrowRight");
    await position(page, no, 1);
    await settled(page, no, 1);
    await expect(step).toHaveCSS("opacity", "1");
    await expect(step).toHaveCSS("transform", "none");
    await expect(step).toHaveCSS("filter", "none");
    await expect(step).toHaveCSS("clip-path", no === wipe ? "inset(0px)" : "none");
    await expect(step).toHaveCSS("visibility", "visible");
  }
});
