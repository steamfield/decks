import { expect } from "@playwright/test";
import { slideNo } from "./fixtures/motion-gallery";
import { keys, lastSlide, settle, test } from "./fixtures/transitions";

const push = slideNo("push");

test("End before the final module resolves cuts without an error", async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname === `/${lastSlide.file}`,
    async (route) => {
      await held;
      await route.continue();
    },
  );
  await page.goto("/#/1");
  await expect(page.getByRole("heading", { name: "Motion", exact: true })).toBeVisible();
  await keys(page, ["End"]);
  await expect(page).toHaveURL(new RegExp(`#/${lastSlide.no}$`));
  release();
  await expect(page.locator("[data-deck-active]")).toHaveAttribute(
    "data-deck-slide",
    String(lastSlide.no),
  );
  await expect(page.locator("[data-deck-active]").getByRole("heading").first()).toBeVisible();
  await settle(page);
  await expect.poll(() => page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
});

test("An unresolved target skips a transition whose callback is still pending", async ({
  page,
}) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(
    (url) => url.pathname === `/${lastSlide.file}`,
    async (route) => {
      await held;
      await route.continue();
    },
  );
  await page.goto(`/#/${push}`);
  await expect(page.getByRole("heading", { name: "Keep moving." })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Change the scale.", includeHidden: true }),
  ).toHaveCount(1);
  await keys(page, ["ArrowRight", "End"]);
  await expect(page).toHaveURL(new RegExp(`#/${lastSlide.no}$`));
  const snapshot = await page.evaluate(() =>
    window.e2eTransition?.ready.then(
      () => "animated",
      () => "skipped",
    ),
  );
  expect(snapshot).toBe("skipped");
  release();
  await expect(page.locator("[data-deck-active]")).toHaveAttribute(
    "data-deck-slide",
    String(lastSlide.no),
  );
  await expect(page.locator("[data-deck-active]").getByRole("heading").first()).toBeVisible();
  await settle(page);
});
