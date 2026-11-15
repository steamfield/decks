import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { settled, test } from "./fixtures/kit.fixture";

test.use({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

test("Slide 2 clicks 0, 1 and 2 match the macOS Slidev frames within 0.2 percent", async ({
  page,
}, info) => {
  test.skip(
    process.platform !== "darwin",
    "Slidev baselines were captured on macOS; Linux font rasterization differs.",
  );
  for (const click of [0, 1, 2]) {
    await page.goto(`/?motion=instant#/2?clicks=${click}`);
    await expect(
      page.getByRole("heading", { name: "Boston gets two high tides a day." }),
    ).toBeVisible();
    await settled(page);
    const actual = PNG.sync.read(await page.screenshot());
    const baseline = PNG.sync.read(
      await readFile(resolve(`examples/tides-slide/baseline/s02-c${click}.png`)),
    );
    const diff = new PNG({ width: 1920, height: 1080 });
    const count = pixelmatch(actual.data, baseline.data, diff.data, 1920, 1080, { threshold: 0.1 });
    await info.attach(`click-${click}: ${count} pixels`, {
      body: PNG.sync.write(diff),
      contentType: "image/png",
    });
    expect(count / (1920 * 1080)).toBeLessThan(0.002);
  }
});

test("The cover has its brand, body and byline rows and uses the installed theme", async ({
  page,
}, info) => {
  await page.goto("/?motion=instant#/1");
  await expect(page.getByRole("heading", { name: "Tides run on the Moon's clock." })).toBeVisible();
  await expect(
    page.locator("[data-deck-active]").getByText("Decks", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Edited by Riley Hilliard")).toBeVisible();
  await settled(page);
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue("--od-cyan").trim(),
      ),
    )
    .toBe("#06b6d4");
  if (process.platform === "darwin") {
    const actual = PNG.sync.read(await page.screenshot());
    const baseline = PNG.sync.read(
      await readFile(resolve("examples/tides-slide/baseline/s01-c0.png")),
    );
    const diff = new PNG({ width: 1920, height: 1080 });
    const count = pixelmatch(actual.data, baseline.data, diff.data, 1920, 1080, { threshold: 0.1 });
    await info.attach(`cover: ${count} pixels`, {
      body: PNG.sync.write(diff),
      contentType: "image/png",
    });
    expect(count / (1920 * 1080)).toBeLessThan(0.002);
  } else
    info.annotations.push({
      type: "pixel comparison skipped",
      description: "Cover baseline uses macOS font rasterization.",
    });
});
