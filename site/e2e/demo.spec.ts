import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { deckDir, loadExamples } from "../src/data/examples";
import { announcement, mirrorCopy } from "../src/lib/player/format";

const examples = loadExamples();
// The AISD branch below exercises that deck's own keyboard handling: fail loudly if it is
// renamed, instead of silently skipping the branch.
if (!examples.some(({ name }) => name === "aisd-showcase")) {
  throw new Error("examples.json has no aisd-showcase: update the AISD branch in demo.spec.ts");
}

for (const example of examples) {
  test(`${example.name} loads from the gallery at its recorded start and mirrors live steps`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const player = page.locator(".hero").getByRole("group", { name: /^Deck player:/ });
    await player.scrollIntoViewIfNeeded();
    await expect(player.getByRole("status")).toContainText("Live deck", { timeout: 20_000 });
    await page
      .getByRole("link")
      .filter({ has: page.getByText(example.title, { exact: true }) })
      .click();
    await expect(player.locator("iframe")).toHaveAttribute(
      "src",
      new RegExp(`/d/${example.name}/`),
    );
    await expect(player.getByRole("status")).toContainText("Live deck", { timeout: 20_000 });
    await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    const at = example.states.findIndex(
      (state) => state.slide === example.startSlide && state.beat === example.startBeat,
    );
    if (at < 0) throw new Error(`${example.name}: no recorded start`);
    if (example.name === "aisd-showcase") {
      await player
        .frameLocator("iframe")
        .getByRole("button", { name: /: grade [A-F],/ })
        .first()
        .focus();
      await page.keyboard.press("ArrowLeft");
      await page.keyboard.press("ArrowRight");
      await expect(
        player
          .getByRole("paragraph")
          .and(player.getByText(example.states[at + 1]?.lead ?? "", { exact: true })),
      ).toBeVisible();
      await page.keyboard.press("ArrowLeft");
      await expect(
        player
          .getByRole("paragraph")
          .and(player.getByText(example.states[at]?.lead ?? "", { exact: true })),
      ).toBeVisible();
    }
    for (const [index, state] of example.states.slice(at, at + 3).entries()) {
      if (index) await player.getByRole("button", { name: "Step forward", exact: true }).click();
      const caption = mirrorCopy(state, example.slideTitles);
      await expect(
        player.getByText(
          announcement(
            { ...state, slides: example.slides, settled: true, direction: null },
            example.slideTitles[state.slide - 1],
          ),
          { exact: true },
        ),
      ).toBeAttached({ timeout: 15_000 });
      await expect(
        player.getByRole("paragraph").and(player.getByText(caption.lead, { exact: true })),
      ).toBeVisible();
      if (caption.body)
        await expect(
          player.getByRole("paragraph").and(player.getByText(caption.body, { exact: true })),
        ).toBeVisible();
      await expect(player.frameLocator("iframe").locator("[data-deck-active]")).toHaveAttribute(
        "data-deck-slide",
        String(state.slide),
      );
    }
  });
}

