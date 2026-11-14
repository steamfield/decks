import { expect } from "@playwright/test";

import { keys, open, settle, test } from "./fixtures/transitions";

test("Attribute logs preserve two changes delivered in one mutation batch", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const html = document.documentElement;
    html.setAttribute("data-deck-transition", "fade");
    html.setAttribute("data-deck-nav", "forward");
    html.setAttribute("data-deck-transition", "zoom");
    html.setAttribute("data-deck-nav", "backward");
  });
  expect(await page.evaluate(() => window.e2eTransitionAttributes)).toEqual(["fade", "zoom"]);
  expect(await page.evaluate(() => window.e2eNavAttributes)).toEqual(["forward", "backward"]);
});

test("A fade boundary publishes its URL immediately and removes its forward attributes before settling", async ({
  page,
}) => {
  await open(page, 1);
  await keys(page, ["ArrowRight"]);
  await expect(page).toHaveURL(/#\/2$/);
  await settle(page);
  expect(await page.evaluate(() => window.e2eTransitionAttributes)).toContain("fade");
  expect(await page.evaluate(() => window.e2eNavAttributes)).toContain("forward");
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-transition");
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-nav");
});

test("Going back across a fade boundary uses its backward direction", async ({ page }) => {
  await open(page, 2);
  await keys(page, ["ArrowLeft"]);
  await settle(page);
  expect(await page.evaluate(() => window.e2eTransitionAttributes)).toContain("fade");
  expect(await page.evaluate(() => window.e2eNavAttributes)).toContain("backward");
  await expect(page).toHaveURL(/#\/1$/);
});

test("Fade preserves additive cross-fade coverage for both root snapshots", async ({ page }) => {
  await open(page, 1);
  await keys(page, ["ArrowRight"]);
  const blending = await page.evaluate(async () => {
    await window.e2eTransition?.ready;
    return ["old", "new"].map(
      (kind) =>
        getComputedStyle(document.documentElement, `::view-transition-${kind}(root)`).mixBlendMode,
    );
  });
  expect(blending).toEqual(["plus-lighter", "plus-lighter"]);
  await settle(page);
});

test("Fade has no root-group motion that outlasts its opacity animation", async ({ page }) => {
  await open(page, 1);
  await keys(page, ["ArrowRight"]);
  const durations = await page.evaluate(async () => {
    await window.e2eTransition?.ready;
    const group = getComputedStyle(document.documentElement, "::view-transition-group(root)");
    const snapshot = getComputedStyle(document.documentElement, "::view-transition-new(root)");
    return {
      group: group.animationName === "none" ? 0 : Number.parseFloat(group.animationDuration),
      snapshot: Number.parseFloat(snapshot.animationDuration),
    };
  });
  expect(durations.group).toBeLessThanOrEqual(durations.snapshot);
  await settle(page);
});

test("A cut boundary never sets transition attributes", async ({ page }) => {
  await open(page, 19);
  await keys(page, ["ArrowRight"]);
  await settle(page);
  await expect(page.getByRole("heading", { name: "Follow one idea." })).toBeVisible();
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  expect(await page.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
});

test("Instant and live reduced-motion changes disable transitions", async ({ page }) => {
  await open(page, 17, "?motion=instant");
  await keys(page, ["ArrowRight"]);
  await settle(page);
  await expect(page.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  expect(await page.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
  await open(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  await keys(page, ["ArrowRight"]);
  await settle(page);
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  expect(await page.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
});

test("Only clicks marked morphSteps start a step transition", async ({ page }) => {
  await open(page, 2);
  await keys(page, ["ArrowRight"]);
  await settle(page);
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  await open(page, 22);
  await keys(page, ["ArrowRight"]);
  await settle(page);
  expect(await page.evaluate(() => window.e2eTransitionAttributes)).toContain("step");
  expect(await page.evaluate(() => window.e2eTransitionNames)).toEqual(["fade", "step"]);
});
