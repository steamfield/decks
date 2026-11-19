import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { guideDemos } from "../src/data/guide-demos";
import { guideId } from "../src/lib/guide";

// motion-templates.md has the most demos: one per template, each a single slide.
const PAGE = `/docs/${guideId("motion-templates.md")}/`;
const demos = guideDemos().filter((demo) => demo.page === "motion-templates.md");
const figure = (page: Page, index: number) =>
  page
    .getByRole("figure")
    .filter({ has: page.locator("[data-deck-demo-player]") })
    .nth(index);
// The player's stage, which the mount script watches; a tall code block below it means
// scrolling the whole figure into view can leave the stage above the viewport.
const stage = (page: Page, index: number) =>
  figure(page, index).locator("[data-deck-demo-player]");
const player = (page: Page, index: number) =>
  figure(page, index).getByRole("group", { name: /^Deck player:/ });

test("a guide demo goes live in view and replays its motion to the last step", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  const live = player(page, 0);
  await stage(page, 0).scrollIntoViewIfNeeded();
  await expect(live.getByRole("status")).toContainText("Live deck", { timeout: 20_000 });
  const counter = live.getByText(/^Step \d+ of \d+$/);
  const last = (await counter.textContent())?.match(/of (\d+)$/)?.[1];
  await expect(counter).toHaveText(`Step ${last} of ${last}`);
  // Record every counter value, so the replay's first step is checked after it has passed.
  await counter.evaluate((element) => {
    const log: string[] = [];
    (window as unknown as { counterLog: string[] }).counterLog = log;
    new MutationObserver(() => log.push(element.textContent ?? "")).observe(element, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  });
  await live.getByRole("button", { name: "Replay" }).click();
  await live.getByRole("button", { name: "Step forward" }).click();
  await expect(counter).toHaveText(`Step ${last} of ${last}`, { timeout: 20_000 });
  expect(
    await page.evaluate(() => (window as unknown as { counterLog: string[] }).counterLog),
  ).toContain(`Step 1 of ${last}`);
  await expect(live.getByRole("button", { name: "Step forward" })).toBeDisabled();
});

test("no more than three guide demos are live at once", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  for (const index of [0, 4, 8, 12, 16]) {
    await stage(page, index).scrollIntoViewIfNeeded();
    await expect(player(page, index)).toBeVisible();
  }
  await expect(page.locator("iframe")).toHaveCount(3);
  await expect(figure(page, 0).getByRole("img")).toBeVisible();
});

test("a page of guide demos passes axe with its players live", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(PAGE);
  await stage(page, 0).scrollIntoViewIfNeeded();
  await expect(player(page, 0).getByRole("status")).toContainText("Live deck", {
    timeout: 20_000,
  });
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("at 360px a page of guide demos has no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto(PAGE);
  await stage(page, 0).scrollIntoViewIfNeeded();
  await expect(player(page, 0)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every guide demo shows its poster and its code", async ({ page }) => {
    await page.goto(PAGE);
    await expect(page.locator("[data-deck-demo-player]")).toHaveCount(demos.length);
    for (const [index, demo] of demos.entries()) {
      await expect(figure(page, index).getByRole("img")).toBeVisible();
      await expect(figure(page, index).locator("pre")).toContainText(`template="${demo.first}"`);
    }
  });
});
