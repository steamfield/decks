import { readdirSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { site } from "../src/config";
import { loadExamples } from "../src/data/examples";

// The first two docs pages on disk stand in for every docs page.
const [firstDoc, secondDoc] = readdirSync("src/content/docs", {
  recursive: true,
  encoding: "utf8",
})
  .filter((file) => file.endsWith(".md"))
  .sort()
  .map((file) => `/docs/${file.replace(/\.md$/, "")}/`);
const DOC = firstDoc ?? "/docs/";
const [firstInstall, secondInstall] = site.install;
const examples = loadExamples();
const hero = examples[0];

// Headless Chromium denies the decks' screen wake lock; the deck logs that and carries on.
const IGNORED = /Wake Lock permission request denied/;

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !IGNORED.test(message.text())) errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function axe(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
}

for (const scheme of ["light", "dark"] as const) {
  test(`the landing page stays dark under a ${scheme} system theme and passes axe`, async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator("html")).toHaveClass(/\bdark\b/);
    await expect(page.locator("[data-theme-toggle]")).toHaveCount(0);
    await axe(page);
    expect(errors).toEqual([]);
  });

  test(`a docs page in ${scheme} passes axe with no console errors`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(DOC);
    await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${scheme}\\b`));
    await axe(page);
    expect(errors).toEqual([]);
  });
}

test("the docs theme choice persists from page to page", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto(DOC);
  const toggle = page.getByRole("button", { name: "Dark theme" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.goto(secondDoc ?? DOC);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
});

test("install tabs switch commands once hydrated", async ({ page }) => {
  test.skip(!secondInstall, "only one install option");
  await page.goto("/");
  await page.getByRole("tab", { name: secondInstall?.label, exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    secondInstall?.command.split("\n")[0] ?? "",
  );
});

test("copy buttons appear once the clipboard API is there", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Copy the three install commands" })).toBeVisible();
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the docs menu opens and the first install command shows", async ({ page, isMobile }) => {
    await page.goto(DOC);
    if (isMobile) {
      await page.getByText("Docs menu").click();
      await expect(page.getByRole("navigation", { name: "Docs menu" })).toBeVisible();
    } else {
      await expect(page.getByRole("navigation", { name: "Docs" })).toBeVisible();
    }
    await page.goto("/");
    await expect(page.getByRole("tabpanel")).toContainText(
      firstInstall?.command.split("\n")[0] ?? "",
    );
  });

  test("the landing page shows the poster, the deck's text and links to every deck", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".player-canvas img")).toBeVisible();
    await expect(page.locator(".player video")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Play" })).toBeHidden();
    await expect(page.locator("button[data-copy]").first()).toBeHidden();
    for (const example of examples) {
      await expect(page.locator(`a[data-example="${example.name}"]`)).toHaveAttribute(
        "href",
        example.href,
      );
    }
    await expect(page.getByText(`${hero?.title}: the deck's text`)).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open the example deck", exact: true }),
    ).toBeVisible();
  });
});

// The player against a stand-in deck that speaks the embed contract (e2e/fixtures/stub-deck.html),
// so these tests don't depend on `make demo` having built the real decks. The stub has six
// slides: a cover, story slides 2 to 5 with three steps each (the hero starts on one of
// them) and a closing slide without a card.
const stub = readFileSync("e2e/fixtures/stub-deck.html", "utf8");
const STUB_SLIDES = 6;
const STUB_LEADS = ["First beat lead.", "Second beat lead.", "Third beat lead."];
/** The live announcement for a step on one of the stub's story slides. */
const stubStep = (slide: number, beat: number) =>
  `Slide ${slide} of ${STUB_SLIDES}, step ${beat + 1} of 3. ${STUB_LEADS[beat]}`;
const startSlide = hero?.startSlide ?? 2;
const startBeat = hero?.startBeat ?? 0;

async function withStubDecks(page: Page) {
  await page.route("**/demo/*/index.html*", (route) =>
    route.fulfill({ contentType: "text/html", body: stub }),
  );
}