test("a phone can load every deck from the examples menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const player = page.locator(".hero").getByRole("group", { name: /^Deck player:/ });
  await player.scrollIntoViewIfNeeded();
  const menu = player.getByRole("navigation", { name: "Example decks" });
  await expect(menu.getByText("More", { exact: true })).toBeVisible();
  await menu.getByText("More", { exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  for (const example of examples) {
    await menu
      .getByRole("button", { name: example.featured?.label ?? example.title, exact: true })
      .click();
    await expect(player.locator("iframe")).toHaveAttribute(
      "src",
      new RegExp(`/d/${example.name}/`),
    );
    await expect(player.getByRole("status")).toContainText("Live deck", { timeout: 20_000 });
    await expect(player.locator(".counter")).toContainText(
      `Slide ${example.startSlide} · Step ${example.startBeat + 1}`,
    );
  }
});

const hero = examples[0];
if (!hero) throw new Error("examples.json has no examples");
const heroStart = hero.states.findIndex(
  (state) => state.slide === hero.startSlide && state.beat === hero.startBeat,
);

test("a phone shows the hero's poster until the uniformly scaled live deck is ready", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/d/${hero.name}/index.html*`, async (route) => {
    await gate;
    await route.continue();
  });
  const opening = page.waitForRequest(`**/d/${hero.name}/index.html*`);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const player = page.locator(".hero").getByRole("group", { name: /^Deck player:/ });
  await player.scrollIntoViewIfNeeded();
  try {
    await opening;
    await expect(player.getByRole("status")).toContainText("Loading interactive deck");
    await expect(
      player.getByRole("img", {
        name: `${hero.title}, slide ${hero.startSlide} of ${hero.slides}`,
      }),
    ).toBeVisible();
    await expect(player.locator("iframe")).toBeHidden();
  } finally {
    release();
  }
  await expect(player.getByRole("status")).toContainText("Live deck", { timeout: 20_000 });
  await expect(player.getByRole("img")).toHaveCount(0);
  const slide = await player.frameLocator("iframe").locator("[data-deck-active]").boundingBox();
  const frame = await player.locator("iframe").boundingBox();
  expect(slide).not.toBeNull();
  expect(frame).not.toBeNull();
  expect(slide?.width).toBeCloseTo(frame?.width ?? 0, 0);
  expect(slide?.height).toBeCloseTo(frame?.height ?? 0, 0);
  expect((slide?.width ?? 0) / (slide?.height ?? 1)).toBeCloseTo(16 / 9, 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("Play advances the live hero deck with its recorded caption", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const player = page.locator(".hero").getByRole("group", { name: /^Deck player:/ });
  await player.scrollIntoViewIfNeeded();
  await expect(player.getByRole("status")).toContainText("Live deck", { timeout: 20_000 });
  await player.getByRole("button", { name: "Play", exact: true }).click();
  await expect(
    player
      .getByRole("paragraph")
      .and(player.getByText(hero.states[heroStart + 1]?.lead ?? "", { exact: true })),
  ).toBeVisible({
    timeout: 15_000,
  });
  await player.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(player.frameLocator("iframe").locator("html")).toHaveAttribute(
    "data-deck-view",
    "play",
  );
});

test("the motion panel opens the displayed slide's MDX after a jump", async ({ page }) => {
  const dir = join(deckDir("motion-showcase"), "slides");
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .sort();
  const last = files.at(-1);
  if (!last) throw new Error("Missing motion-showcase slides");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const section = page.locator("#motion");
  const player = section.getByRole("group", { name: /^Deck player:/ });
  await player.scrollIntoViewIfNeeded();
  await expect(player.getByRole("status")).toContainText("Live deck");
  await player.getByRole("navigation", { name: "Slides" }).getByRole("button").last().click();
  await expect(player.frameLocator("iframe").locator("[data-deck-active]")).toHaveAttribute(
    "data-deck-slide",
    String(files.length),
  );
  await expect(section.getByRole("figure").locator("figcaption code")).toHaveText(`slides/${last}`);
  await expect(section.getByRole("figure").locator("pre")).toHaveJSProperty(
    "textContent",
    readFileSync(join(dir, last), "utf8").trimEnd(),
  );
});

test("approaching from below starts the player on sight and focusing its source pauses it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 600 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/#install");
  const section = page.locator("#motion");
  const player = section.getByRole("group", { name: /^Deck player:/ });
  const code = section.getByRole("figure").getByRole("region");
  await code.evaluate((element) => element.scrollIntoView({ block: "start", behavior: "instant" }));
  await expect(player).not.toBeInViewport();
  await expect(player.getByRole("status")).toContainText("Live deck");
  await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await player.scrollIntoViewIfNeeded();
  await expect(player.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(player.getByText(/Slide 2 · Step 1 of/)).toBeVisible({ timeout: 15_000 });
  const frame = player.locator("iframe");
  const initialSrc = await frame.getAttribute("src");
  await code.evaluate((element) => {
    if (element instanceof HTMLElement) element.focus({ preventScroll: true });
  });
  await expect(code).toBeFocused();
  await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect(frame).toHaveAttribute("src", initialSrc ?? "");
  await expect(player.getByText(/Slide 2 · Step 1 of/)).toBeVisible();
});
