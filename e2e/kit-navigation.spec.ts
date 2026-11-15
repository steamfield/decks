import { expect } from "@playwright/test";
import { settled, test } from "./fixtures/kit.fixture";

test.use({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });

test("Walking slide 2 forward and back updates card copy and settles after each click", async ({
  page,
}) => {
  await page.goto("/#/2");
  const first = "Water level, hour by hour, for two days.";
  const second = "High tides arrive 12 h 25 min apart.";
  const third = "The schedule follows the Moon.";
  await expect(page.getByText(first)).toBeVisible();
  await settled(page);
  for (const [key, lead] of [
    ["ArrowRight", second],
    ["ArrowRight", third],
    ["ArrowLeft", second],
    ["ArrowLeft", first],
  ]) {
    if (!key || !lead) throw new Error("Missing navigation case");
    await page.keyboard.press(key);
    await settled(page);
    await expect(page.getByText(lead, { exact: true })).toBeVisible();
  }
});

declare global {
  interface Window {
    kitTransition?: ViewTransition;
    kitPaused?: Promise<void>;
  }
}

test("Arriving from the cover holds scene entrance until the transition finishes without hiding head or card", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => {
      const transition = start(update);
      window.kitTransition = transition;
      window.kitPaused = transition.ready.then(() => {
        for (const animation of document.getAnimations()) {
          animation.pause();
          animation.currentTime = 150;
        }
      });
      return transition;
    };
  });
  await page.goto("/#/1");
  await expect(page.getByRole("heading", { name: "Tides run on the Moon's clock." })).toBeVisible();
  await page.evaluate(() => {
    const file = "/slides/02-two-a-day.mdx";
    return import(file);
  });
  await settled(page);
  await page.keyboard.press("ArrowRight");
  await page.evaluate(async () => {
    if (!window.kitPaused) throw new Error("Navigation did not start a view transition");
    await window.kitPaused;
  });
  const clip = await page
    .getByLabel("Tide baseline")
    .evaluate((element) => getComputedStyle(element).getPropertyValue("--od-clip"));
  expect(clip).toBe("100%");
  await expect(page).toHaveScreenshot("tide-arrival-early.png", {
    animations: "allow",
    maxDiffPixelRatio: 0.002,
  });
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.currentTime = 600;
  });
  await expect(page).toHaveScreenshot("tide-arrival-copy.png", {
    animations: "allow",
    maxDiffPixelRatio: 0.002,
  });
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.finish();
  });
  await settled(page);
  await expect
    .poll(() =>
      page
        .getByLabel("Tide baseline")
        .evaluate((element) => getComputedStyle(element).getPropertyValue("--od-clip")),
    )
    .toBe("0%");
});

test("Instant motion updates the beat rail without a CSS transition", async ({ page }) => {
  await page.goto("/?motion=instant#/2");
  await expect(page.getByText("Water level, hour by hour, for two days.")).toBeVisible();
  await settled(page);
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() =>
      page.getByRole("contentinfo").evaluate(
        (rail) =>
          document.getAnimations().filter((animation) => {
            const target =
              animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
            return target instanceof Element && rail.contains(target);
          }).length,
      ),
    )
    .toBe(0);
});

test("Reloading the last click shows the settled pose in its first rendered frame", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const frames: { clip: string; dots: string; card: string }[] = [];
    Reflect.set(window, "kitReloadFrames", frames);
    const sample = () => {
      const root = document.querySelector("[data-deck-active]");
      const rule = root?.querySelector('[aria-label="Tide baseline"]');
      const dot = root?.querySelector('[aria-label="Tide high"]');
      const card = root?.querySelector('[aria-label="Story caption"]');
      if (rule && dot && card)
        frames.push({
          clip: getComputedStyle(rule).getPropertyValue("--od-clip"),
          dots: getComputedStyle(dot).opacity,
          card: card.textContent ?? "",
        });
      else requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.goto("/#/2?clicks=2");
  await expect(page.getByText("The schedule follows the Moon.")).toBeVisible();
  await settled(page);
  await page.reload();
  await expect(page.getByText("The schedule follows the Moon.")).toBeVisible();
  await settled(page);
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "kitReloadFrames")))
    .toEqual([{ clip: "0%", dots: "1", card: "The schedule follows the Moon." }]);
});