const live = (page: Page) => page.locator("[aria-live=polite]");
const player = (page: Page) => page.locator("[data-player]");
const lead = (page: Page) => page.locator(".caption-lead");

test.describe("the deck player", () => {
  test.beforeEach(async ({ page }) => {
    await withStubDecks(page);
    // Reduced motion: the poster, no loop, so Play boots the deck directly.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
  });

  test("loads nothing until Play, then drives the deck in an inert iframe", async ({ page }) => {
    const errors = collectErrors(page);
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.getByRole("button", { name: "Play" }).click();
    const frame = page.locator("iframe");
    await expect(frame).toHaveAttribute("tabindex", "-1");
    await expect(frame).toHaveAttribute("inert", "");
    await expect(frame).toHaveAttribute("title", /controlled by the player/);
    // The hero starts on its registry startSlide and startBeat (step 2); the stub opens on
    // step 1 and the player steers it there.
    await expect(live(page)).toHaveText(stubStep(startSlide, startBeat));
    await expect(page.locator(".caption-body")).toHaveText("Second beat body.");
    // Play holds each step for its reading time, then advances by itself.
    await expect(live(page)).toHaveText(stubStep(startSlide, startBeat + 1), {
      timeout: 12_000,
    });
    expect(errors).toEqual([]);
  });

  test("steps with the buttons and with arrow keys on the focused player", async ({ page }) => {
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(live(page)).toHaveText(stubStep(startSlide, startBeat + 1));
    await player(page).focus();
    await page.keyboard.press("ArrowLeft");
    await expect(live(page)).toHaveText(stubStep(startSlide, startBeat));
    for (let slide = startSlide; slide < STUB_SLIDES; slide++) {
      await page.keyboard.press("Shift+ArrowRight");
      await expect(live(page)).toContainText(`Slide ${slide + 1} of ${STUB_SLIDES}, step 1 of`);
    }
    // A slide without a story card falls back to its title.
    await expect(live(page)).toHaveText(
      `Slide ${STUB_SLIDES} of ${STUB_SLIDES}, step 1 of 2. Stub closing slide`,
    );
    await expect(lead(page)).toHaveText("Stub closing slide");
  });

  test("a gallery pick loads that deck into the player and scrolls there", async ({ page }) => {
    const pick = examples[1];
    test.skip(!pick, "only one example");
    await page.locator(`a[data-example="${pick?.name}"]`).click();
    await expect(page.locator("iframe")).toHaveAttribute("src", new RegExp(`/demo/${pick?.name}/`));
    await expect(player(page)).toBeInViewport();
    await expect(player(page)).toBeFocused();
    // An agent deck's title bar shows its run's prompt; any other deck, its provenance.
    await expect(page.locator(".player-titlebar")).toContainText(
      pick?.run ? pick.run.prompt : (pick?.provenance.label ?? ""),
    );
    expect(new URL(page.url()).pathname).toBe("/");
  });
});

test.describe("the hero loop", () => {
  test.skip(!hero?.loop, "the hero has no loop yet: the poster stands in");

  test("plays muted under no-preference and hands over to the live deck", async ({ page }) => {
    await withStubDecks(page);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    const video = page.locator(".player video");
    await expect(video).toHaveJSProperty("muted", true);
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(video).toHaveCount(0);
    await expect(page.locator("iframe")).toHaveAttribute("src", /\/demo\/[\w-]+\/index\.html#\//);
    await expect(live(page)).toHaveText(
      new RegExp(`^Slide \\d of ${STUB_SLIDES}, step \\d of \\d\\.`),
    );
  });

  test("shows the poster under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await expect(page.locator(".player-canvas img")).toBeVisible();
    await expect(page.locator(".player video")).toHaveCount(0);
  });
});

/** Fraction of the player inside the viewport, its box, and the frame's top. */
async function playerGeometry(page: Page) {
  return page.evaluate(() => {
    const box = document.querySelector("[data-player]")?.getBoundingClientRect();
    const canvas = document.querySelector(".player-canvas")?.getBoundingClientRect();
    if (!box || !canvas) throw new Error("no player");
    const visible = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0));
    return {
      top: box.top,
      bottom: box.bottom,
      width: box.width,
      visible: visible / box.height,
      frameTop: canvas.top,
    };
  });
}

