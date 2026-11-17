import { expect } from "@playwright/test";
import { settled, test } from "./fixtures/deck.fixture";

test("the corner reveals the tray, keyboard focus keeps it visible, and the idle cursor stays visible over it", async ({
  page,
}) => {
  await page.goto("/#/2");
  const tray = page.getByRole("toolbar", { name: "Deck controls" });
  await page.mouse.move(600, 300);
  await expect(tray).toHaveCSS("opacity", "0");
  await page.mouse.move(800, 400);
  await expect(tray).toHaveCSS("opacity", "0");
  await page.mouse.move(4, 716);
  await expect(tray).toHaveCSS("opacity", "1");
  await page.mouse.move(600, 300);
  await expect(tray).toHaveCSS("opacity", "0");
  await page.keyboard.press("Shift+Tab");
  await expect(tray.getByRole("button", { name: "Larger text" })).toBeFocused();
  await expect(tray).toHaveCSS("opacity", "1");
  await tray.getByRole("button", { name: "Next", exact: true }).hover();
  await page.clock.install();
  await page.clock.fastForward(4000);
  await expect(page.locator("html")).toHaveAttribute("data-deck-idle", "");
  await expect(tray.getByRole("button", { name: "Next", exact: true })).toHaveCSS(
    "cursor",
    "pointer",
  );
});

test("tray navigation advances both windows, keeps native Space activation, and releases focus on leaving", async ({
  page,
  context,
}) => {
  await page.goto("/#/2");
  const tray = page.getByRole("toolbar", { name: "Deck controls" });
  const opened = page.waitForEvent("popup");
  await tray.getByRole("button", { name: "Open presenter" }).click();
  const presenter = await opened;
  await expect(presenter.getByRole("region", { name: "Current slide" })).toBeVisible();
  await expect(presenter).toHaveURL(/#\/presenter\/2$/);
  await presenter.keyboard.press("o");
  await tray.getByRole("button", { name: "Open presenter" }).click();
  await expect(presenter.getByRole("button", { name: "Slide 2: Three steps" })).toBeFocused();
  await expect.poll(() => presenter.evaluate(() => document.hasFocus())).toBe(true);
  expect(context.pages()).toHaveLength(2);
  await expect(presenter).toHaveURL(/#\/overview\/2$/);
  await presenter.keyboard.press("Escape");
  const next = tray.getByRole("button", { name: "Next", exact: true });
  await next.click({ clickCount: 3 });
  await expect(page).toHaveURL(/#\/2\?clicks=3$/);
  await expect(presenter).toHaveURL(/#\/presenter\/2\?clicks=3$/);
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/#\/3$/);
  await expect(presenter).toHaveURL(/#\/presenter\/3$/);
  await page.mouse.move(600, 300);
  await expect(next).not.toBeFocused();
  await expect(tray).toHaveCSS("opacity", "0");
  await page.keyboard.press("Space");
  await expect(page).toHaveURL(/#\/4$/);
  await expect(presenter).toHaveURL(/#\/presenter\/4$/);
  await settled(page);
});

test("the fullscreen button enters and exits document fullscreen", async ({ page }) => {
  await page.goto("/#/2");
  const tray = page.getByRole("toolbar", { name: "Deck controls" });
  await tray.getByRole("button", { name: "Enter fullscreen" }).click();
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement === document.documentElement))
    .toBe(true);
  await tray.getByRole("button", { name: "Exit fullscreen" }).click();
  await expect.poll(() => page.evaluate(() => document.fullscreenElement === null)).toBe(true);
});

test("a narrow window keeps every tray control reachable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/#/2");
  const tray = page.getByRole("toolbar", { name: "Deck controls" });
  await page.mouse.move(4, 636);
  await expect(tray).toHaveCSS("opacity", "1");
  for (const button of await tray.getByRole("button").all()) {
    await expect(button).toBeInViewport({ ratio: 1 });
  }
  await tray.getByRole("button", { name: "Larger text" }).click();
  await expect(page.locator("#deck-frame")).toHaveCSS("--deck-text-scale", "1.1");
});

test("embedded and bridge decks have no tray, and returning from overview restores the hidden tray", async ({
  page,
}) => {
  const tray = page.getByRole("toolbar", { name: "Deck controls" });
  for (const query of ["embedded", "decks-bridge"]) {
    await page.goto(`/?${query}#/2`);
    await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
    await expect(tray).toHaveCount(0);
  }
  await page.goto("/#/2");
  await page.mouse.move(600, 300);
  await page.keyboard.press("o");
  await expect(tray).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(tray).toHaveCSS("opacity", "0");
  await page.mouse.move(4, 716);
  await expect(tray).toHaveCSS("opacity", "1");
});
