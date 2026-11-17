import { expect } from "@playwright/test";
import { settled, test } from "./fixtures/deck.fixture";

test.use({ hasTouch: true });

test("a first tap reveals the corner controls and a second tap activates the button", async ({
  page,
}) => {
  await page.goto("/#/2");
  await settled(page);
  const tray = page.getByRole("toolbar", { name: "Deck controls" });
  await expect(tray).toHaveCSS("opacity", "0");
  const previous = tray.getByRole("button", { name: "Previous" });
  const bounds = await previous.boundingBox();
  if (!bounds) throw new Error("Previous button has no visible bounds");
  const x = bounds.x + bounds.width / 2;
  const y = bounds.y + bounds.height / 2;
  await page.touchscreen.tap(x, y);
  await expect(tray).toHaveCSS("opacity", "1");
  await settled(page);
  await expect(page).toHaveURL(/#\/2$/);
  await page.touchscreen.tap(x, y);
  await expect(page).toHaveURL(/#\/1$/);
});
