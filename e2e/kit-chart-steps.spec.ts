import { expect, type Page } from "@playwright/test";
import { settled } from "./fixtures/deck-driver";
import { kitFixture } from "./fixtures/kit.fixture";
import { test } from "./fixtures/motion.fixture";
import { motionClock } from "./fixtures/motion-clock";
import { position, slideNo } from "./fixtures/motion-gallery";
import { record } from "./fixtures/motion-recorder";

const no = slideNo("chart-steps");
const active = (page: Page) => page.locator("[data-deck-active]");
const north = (page: Page) => active(page).getByLabel(/^North: /);

function height(page: Page) {
  // Compare chart coordinates across mounts; viewport transforms round to subpixels.
  return north(page).evaluate((mark) => {
    if (!(mark instanceof SVGGraphicsElement)) throw new Error("The North bar has no SVG geometry");
    return mark.getBBox().height;
  });
}

test("The north bar moves between its static heights in both directions on the same chart.", async ({
  page,
}) => {
  await page.goto(`/?motion=instant#/${no}?clicks=1`);
  await expect(north(page)).toBeVisible();
  await settled(page);
  const end = await height(page);
  const clock = await motionClock(page);
  await page.goto(`/#/${no}`);
  await position(page, no);
  await expect(north(page)).toBeVisible();
  await clock.pauseAt();
  await clock.settle();
  const start = await height(page);
  const paint = await record(
    active(page),
    (element) =>
      Number(
        Boolean(element.querySelector('[aria-label^="North: "]')?.getBoundingClientRect().height),
      ),
    clock.settle,
  );

  for (const [key, click, target] of [
    ["ArrowRight", 1, end],
    ["ArrowLeft", 0, start],
  ] as const) {
    await page.keyboard.press(key);
    await position(page, no, click);
    await clock.step(160);
    const mid = await height(page);
    expect(mid).toBeGreaterThan(start);
    expect(mid).toBeLessThan(end);
    await clock.settle();
    expect(await height(page)).toBe(target);
  }
  expect(await paint.log()).not.toContain(0);
});

test("A two-click jump and a later-click reload show the static target immediately.", async ({
  page,
}) => {
  await page.goto(`/?motion=instant#/${no}?clicks=2`);
  await expect(north(page)).toHaveAccessibleName("North: 84");
  await settled(page);
  const target = await height(page);
  const clock = await motionClock(page);
  await page.goto(`/#/${no}`);
  await expect(north(page)).toBeVisible();
  await clock.pauseAt();
  await page.evaluate((no) => {
    location.hash = `/${no}?clicks=2`;
  }, no);
  await expect(north(page)).toHaveAttribute("aria-label", "North: 84");
  expect(await height(page)).toBe(target);
  await page.addInitScript(() => {
    const ratios: number[] = [];
    Reflect.set(window, "reloadBarRatios", ratios);
    function sample() {
      const north = document.querySelector('[data-deck-active] [aria-label^="North: "]');
      const south = document.querySelector('[data-deck-active] [aria-label^="South: "]');
      const southHeight = south?.getBoundingClientRect().height;
      if (north && southHeight) ratios.push(north.getBoundingClientRect().height / southHeight);
      if (north?.getAnimations({ subtree: true }).length) ratios.push(0);
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  await page.clock.resume();
  await page.reload();
  await expect(north(page)).toHaveAccessibleName("North: 84");
  await settled(page);
  const ratios: number[] = await page.evaluate(() => Reflect.get(window, "reloadBarRatios"));
  expect(ratios.length).toBeGreaterThan(0);
  for (const ratio of ratios) expect(ratio).toBeCloseTo(84 / 48);
});

test("Print shows the chart data for each click, including the final hold.", async ({ page }) => {
  await page.goto("/#/print");
  const charts = page.locator(`[data-deck-slide="${no}"]`);
  await expect(charts.getByRole("table", { includeHidden: true })).toContainText([
    "North24",
    "North60",
    "North84",
    "North84",
  ]);
});

test("A standalone chart grows its bar on arrival", async ({ page, deckServer }) => {
  const server = await kitFixture(deckServer, {
    "slides/01-chart.mdx": `import { OpenChart } from "@steamfield/decks/kit";

<OpenChart spec={{width:600, height:400, mark:"bar", data:[{desk:"North", tickets:24}],
encoding:{x:{field:"desk",type:"nominal"},y:{field:"tickets",type:"quantitative"}},
animation: {enter:{duration:800,stagger:false}}}} />`,
  });
  try {
    await page.addInitScript(() => {
      document.addEventListener("animationstart", (event) => {
        const mark = event.target;
        if (!(mark instanceof SVGElement) || !mark.closest('[aria-label="North: 24"]')) return;
        const animation = mark
          .getAnimations()
          .find((a) => a instanceof CSSAnimation && a.animationName === event.animationName);
        if (!animation) return;
        animation.pause();
        const opacities = [0, 200, 800].map((time) => {
          animation.currentTime = time;
          return Number(getComputedStyle(mark).opacity);
        });
        Reflect.set(window, "standaloneBarEntrance", opacities);
        animation.finish();
      });
    });
    await page.goto(server.url);
    const samples = await page.waitForFunction(() => Reflect.get(window, "standaloneBarEntrance"));
    const [start, middle, end] = await samples.jsonValue();
    expect(start).toBe(0);
    expect(middle).toBeGreaterThan(0);
    expect(middle).toBeLessThan(1);
    expect(end).toBe(1);
  } finally {
    await server.close();
  }
});
