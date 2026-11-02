import { readdirSync, readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";
import { site } from "../src/config";
import { loadTapes } from "../src/data/tapes";

// The first docs page on disk stands in for every docs page.
const firstDoc = readdirSync("src/content/docs", { recursive: true, encoding: "utf8" })
  .filter((file) => file.endsWith(".md"))
  .sort()[0];
const DOC = `/docs/${firstDoc?.replace(/\.md$/, "")}/`;
const [firstInstall, secondInstall] = site.install;

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

for (const path of ["/", DOC]) {
  for (const scheme of ["light", "dark"] as const) {
    test(`${path} in ${scheme} passes axe with no console errors`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      await expect(page.locator("html")).toHaveClass(new RegExp(`\\b${scheme}\\b`));
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(results.violations).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
}

test("the theme choice persists from the landing page to the docs", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Dark theme" });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.goto(DOC);
  await expect(page.locator("html")).toHaveClass(/\bdark\b/);
});

test("install tabs switch commands once hydrated", async ({ page }) => {
  test.skip(!secondInstall, "only one install option");
  await page.goto("/");
  await page.getByRole("tab", { name: secondInstall?.label, exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(secondInstall?.command ?? "");
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
    await expect(page.getByRole("tabpanel")).toContainText(firstInstall?.command ?? "");
  });
});

// The player against a stand-in deck that speaks the embed contract (e2e/fixtures/stub-deck.html),
// so these tests don't depend on `make demo` having built the real decks.
const stub = readFileSync("e2e/fixtures/stub-deck.html", "utf8");

async function withStubDecks(page: Page) {
  await page.route("**/demo/*/index.html*", (route) =>
    route.fulfill({ contentType: "text/html", body: stub }),
  );
}

const live = (page: Page) => page.locator("[aria-live=polite]");

test.describe("the deck player", () => {
  test.beforeEach(async ({ page }) => {
    await withStubDecks(page);
    await page.goto("/");
  });

  test("loads nothing until PLAY, then drives the deck in an inert iframe", async ({ page }) => {
    const errors = collectErrors(page);
    await expect(page.locator("iframe")).toHaveCount(0);
    await page.getByRole("button", { name: "Play" }).click();
    const frame = page.locator("iframe");
    await expect(frame).toHaveAttribute("tabindex", "-1");
    await expect(frame).toHaveAttribute("inert", "");
    await expect(frame).toHaveAttribute("title", /controlled by the player above/);
    // tides starts on step 2 (START_BEATS), where its chart is drawn; the stub opens on step 1
    // and the player steers it there.
    await expect(live(page)).toHaveText("Slide 2 of 3, step 2 of 3. Second beat lead.");
    await expect(page.locator(".now-playing")).toContainText("Second beat body.");
    // PLAY holds each step for its reading time, then advances by itself.
    await expect(live(page)).toHaveText("Slide 2 of 3, step 3 of 3. Third beat lead.", {
      timeout: 12_000,
    });
    expect(errors).toEqual([]);
  });

  test("steps with the keys and with arrow keys inside the faceplate", async ({ page }) => {
    await page.getByRole("button", { name: "Step forward" }).click();
    await expect(live(page)).toHaveText("Slide 2 of 3, step 3 of 3. Third beat lead.");
    await page.getByRole("button", { name: "Step back" }).press("ArrowLeft");
    await expect(live(page)).toHaveText("Slide 2 of 3, step 2 of 3. Second beat lead.");
    await page.getByRole("button", { name: "Slide forward" }).click();
    // A slide without a story card falls back to its title.
    await expect(live(page)).toHaveText("Slide 3 of 3, step 1 of 2. Stub closing slide");
    await expect(page.locator(".now-playing")).toContainText("Stub closing slide");
  });

  test("swaps tapes from the shelf with the keyboard", async ({ page }) => {
    const shelf = page.getByRole("group", { name: "Load an example deck" });
    await shelf.getByRole("radio").first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(shelf.getByRole("radio").nth(1)).toBeChecked();
    await expect(page.getByText("Tape: opendata-pitch")).toBeVisible();
    // The pick boots the new tape once the door has closed.
    await expect(page.locator("iframe")).toHaveAttribute("src", /\/demo\/opendata-pitch\//);
    await expect(page.getByRole("list", { name: /side A$/ })).toBeVisible();
  });

  test("swaps instantly under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator(".shelf-slot").nth(2).click();
    await expect(page.locator(".deck")).toHaveAttribute("data-swap", "idle");
    await expect(page.getByText("Tape: agent-experience")).toBeVisible();
  });
});

test("at 360px the player has 44px keys, legible copy and no sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  for (const key of await page.locator(".deck .key").all()) {
    const box = await key.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }
  const lead = page.locator(".now-playing p").nth(1);
  const size = await lead.evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).fontSize),
  );
  expect(size).toBeGreaterThanOrEqual(18);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});

test.describe("the landing page without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("shows the poster, the deck's text and links to every deck build", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".tv-picture img")).toBeVisible();
    await expect(page.getByRole("button", { name: "Play" })).toBeHidden();
    await expect(page.locator("button[data-copy]").first()).toBeHidden();
    for (const tape of loadTapes()) {
      await expect(page.locator(`.shelf a[href="${tape.href}"]`)).toHaveCount(1);
    }
    await expect(page.getByText("Tides run on the Moon's clock: the deck's text")).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open the example deck", exact: true }),
    ).toBeVisible();
  });
});

test("copy buttons appear once the clipboard API is there", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Copy both install commands" })).toBeVisible();
});
