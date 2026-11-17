import { expect, type Locator } from "@playwright/test";
import { settled } from "./fixtures/deck-driver";
import { test } from "./fixtures/motion.fixture";
import { slideNo } from "./fixtures/motion-gallery";

const no = slideNo("mark");
const until = slideNo("mark-until");

async function expectOffset(root: Locator, offset: string) {
  const paths = root.locator('path[pathLength="1"]');
  expect(await paths.count()).toBeGreaterThan(0);
  for (const path of await paths.all()) await expect(path).toHaveCSS("stroke-dashoffset", offset);
}

test("A mark with until draws at its click and un-draws at until, keeping its text visible.", async ({
  page,
}) => {
  await page.goto(`/#/${until}`);
  await settled(page);
  const mark = page.locator("[data-deck-active]").getByText("Passing", { exact: true });
  await expect.poll(() => mark.locator("path").count()).toBeGreaterThan(0);
  await expectOffset(mark, "1px");
  await page.keyboard.press("ArrowRight");
  await settled(page);
  await expectOffset(mark, "0px");
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/clicks=2$/);
  await settled(page);
  await expectOffset(mark, "1px");
  await expect(mark).toBeVisible();
});

test("A mark takes any CSS colour as its stroke.", async ({ page }) => {
  await page.goto(`/#/${until}`);
  const mark = page.locator("[data-deck-active]").getByText("Passing", { exact: true });
  await expect.poll(() => mark.locator("path").count()).toBeGreaterThan(0);
  await expect(mark.locator("path").first()).toHaveCSS("stroke", "rgb(255, 105, 180)");
});

test("Loading at a click past a mark's at shows it drawn without animating.", async ({ page }) => {
  await page.addInitScript(() => {
    const runs: string[] = [];
    Reflect.set(window, "__strokeRuns", runs);
    document.addEventListener("transitionrun", (event) => {
      if (event.propertyName === "stroke-dashoffset") runs.push(event.propertyName);
    });
  });
  await page.goto(`/#/${no}?clicks=3`);
  await settled(page);
  const mark = page.locator("[data-deck-active]").getByText("Underline", { exact: true });
  await expect.poll(() => mark.locator("path").count()).toBeGreaterThan(0);
  await expectOffset(mark, "0px");
  expect(await page.evaluate(() => Reflect.get(window, "__strokeRuns"))).toEqual([]);
});