/** Content blocks outside the player that are wider than it. */
function widerThanPlayer(page: Page) {
  return page.evaluate(() => {
    const player = document.querySelector("[data-player]");
    const width = player?.getBoundingClientRect().width ?? 0;
    const blocks = document.querySelectorAll(
      "main :is(p, h1, h2, h3, pre, figure, img, video, ul, ol, table, dl, [data-block])",
    );
    return [...blocks]
      .filter((block) => !player?.contains(block) && block.getClientRects().length > 0)
      .map((block) => ({
        block: `${block.tagName.toLowerCase()}.${block.className}`,
        width: Math.round(block.getBoundingClientRect().width),
      }))
      .filter((block) => block.width > Math.ceil(width));
  });
}

test.describe("R1: the player is in the first viewport", () => {
  test.beforeEach(async ({ page }) => withStubDecks(page));

  for (const state of ["poster", "booted"] as const) {
    test(`at 1440x900, ${state}: fully visible and the widest element`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      if (state === "booted") {
        await page.getByRole("button", { name: "Step forward" }).click();
        await expect(player(page)).toHaveAttribute("data-phase", "ready");
      }
      const geometry = await playerGeometry(page);
      expect(geometry.top).toBeGreaterThanOrEqual(0);
      expect(geometry.bottom).toBeLessThanOrEqual(900);
      expect(await widerThanPlayer(page)).toEqual([]);
    });

    test(`at 1280x800, ${state}: 80% visible, frame top above 40%`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      if (state === "booted") {
        await page.getByRole("button", { name: "Step forward" }).click();
        await expect(player(page)).toHaveAttribute("data-phase", "ready");
      }
      const geometry = await playerGeometry(page);
      expect(geometry.visible).toBeGreaterThanOrEqual(0.8);
      expect(geometry.frameTop).toBeLessThan(800 * 0.4);
      expect(await widerThanPlayer(page)).toEqual([]);
    });
  }
});

test.describe("R2: the caption is page text at body size", () => {
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [768, 1024],
    [360, 780],
  ] as const) {
    test(`at ${width}px the caption shows and changes with each step`, async ({ page }) => {
      await withStubDecks(page);
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/");
      const caption = page.locator(".player-caption");
      await expect(caption).toBeVisible();
      for (const text of [lead(page), page.locator(".caption-body")]) {
        if ((await text.count()) === 0) continue;
        const size = await text.evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).fontSize),
        );
        expect(size).toBeGreaterThanOrEqual(16);
      }
      const before = await lead(page).textContent();
      expect(before?.trim()).not.toBe("");
      await page.getByRole("button", { name: "Step forward" }).click();
      await expect(lead(page)).not.toHaveText(before ?? "");
      await expect(live(page)).toContainText(/step \d of \d/);
    });
  }
});

test("at 360px the controls are 44px and nothing scrolls sideways", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  const controls = await page.locator(".player .control").all();
  expect(controls.length).toBeGreaterThanOrEqual(5);
  for (const control of controls) {
    const box = await control.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByRole("link", { name: "Open the deck (best in landscape)" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test("the page weighs 350 KB or less before interaction at 1440", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const sizes = new Map<string, number>();
  page.on("response", async (response) => {
    try {
      const body = await response.body();
      const type = response.headers()["content-type"] ?? "";
      // A static host compresses text; images and video go over as they are.
      const text = /text|javascript|json|svg|xml/.test(type);
      sizes.set(response.url(), text ? gzipSync(body).length : body.length);
    } catch {
      // Redirects and aborted range requests have no body.
    }
  });
  await page.goto("/", { waitUntil: "networkidle" });
  // Let the loop (if any) finish loading.
  await page.waitForLoadState("networkidle");
  const total = [...sizes.values()].reduce((sum, size) => sum + size, 0);
  const report = [...sizes].map(([url, size]) => `${Math.round(size / 1000)} KB ${url}`).join("\n");
  expect(total, report).toBeLessThanOrEqual(350_000);
});
