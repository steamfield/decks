import { expect } from "@playwright/test";
import { settled } from "./fixtures/deck.fixture";
import { test } from "./fixtures/motion.fixture";
import { gallery, slideNo } from "./fixtures/motion-gallery";

test("The print view renders every motion frame directly at its settled click pose.", async ({
  page,
}) => {
  const [timeline, tween, countUp] = [slideNo("timeline"), slideNo("tween"), slideNo("count-up")];
  await page.addInitScript(
    ([timeline, tween, countUp]) => {
      const intermediate: string[] = [];
      Reflect.set(window, "printIntermediate", intermediate);
      const record = () => {
        for (const element of document.querySelectorAll(
          '[data-deck-context="print"] [data-step-state]',
        )) {
          const opacity = Number(getComputedStyle(element).opacity);
          if (opacity !== 0 && opacity !== 1) intermediate.push(`opacity ${opacity}`);
        }
        for (const group of document.querySelectorAll(`[data-deck-slide="${timeline}"] svg g`)) {
          if (!(group instanceof SVGGraphicsElement)) throw new Error("Missing timeline group");
          const x = group.transform.baseVal.consolidate()?.matrix.e;
          if (x === undefined || ![140, 460, 780, 1100].includes(x)) intermediate.push(`x ${x}`);
        }
        for (const circle of document.querySelectorAll(
          `[data-deck-slide="${tween}"] svg circle:last-of-type`,
        )) {
          const radius = Number(circle.getAttribute("r"));
          if (radius !== 48 && radius !== 180) intermediate.push(`radius ${radius}`);
        }
        for (const count of document.querySelectorAll(
          `[data-deck-slide="${countUp}"] span[aria-hidden="true"]`,
        )) {
          const value = count.textContent?.replaceAll(",", "");
          if (value !== "0" && value !== "1200") intermediate.push(`count ${value}`);
        }
        const finite = document.getAnimations().filter((animation) => {
          const end = animation.effect?.getComputedTiming().endTime;
          return (
            animation.playState === "running" && typeof end === "number" && Number.isFinite(end)
          );
        });
        if (finite.length) intermediate.push("finite animation running");
      };
      const observer = new MutationObserver(record);
      observer.observe(document, {
        subtree: true,
        attributes: true,
        childList: true,
        characterData: true,
      });
    },
    [timeline, tween, countUp],
  );
  await page.goto("/#/print");
  await page.waitForFunction(() => window.__deck !== undefined);
  await settled(page);
  await expect(page.locator("html")).toHaveAttribute("data-deck-view", "print");
  await expect(page.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  await expect(page.locator('[data-deck-context="print"]')).toHaveCount(
    gallery.reduce((sum, { meta }) => sum + meta.clicks + 1, 0),
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(
    gallery.reduce((sum, { meta }) => sum + meta.clicks + 1, 0),
  );
  await expect
    .poll(() =>
      page
        .locator(`[data-deck-slide="${timeline}"] svg g`)
        .evaluateAll((groups) =>
          groups.map((group) =>
            group instanceof SVGGraphicsElement
              ? group.transform.baseVal.consolidate()?.matrix.e
              : null,
          ),
        ),
    )
    .toEqual([140, 460, 780, 1100]);
  await expect
    .poll(() =>
      page
        .locator(`[data-deck-slide="${tween}"] svg circle:last-of-type`)
        .evaluateAll((circles) => circles.map((circle) => Number(circle.getAttribute("r")))),
    )
    .toEqual([48, 180]);
  await expect(page.locator(`[data-deck-slide="${countUp}"] span[aria-hidden="true"]`)).toHaveText([
    "0",
    "1,200",
  ]);
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "printIntermediate")))
    .toEqual([]);
  const dimensions = await page.locator('[data-deck-slide="1"]').first().boundingBox();
  expect(dimensions?.width).toBe(1920);
  expect(dimensions?.height).toBe(1080);
});
