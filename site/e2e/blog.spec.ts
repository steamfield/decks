import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { loadExamples } from "../src/data/examples";

const example = loadExamples().find((entry) => entry.name === "keeling");
if (!example) throw new Error("Missing reference post example");
// Every step shows a card, so the start step of the post's example (whichever it is) has the text
// the player waits for before it reports ready.
const stub = readFileSync("e2e/fixtures/stub-deck.html", "utf8").replace(
  "const SETTLE_MS =",
  'window.STUB_CARD = { lead: "Stub lead.", body: "Stub body." };\nconst SETTLE_MS =',
);

for (const scheme of ["light", "dark"] as const) {
  test(`a blog post in ${scheme} passes axe`, async ({ page }) => {
    await page.route("**/demo/*/index.html*", (route) =>
      route.fulfill({ contentType: "text/html", body: stub }),
    );
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/blog/make-slides-with-claude-code/");
    await page.locator("[data-player]").scrollIntoViewIfNeeded();
    await expect(page.locator("[data-player]")).toHaveAttribute("data-phase", "ready");
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${scheme}\\b`));
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => innerWidth),
    );
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
}

test("the blog player shows its poster and stays at the registered start step without autoplay", async ({
  page,
}) => {
  await page.clock.install();
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/demo/*/index.html*", async (route) => {
    await gate;
    await route.fulfill({ contentType: "text/html", body: stub });
  });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/blog/make-slides-with-claude-code/", { waitUntil: "domcontentloaded" });
  const player = page.locator("[data-player]");
  await player.scrollIntoViewIfNeeded();
  await expect(player.locator("picture img")).toBeVisible();
  await expect(player).toHaveAttribute("data-phase", "booting");
  release();
  await expect(player).toHaveAttribute("data-phase", "ready");
  await page.clock.fastForward(9000);
  await expect(page.frameLocator("iframe").locator("#where")).toHaveText(
    `slide ${example.startSlide} beat ${example.startBeat}`,
  );
  await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect(player.getByRole("navigation", { name: "Example decks" })).toHaveCount(0);
});

test("the blog fits a narrow viewport and its toolbar follows its own container", async ({
  page,
}) => {
  await page.route("**/demo/*/index.html*", (route) =>
    route.fulfill({ contentType: "text/html", body: stub }),
  );
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/blog/make-slides-with-claude-code/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("[data-player]").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-player]")).toHaveAttribute("data-phase", "ready");
  await page.locator(".blog-demo").evaluate((el) => {
    el.style.width = "600px";
  });
  const layout = await page
    .locator(".player-toolbar")
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  expect(layout).toBe(2);
});

test("a single-example player aligns its desktop controls and retains its brand rule", async ({
  page,
}) => {
  await page.route("**/demo/*/index.html*", (route) =>
    route.fulfill({ contentType: "text/html", body: stub }),
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/blog/make-slides-with-claude-code/");
  await page.locator("[data-player]").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-player]")).toHaveAttribute("data-phase", "ready");
  const geometry = await page.locator(".player-toolbar").evaluate((bar) => ({
    right: bar.getBoundingClientRect().right,
    controls: bar.querySelector(".player-controls")?.getBoundingClientRect().right,
  }));
  expect(geometry.controls).toBeCloseTo(geometry.right - 8, 0);
});

test("a blog player carries the landing's colored top rule", async ({ page }) => {
  await page.goto("/blog/make-slides-with-claude-code/");
  const rule = await page.locator("[data-player]").evaluate((el) => ({
    image: getComputedStyle(el, "::before").backgroundImage,
    height: getComputedStyle(el, "::before").height,
  }));
  expect(rule.image).toContain("linear-gradient(");
  expect(rule.height).toBe("2px");
});

test.describe("ThemeCompare without a player", () => {
  test.use({ hasTouch: true });
  test("keeps touch targets using only its own stylesheet", async ({ page }) => {
    await page.goto("/blog/slidev-custom-theme/");
    const comparison = await page.locator(".themes-grid").evaluate((el) => el.outerHTML);
    const css = readFileSync("src/styles/theme-compare.css", "utf8");
    await page.setContent(`<style>${css}</style>${comparison}`);
    await expect(page.locator("[data-player]")).toHaveCount(0);
    for (const label of await page.locator(".theme-tabs label").all()) {
      await expect(label).toHaveCSS("min-height", "44px");
      expect((await label.boundingBox())?.height).toBeGreaterThanOrEqual(44);
    }
  });
});
