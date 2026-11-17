import { expect } from "@playwright/test";
import { openLive, shellRows, test } from "./fixtures/live-term";

test("clicking into the pane gives it the keys and Escape gives them back to the deck", async ({
  page,
  liveServer,
}) => {
  await openLive(page, liveServer.url);
  await page.getByRole("application").click();
  await page.keyboard.press("ArrowRight");
  await expect(page).not.toHaveURL(/clicks=/);
  await expect(shellRows(page).filter({ hasText: /^hello$/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/1\?clicks=1$/);
  await expect(shellRows(page).filter({ hasText: /^hello$/ })).toHaveCount(1);
});

test("leaving the slide and coming back to the same click shows the shell without running a command again", async ({
  page,
  liveServer,
}) => {
  await openLive(page, liveServer.url);
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^hello$/ })).toHaveCount(1);
  await page.keyboard.press("ArrowDown");
  await expect(page).toHaveURL(/#\/2$/);
  await page.evaluate(() => {
    window.location.hash = "#/1?clicks=1";
  });
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
  await expect(shellRows(page).filter({ hasText: /^hello$/ })).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^Finish ls:\s*$/ })).toHaveCount(1);
  await page.getByRole("application").click();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowRight");
  // The first command appended to `executions` once: a re-run on return would print 1123.
  await expect(shellRows(page).filter({ hasText: /^executions=123$/ })).toHaveCount(1);
});

test("a second pane on another slide runs its own shell, not the first pane's", async ({
  page,
  liveServer,
}) => {
  await openLive(page, liveServer.url);
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^hello$/ })).toHaveCount(1);
  await page.keyboard.press("ArrowDown");
  await expect(page).toHaveURL(/#\/2$/);
  await expect(page.getByRole("application")).toBeVisible();
  await expect(shellRows(page).filter({ hasText: /^hello$/ })).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^hello$/ })).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(shellRows(page).filter({ hasText: /^Finish ls:\s*$/ })).toHaveCount(1);
  await page.getByRole("application").click();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Escape");
  await page.keyboard.press("ArrowRight");
  // The `executions` file lives in each pane's own directory: a shared shell would print 1123.
  await expect(shellRows(page).filter({ hasText: /^executions=123$/ })).toHaveCount(1);
});
