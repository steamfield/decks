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
  page.on("pageerror", (error) => {
    if (!IGNORED.test(error.message)) errors.push(error.message);
  });
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

test("the theme switch swaps the default and warm slides", async ({ page }) => {
  await page.goto("/");
  const still = (name: string) => page.locator(`#themes [data-still="${name}"]`);
  await expect(still("default")).toBeVisible();
  await expect(still("warm")).toBeHidden();
  await page
    .getByRole("group", { name: "Show the slide with" })
    .getByText("With this theme.json")
    .click();
  await expect(still("warm")).toBeVisible();
  await expect(still("default")).toBeHidden();
  await expect(page.getByRole("radio", { name: "With this theme.json" })).toBeChecked();
});

test("copy buttons appear once the clipboard API is there", async ({ page }) => {
  await page.goto("/");
  // The install tabs' button; the theme.json frame gets its own Copy too.
  await expect(page.getByRole("button", { name: "Copy", exact: true }).first()).toBeVisible();
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
    await expect(page.locator("button[data-copy-command]").first()).toBeHidden();
    for (const example of examples) {
      await expect(page.locator(`#examples a[data-example="${example.name}"]`)).toHaveAttribute(
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

// The fixture deliberately delays settled responses, so rapid input exercises
// coalescing. The real excerpts below exercise the addon's actual bridge.
const stub = readFileSync("e2e/fixtures/stub-deck.html", "utf8");
async function withStubDecks(page: Page) {
  await page.route("**/demo/*/index.html*", (route) =>
    route.fulfill({ contentType: "text/html", body: stub }),
  );
}
const player = (page: Page) => page.locator("[data-player]");
const lead = (page: Page) => page.locator(".caption-lead");
// The player's announcer; copy buttons have live regions of their own.
const live = (page: Page) => page.locator("[data-player] [aria-live=polite]");
const startSlide = hero?.startSlide ?? 1;
const startBeat = hero?.startBeat ?? 0;
async function position(page: Page) {
  return page.frameLocator("iframe").locator("#where").textContent();
}
async function commands(page: Page) {
  return page
    .locator("iframe")
    .evaluate(
      (frame: HTMLIFrameElement) =>
        (frame.contentWindow as Window & { __stubCommands: unknown[] }).__stubCommands,
    );
}

test.describe("the interactive player", () => {
  test.beforeEach(async ({ page }) => {
    await withStubDecks(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await player(page).scrollIntoViewIfNeeded();
  });
  test("opens the interactive deck automatically, paused under reduced motion, with a working slide rail", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await expect(player(page)).toHaveAttribute("data-phase", "ready");
    await expect(page.locator("iframe")).not.toHaveAttribute("inert", "");
    await expect(page.locator("iframe")).not.toHaveAttribute("tabindex", "-1");
    await expect(page.locator("iframe")).toHaveAttribute("title", /interactive deck/);
    await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    expect(await position(page)).toBe(`slide ${startSlide} beat ${startBeat}`);
    await page
      .getByRole("navigation", { name: "Slides" })
      .getByRole("button", { name: /^Slide 2\b/ })
      .click();
    await expect.poll(() => position(page)).toBe("slide 2 beat 0");
    await expect(
      page.getByRole("navigation", { name: "Slides" }).getByRole("button", { name: /^Slide 2\b/ }),
    ).toHaveAttribute("aria-current", "step");
    await expect(lead(page)).toHaveText("First beat lead.");
    expect(errors).toEqual([]);
  });
  test("the first Next advances exactly once and keeps toolbar controls fixed during boot", async ({
    page,
  }) => {
    let release: () => void = () => {};
    const response = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/demo/*/index.html*", async (route) => {
      await response;
      await route.fulfill({
        contentType: "text/html",
        body: stub.replace(
          "const SETTLE_MS =",
          `SLIDES.splice(${hero?.slides ?? 2});\nconst SETTLE_MS =`,
        ),
      });
    });
    const bounds = () =>
      page.evaluate(() =>
        Object.fromEntries(
          [".player-toolbar", ".player-transport", ".player-actions"].map((selector) => {
            const box = document.querySelector(selector)?.getBoundingClientRect();
            if (!box) throw new Error(`missing ${selector}`);
            return [selector, { x: box.x, y: box.y, width: box.width, height: box.height }];
          }),
        ),
      );
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await player(page).scrollIntoViewIfNeeded();
    await expect(player(page)).toHaveAttribute("data-phase", "booting");
    await expect(page.locator("iframe")).toHaveCSS("visibility", "hidden");
    await expect(page.locator(".player-canvas img")).toBeVisible();
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    const before = await bounds();
    try {
      await page.getByRole("button", { name: "Step forward", exact: true }).click();
      await expect(player(page)).toHaveAttribute("data-phase", "booting");
      expect(await bounds()).toEqual(before);
    } finally {
      release();
    }
    await expect(player(page)).toHaveAttribute("data-phase", "ready");
    await expect(live(page)).toContainText(`step ${startBeat + 2} of`);
    expect(await position(page)).toBe(`slide ${startSlide} beat ${startBeat + 1}`);
    expect(await bounds()).toEqual(before);
    expect(await commands(page)).toEqual([
      expect.objectContaining({ cmd: "go", slide: startSlide, beat: startBeat + 1 }),
    ]);
  });

  test("rapid alternating arrows preserve the final position with bounded commands", async ({
    page,
  }) => {
    await expect(player(page)).toHaveAttribute("data-phase", "ready");
    const before = (await commands(page)).length;
    await player(page).focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => position(page)).toBe(`slide ${startSlide} beat ${startBeat + 1}`);
    await expect(live(page)).toContainText(`step ${startBeat + 2} of`);
    await page.keyboard.press("ArrowLeft");
    await expect.poll(() => position(page)).toBe(`slide ${startSlide} beat ${startBeat}`);
    const sent = (await commands(page)).slice(before);
    expect(sent.length).toBeGreaterThanOrEqual(2);
    expect(sent.length).toBeLessThanOrEqual(4);
    expect(sent).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ cmd: "go", slide: startSlide, beat: startBeat }),
      ]),
    );
  });
  test("iframe keys update the host and manual input pauses Play", async ({ page }) => {
    await expect(player(page)).toHaveAttribute("data-phase", "ready");
    await page.getByRole("button", { name: "Play", exact: true }).click();
    await page.frameLocator("iframe").locator("body").click();
    await page.keyboard.press("ArrowRight");
    await expect.poll(() => position(page)).toBe(`slide ${startSlide} beat ${startBeat + 1}`);
    await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
    await expect(live(page)).toContainText(`step ${startBeat + 2} of`);
  });
  test("a featured selection loads that live deck at its start, paused", async ({ page }) => {
    const pick = examples[1];
    if (!pick) throw new Error("two featured examples are required");
    await expect(player(page)).toHaveAttribute("data-phase", "ready");
    await page
      .getByRole("button", { name: pick.featured?.label ?? pick.title, exact: true })
      .click();
    await expect(player(page)).toHaveAttribute("data-phase", "ready");
    // The switcher marks the pick; the player's name carries the full title.
    await expect(
      page.getByRole("button", { name: pick.featured?.label ?? pick.title, exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(player(page)).toHaveAttribute(
      "aria-label",
      new RegExp(`^Deck player: ${pick.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`),
    );
    await expect(page.locator("iframe")).toHaveAttribute("src", new RegExp(`/demo/${pick.name}/`));
    await expect.poll(() => position(page)).toBe(`slide ${pick.startSlide} beat ${pick.startBeat}`);
  });
});

test("autoplays the real iframe without recorded media when motion is allowed", async ({
  page,
}) => {
  const recordings: string[] = [];
  page.on("request", (request) => {
    if (/\/loops\//.test(request.url())) recordings.push(request.url());
  });
  await withStubDecks(page);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await player(page).scrollIntoViewIfNeeded();
  await expect(player(page)).toHaveAttribute("data-phase", "ready");
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(live(page)).toContainText(`step ${startBeat + 2} of`, { timeout: 10_000 });
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect(page.locator("video")).toHaveCount(0);
  expect(recordings).toEqual([]);
});

test("reduced motion loads a paused live deck without recorded media", async ({ page }) => {
  const recordings: string[] = [];
  page.on("request", (request) => {
    if (/\/loops\//.test(request.url())) recordings.push(request.url());
  });
  await withStubDecks(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await player(page).scrollIntoViewIfNeeded();
  await expect(player(page)).toHaveAttribute("data-phase", "ready");
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  expect(await position(page)).toBe(`slide ${startSlide} beat ${startBeat}`);
  await expect(page.locator("video")).toHaveCount(0);
  expect(recordings).toEqual([]);
});

for (const width of [360, 768, 800, 1024, 1280, 1440, 1920]) {
  test(`at ${width}px the player shares the page's one column and keeps 16:9`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const box = await page.locator(".player-canvas").boundingBox();
    const gutter = width < 768 ? 16 : 32;
    const frame = await player(page).boundingBox();
    expect(box).not.toBeNull();
    // One 1360px column (1296px of content) for the header, hero and player.
    const expectedWidth = Math.min(1296, width - gutter * 2);
    expect(frame?.x).toBeCloseTo((width - expectedWidth) / 2, 0);
    expect(frame?.width).toBeCloseTo(expectedWidth, 0);
    // The toolbar's groups never overlap, in one row or two.
    const groups = await page.evaluate(() =>
      [".player-examples", ".player-position", ".player-transport", ".player-actions"].map(
        (selector) => {
          const box = document.querySelector(selector)?.getBoundingClientRect();
          if (!box) throw new Error(`missing ${selector}`);
          return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
        },
      ),
    );
    for (const [i, a] of groups.entries())
      for (const b of groups.slice(i + 1)) {
        const overlap =
          a.left < b.right - 1 &&
          b.left < a.right - 1 &&
          a.top < b.bottom - 1 &&
          b.top < a.bottom - 1;
        expect(overlap).toBe(false);
      }
    for (const edge of ["header a[href='/']", "#hero-title"]) {
      const left = await page.locator(edge).first().boundingBox();
      expect(left?.x).toBeCloseTo(frame?.x ?? 0, 0);
    }
    expect((box?.width ?? 0) / (box?.height ?? 1)).toBeCloseTo(16 / 9, 2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    for (const text of [lead(page), page.locator(".caption-body")]) {
      if (await text.count())
        expect(
          await text.evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize)),
        ).toBeGreaterThanOrEqual(16);
    }
  });
}

test("the toolbar remains above the canvas while scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 600 });
  await page.goto("/");
  await page
    .locator(".player-canvas")
    .evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + 150));
  const toolbar = await page.locator(".player-toolbar").boundingBox();
  expect(toolbar?.y).toBeGreaterThanOrEqual(0);
  expect(toolbar?.y).toBeLessThan(100);
  await expect(page.getByRole("button", { name: "Step forward" })).toBeVisible();
});

test("at 360px transport controls have 44px touch targets", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.goto("/");
  for (const label of ["Step back", "Step forward"]) {
    const box = await page.getByRole("button", { name: label }).boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }
  await expect(page.getByRole("link", { name: "Open deck", exact: true })).toBeVisible();
});

for (const name of ["opendata-showcase", "aisd-showcase"]) {
  test(`${name} real bridge handles iframe keys and a boundary`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await player(page).scrollIntoViewIfNeeded();
    await expect(player(page)).toHaveAttribute("data-phase", /booting|ready/);
    const example = examples.find((item) => item.name === name);
    if (!example) throw new Error(`missing featured example ${name}`);
    await page
      .getByRole("button", { name: example.featured?.label ?? example.title, exact: true })
      .click();
    await expect(player(page)).toHaveAttribute("data-phase", "ready", { timeout: 20_000 });
    await page
      .frameLocator("iframe")
      .locator("body")
      .click({ position: { x: 10, y: 10 } });
    await page.keyboard.press("ArrowRight");
    await expect(live(page)).toContainText("step 2 of");
    await page.keyboard.press("ArrowLeft");
    await expect(live(page)).toContainText("step 1 of");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowRight");
    await expect(live(page)).toContainText("step 2 of");
    const frame = page.frameLocator("iframe");
    const root = frame.locator(".slidev-page-1 .od-story-frame").first();
    const bounds = await root.boundingBox();
    const iframe = await page.locator("iframe").boundingBox();
    expect((bounds?.width ?? 0) / (bounds?.height ?? 1)).toBeCloseTo(16 / 9, 2);
    expect(Math.abs((bounds?.width ?? 0) - (iframe?.width ?? 0))).toBeLessThanOrEqual(2);
    expect(Math.abs((bounds?.height ?? 0) - (iframe?.height ?? 0))).toBeLessThanOrEqual(2);
    const extras = await frame.locator("#slide-container > div:not(#slide-content)").all();
    for (const extra of extras) await expect(extra).toBeHidden();
    await page.evaluate(() => {
      const replies: { requestId?: number; settled?: boolean; slide?: number; beat?: number }[] =
        [];
      (window as unknown as Window & { __deckReplies?: typeof replies }).__deckReplies = replies;
      window.addEventListener("message", (event) => {
        if (event.data?.type === "decks:state") replies.push(event.data);
      });
    });
    for (const command of [
      { cmd: "go", slide: 1, beat: 0, requestId: 91001 },
      { cmd: "prev", requestId: 91002 },
      { cmd: "go", slide: 1, beat: 0, requestId: 91003 },
    ]) {
      await page
        .locator("iframe")
        .evaluate(
          (el: HTMLIFrameElement, command) =>
            el.contentWindow?.postMessage({ type: "decks:cmd", ...command }, location.origin),
          command,
        );
      await expect
        .poll(() =>
          page.evaluate(
            (id) =>
              (
                window as unknown as Window & {
                  __deckReplies: {
                    requestId?: number;
                    settled?: boolean;
                    slide?: number;
                    beat?: number;
                  }[];
                }
              ).__deckReplies.filter((reply) => reply.requestId === id && reply.settled),
            command.requestId,
          ),
        )
        .toEqual([
          expect.objectContaining({
            requestId: command.requestId,
            slide: 1,
            beat: 0,
            settled: true,
          }),
        ]);
    }
    await page.screenshot({ path: `test-results/${name}-interactive.png`, fullPage: false });
    expect(errors).toEqual([]);
  });
}
test("the real graph survives two complete forward and reverse walks", async ({ page }) => {
  test.setTimeout(90_000);
  const example = examples.find((item) => item.name === "opendata-showcase");
  if (!example) throw new Error("missing graph excerpt");
  const errors = collectErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(player(page)).toHaveAttribute("data-phase", "ready");
  await page
    .frameLocator("iframe")
    .locator("body")
    .evaluate(() => {
      const commands: unknown[] = [];
      (window as unknown as Window & { __receivedCommands: unknown[] }).__receivedCommands =
        commands;
      window.addEventListener("message", (event) => {
        if (event.data?.type === "decks:cmd") commands.push(event.data);
      });
    });
  const ordered = [...example.states].sort((a, b) => a.slide - b.slide || a.beat - b.beat);
  const destinations: { slide: number; beat: number }[] = [];
  for (let cycle = 0; cycle < 2; cycle++) {
    for (const [label, states] of [
      ["Step forward", ordered.slice(1)],
      ["Step back", ordered.slice(0, -1).reverse()],
    ] as const) {
      for (const state of states) {
        await page.getByRole("button", { name: label, exact: true }).click();
        await expect(live(page)).toHaveText(
          `Slide ${state.slide} of ${example.slides}, step ${state.beat + 1} of ${state.beats + 1}. ${state.lead}`,
          { timeout: 15_000 },
        );
        await expect(lead(page)).toHaveText(state.lead);
        if (state.slide === 2 && state.beat >= 1) {
          const canvas = page
            .frameLocator("iframe")
            .locator(".slidev-page-2 .od-graph3d-host canvas")
            .first();
          await expect(canvas).toBeVisible();
          expect(
            await canvas.evaluate(
              (element: HTMLCanvasElement) => element.width > 0 && element.height > 0,
            ),
          ).toBe(true);
        }
        await page
          .frameLocator("iframe")
          .locator("body")
          .evaluate(() => {
            const frame = window as unknown as Window & { __rafFrames: number };
            frame.__rafFrames = 0;
            requestAnimationFrame(() => {
              frame.__rafFrames++;
              requestAnimationFrame(() => {
                frame.__rafFrames++;
              });
            });
          });
        await expect
          .poll(
            () =>
              page
                .frameLocator("iframe")
                .locator("body")
                .evaluate(
                  () => (window as unknown as Window & { __rafFrames: number }).__rafFrames,
                ),
            // A liveness check: a hung deck never paints two frames. The budget
            // matches the step waits above, because the graph slides draw with
            // SwiftShader here and two frames there have taken up to 3.7s.
            { timeout: 15_000 },
          )
          .toBe(2);
        destinations.push({ slide: state.slide, beat: state.beat });
      }
    }
  }
  const received = await page
    .frameLocator("iframe")
    .locator("body")
    .evaluate(
      () =>
        (
          window as unknown as Window & {
            __receivedCommands: {
              type: string;
              cmd: string;
              slide: number;
              beat: number;
              requestId: number;
            }[];
          }
        ).__receivedCommands,
    );
  expect(received.map(({ slide, beat }) => ({ slide, beat }))).toEqual(destinations);
  expect(
    received.every(
      (command) =>
        command.type === "decks:cmd" && command.cmd === "go" && Number.isInteger(command.requestId),
    ),
  ).toBe(true);
  expect(new Set(received.map((command) => command.requestId)).size).toBe(destinations.length);
  expect(errors).toEqual([]);
});

test("hovering and focusing real campus marks pauses the live deck", async ({ page }) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await player(page).scrollIntoViewIfNeeded();
  await expect(player(page)).toHaveAttribute("data-phase", "ready");
  await page.getByRole("button", { name: "Austin schools", exact: true }).click();
  await expect(player(page)).toHaveAttribute("data-phase", "ready");
  const frame = page.frameLocator("iframe");
  const campus = frame.getByRole("button", { name: /: grade [A-F],/ }).first();
  const label = await campus.getAttribute("aria-label");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await campus.hover();
  await expect(frame.getByRole("tooltip")).toBeVisible();
  await expect(frame.getByRole("tooltip")).toContainText(label?.split(": grade")[0] ?? "");
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await page.clock.runFor(15_000);
  await expect(page.locator(".counter")).toContainText("Slide 1 · Step 1 of 4");
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await campus.focus();
  await expect(page.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await page.clock.runFor(15_000);
  await expect(page.locator(".counter")).toContainText("Slide 1 · Step 1 of 4");
  await page.keyboard.press("Enter");
  await expect(page.locator(".counter")).toContainText("Slide 1 · Step 1 of 4");
  await page.keyboard.press("ArrowRight");
  await expect(live(page)).toContainText("Slide 1 of 3, step 2 of 4.");
});

for (const width of [390, 1440])
  test(`at ${width}px shell stays within 350 KB and live assets are measured separately`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    // Every request through the DevTools protocol, so the loop's range requests,
    // which have no body Playwright can read, are counted by the bytes that arrived.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Network.enable");
    type Request = { url: string; mime: string; bytes: number; done: boolean };
    const requests = new Map<string, Request>();
    cdp.on("Network.requestWillBeSent", ({ requestId, request }) => {
      requests.set(requestId, { url: request.url, mime: "", bytes: 0, done: false });
    });
    cdp.on("Network.responseReceived", ({ requestId, response }) => {
      const request = requests.get(requestId);
      if (request) request.mime = response.mimeType;
    });
    cdp.on("Network.dataReceived", ({ requestId, encodedDataLength }) => {
      const request = requests.get(requestId);
      if (request) request.bytes += encodedDataLength;
    });
    const finished = new Map<string, number>();
    cdp.on("Network.loadingFinished", ({ requestId, encodedDataLength }) => {
      finished.set(requestId, encodedDataLength);
      const request = requests.get(requestId);
      if (request) request.done = true;
    });
    cdp.on("Network.loadingFailed", ({ requestId }) => {
      // An aborted range request: what arrived before the abort is in its dataReceived bytes.
      const request = requests.get(requestId);
      if (request) request.done = true;
    });
    await page.goto("/", { waitUntil: "networkidle" });
    // The live island can begin below the intro on short screens. Its resources
    // are reported separately from the page shell and loading poster.
    await player(page).scrollIntoViewIfNeeded();
    await expect(player(page)).toHaveAttribute("data-phase", "ready", { timeout: 20_000 });
    await expect(page.locator("video")).toHaveCount(0);
    await page.waitForLoadState("networkidle");
    const sizes: [string, number][] = [];
    for (const [id, request] of requests) {
      if (request.url.startsWith("data:")) continue;
      expect(request.done, `still loading, so unmeasured: ${request.url}`).toBe(true);
      // A static host compresses text, and the preview server doesn't, so text is
      // counted gzipped from its body; images and video go over as they are.
      if (/text|javascript|json|svg|xml/.test(request.mime) && finished.has(id)) {
        const { body, base64Encoded } = await cdp.send("Network.getResponseBody", {
          requestId: id,
        });
        sizes.push([
          request.url,
          gzipSync(Buffer.from(body, base64Encoded ? "base64" : "utf8")).length,
        ]);
      } else {
        sizes.push([request.url, finished.get(id) ?? request.bytes]);
      }
    }
    expect(sizes.length).toBeGreaterThan(0);
    const live = sizes.filter(([url]) => /\/demo\//.test(url));
    const shell = sizes.filter(([url]) => !/\/demo\//.test(url));
    expect(sizes.some(([url]) => /\/loops\//.test(url))).toBe(false);
    expect(live.length, "live deck resources must be measured").toBeGreaterThan(0);
    const shellBytes = shell.reduce((sum, [, size]) => sum + size, 0);
    const liveBytes = live.reduce((sum, [, size]) => sum + size, 0);
    const report = sizes.map(([url, size]) => `${Math.round(size / 1000)} KB ${url}`).join("\n");
    await test.info().attach(`network-budget-${width}`, {
      body: JSON.stringify({ width, shellBytes, liveBytes, requests: sizes }, null, 2),
      contentType: "application/json",
    });
    expect(shellBytes, report).toBeLessThanOrEqual(350_000);
  });
