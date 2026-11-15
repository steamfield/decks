import { expect } from "@playwright/test";

import { test } from "./fixtures/motion.fixture";
import { gallery, pauseEntry, poses, position, settled, slideNo } from "./fixtures/motion-gallery";

const [steps, stagger, textWord, textChar, timeline] = [
  slideNo("steps"),
  slideNo("stagger"),
  slideNo("text-word"),
  slideNo("text-char"),
  slideNo("timeline"),
];

for (let no = 1; no <= gallery.length; no++) {
  test(`Gallery slide ${no} reverses every click to the pose before it.`, async ({ page }) => {
    const total = gallery[no - 1]?.meta.clicks ?? 0;
    await page.goto(`/#/${no}`);
    await position(page, no);
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
  });
}

for (let no = 1; no <= gallery.length; no++) {
  test(`Gallery slide ${no}'s instant load matches its settled live arrival.`, async ({
    page,
    context,
  }) => {
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
    if (no === 1) await page.goto("/#/1");
    else {
      const previous = no - 1;
      const clicks = gallery[previous - 1]?.meta.clicks ?? 0;
      await page.goto(`/#/${previous}?clicks=${clicks}`);
      await position(page, previous, clicks);
      await settled(page, previous, clicks);
      await page.keyboard.press("ArrowDown");
    }
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
    await expect.poll(() => poses(instant)).toEqual(live);
    await expect(instant.locator("html")).toHaveCSS("--deck-dur-base", "0ms");
    await instant.close();
  });
}

test("The gallery reverses interruptions and fits 4:3.", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const no of [stagger, textWord, textChar]) {
    await page.goto(`/#/${no}`);
    await position(page, no);
    const items = page.locator("[data-deck-active] [data-step-state] [data-step-state]");
    const paused = await pauseEntry(page);
    await expect(items).toHaveCount(paused);
    const entry = await items.evaluateAll((elements) =>
      elements.map((element) => Number(getComputedStyle(element).opacity)),
    );
    expect(entry.some((opacity) => opacity > 0 && opacity < 1)).toBe(true);
    await page.keyboard.press("ArrowLeft");
    await position(page, no);
    await settled(page, no, 0);
    for (const pose of await poses(page)) expect(pose.visibility).toBe("hidden");
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  for (const [no, click] of [
    [steps, 4],
    [stagger, 1],
    [timeline, 3],
  ]) {
    await page.goto(`/#/${no}?clicks=${click}`);
    await position(page, no ?? 0, click);
    await settled(page, no ?? 0, click ?? 0);
    await expect(page.locator("#deck-frame")).toHaveCSS("--deck-scale", String(1024 / 1920));
    const boxes = await page
      .locator("[data-deck-active] > :not([data-deck-layer])")
      .evaluateAll((elements) =>
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
