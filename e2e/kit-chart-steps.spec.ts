import { expect, type Page } from "@playwright/test";
import { settled } from "./fixtures/deck-driver";
import { kitFixture } from "./fixtures/kit.fixture";
import { test } from "./fixtures/motion.fixture";
import { slideNo } from "./fixtures/motion-gallery";

const no = slideNo("chart-steps");
const active = (page: Page) => page.locator("[data-deck-active]");
const north = (page: Page) => active(page).getByLabel(/^North: /);

test("Reloading at a later click shows the static target bar on every frame.", async ({ page }) => {
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
  await page.goto(`/#/${no}?clicks=2`);
  await expect(north(page)).toHaveAccessibleName("North: 84");
  await page.reload();
  await expect(north(page)).toHaveAccessibleName("North: 84");
  await settled(page);
  const ratios: number[] = await page.evaluate(() => Reflect.get(window, "reloadBarRatios"));
  expect(ratios).not.toHaveLength(0);
  expect(ratios.filter((ratio) => Math.abs(ratio - 84 / 48) >= 0.005)).toEqual([]);
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
