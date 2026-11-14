import { expect } from "@playwright/test";

import { test } from "./fixtures/motion.fixture";
import { gallery, pauseEntry, poses, position, settled } from "./fixtures/motion-gallery";

test("Every gallery click reverses to exactly the poses before it.", async ({ page }) => {
  test.setTimeout(90_000);
  for (let no = 1; no <= gallery.length; no++) {
    const total = gallery[no - 1]?.meta.clicks ?? 0;
    await page.goto(`/#/${no}`);
    for (let click = 0; click < Math.max(total, no < gallery.length ? 1 : 0); click++) {
      await position(page, no, click);
      await settled(page, no, click);
      const before = await poses(page);
      await page.keyboard.press("ArrowRight");
      const target = total ? no : no + 1;
      await position(page, target, total ? click + 1 : 0);
      await settled(page, target, total ? click + 1 : 0);
      await page.keyboard.press("ArrowLeft");
      await position(page, no, click);
      await settled(page, no, click);
      await expect.poll(() => poses(page)).toEqual(before);
      if (click + 1 < total) await page.keyboard.press("ArrowRight");
    }
  }
});

test("Direct instant loads at the last click match settled live arrival on every slide.", async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);
  const instant = await context.newPage();
  await instant.addInitScript(() => {
    const firstFrame = () => {
      if (document.querySelector("[data-deck-active] h1"))
        Reflect.set(
          window,
          "motionFirstMode",
          document.documentElement.getAttribute("data-deck-motion"),
        );
      else requestAnimationFrame(firstFrame);
    };
    requestAnimationFrame(firstFrame);
  });
  await page.goto("/#/1");
  for (let no = 1; no <= gallery.length; no++) {
    const total = gallery[no - 1]?.meta.clicks ?? 0;
    await position(page, no);
    await settled(page, no, 0);
    for (let click = 1; click <= total; click++) {
      await page.keyboard.press("ArrowRight");
      await position(page, no, click);
      await settled(page, no, click);
    }
    const live = await poses(page);
    await instant.goto(`/?motion=instant#/${no}${total ? `?clicks=${total}` : ""}`);
    await position(instant, no, total);
    await expect
      .poll(() => instant.evaluate(() => Reflect.get(window, "motionFirstMode")))
      .toBe("instant");
    await settled(instant, no, total);
    expect(await poses(instant)).toEqual(live);
    await expect(instant.locator("html")).toHaveCSS("--deck-dur-base", "0ms");
    if (no < gallery.length) await page.keyboard.press("ArrowRight");
  }
  await instant.close();
});

test("The gallery reverses interruptions and fits 4:3.", async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const no of [9, 10, 11]) {
    await page.goto(`/#/${no}`);
    await position(page, no);
    const entry = await pauseEntry(page);
    expect(entry.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
    await page.keyboard.press("ArrowLeft");
    await position(page, no);
    await settled(page, no, 0);
    for (const pose of await poses(page)) expect(pose.visibility).toBe("hidden");
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  for (const [no, click] of [
    [8, 4],
    [9, 1],
    [15, 3],
  ]) {
    await page.goto(`/#/${no}?clicks=${click}`);
    await position(page, no ?? 0, click);
    await settled(page, no ?? 0, click ?? 0);
    await expect(page.locator("#deck-frame")).toHaveCSS("--deck-scale", String(1024 / 1920));
    const boxes = await page.locator("[data-deck-active] > *").evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, right, bottom } = element.getBoundingClientRect();
        return { x, y, right, bottom };
      }),
    );
    for (const [index, box] of boxes.entries()) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(1024);
      expect(box.bottom).toBeLessThanOrEqual(768);
      const previous = boxes[index - 1];
      if (previous) expect(box.y).toBeGreaterThanOrEqual(previous.bottom);
    }
  }
  expect(errors).toEqual([]);
});
