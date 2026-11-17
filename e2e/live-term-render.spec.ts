import { expect, type Page } from "@playwright/test";
import { settled } from "./fixtures/deck-driver";
import { test } from "./fixtures/live-term";

test("a plain pane draws readable default text and preserves authored colours", async ({
  page,
  liveServer,
}) => {
  await page.goto(`${liveServer.url}#/2`);
  const terminal = page.getByRole("application", { name: "Live terminal" });
  const prompt = terminal.locator(".xterm-rows span").filter({ hasText: "$" }).first();
  const background = terminal.locator("..");
  await expect(prompt).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(background).toHaveCSS("background-color", "rgb(0, 0, 0)");

  await page.goto(`${liveServer.url}#/1`);
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
  await page.addStyleTag({
    content:
      '[aria-label="Plain terminal"] { --deck-term-foreground: rgb(210, 220, 230); --deck-term-background: rgb(20, 30, 40); }',
  });
  await page.goto(`${liveServer.url}#/2`);
  await expect(prompt).toHaveCSS("color", "rgb(210, 220, 230)");
  await expect(background).toHaveCSS("background-color", "rgb(20, 30, 40)");
});

async function expectGrid(page: Page, dpr: number) {
  await settled(page);
  const terminal = page.getByRole("application", { name: "Live terminal" });
  await expect(page.getByLabel("Terminal status")).toHaveText("Live");
  // These are xterm's rendered DOM rows, not its private renderer services.
  const grid = await terminal.locator(".xterm-screen").boundingBox();
  const pane = await page.getByLabel("Terminal screen").boundingBox();
  const last = await terminal.locator(".xterm-rows > div").nth(11).boundingBox();
  if (!grid || !pane || !last) throw new Error("Missing rendered terminal grid");
  const advance = (grid.width / 60) * dpr;
  expect(advance).toBeCloseTo(Math.round(advance), 4);
  expect(grid.x).toBeGreaterThanOrEqual(pane.x);
  expect(grid.y).toBeGreaterThanOrEqual(pane.y);
  expect(grid.x + grid.width).toBeLessThanOrEqual(pane.x + pane.width);
  expect(last.y + last.height).toBeLessThanOrEqual(pane.y + pane.height + 0.01);
  expect(grid.height).toBeCloseTo(last.y + last.height - grid.y, 1);
  expect((grid.x - pane.x) * 2 + grid.width + 6).toBeCloseTo(pane.width, 1);
  expect((grid.y - pane.y) * 2 + grid.height).toBeCloseTo(pane.height, 1);
  // A one-device-pixel advance can leave more than 10% spare height with a small bitmap
  // font. Bound the margin by that step, including xterm's per-row measurement rounding.
  const stepHeight = grid.height / advance + 24 / dpr;
  expect(pane.width - grid.width - 6 < 60 / dpr || pane.height - grid.height < stepHeight).toBe(
    true,
  );
}

for (const deviceScaleFactor of [1, 2]) {
  test.describe(`device pixel ratio ${deviceScaleFactor}`, () => {
    test.use({ deviceScaleFactor });
    test("the fixed grid fits at whole-pixel advances through a 16:9 to 4:3 resize", async ({
      page,
      liveServer,
    }) => {
      await page.setViewportSize({ width: 1600, height: 900 });
      await page.goto(liveServer.url);
      await expectGrid(page, deviceScaleFactor);
      await page.setViewportSize({ width: 960, height: 720 });
      // Wait on the changed slide canvas before checking the rebuilt terminal.
      await expect
        .poll(async () => (await page.getByLabel("Terminal screen").boundingBox())?.width)
        .toBe(960);
      await expectGrid(page, deviceScaleFactor);
    });
  });
}

test.describe("pane bounds and DPR changes without a slide-scale change", () => {
  test.use({ deviceScaleFactor: 2 });
  test("the live grid refits a narrower pane and a move from DPR 2 to 1", async ({
    page,
    context,
    liveServer,
  }) => {
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(liveServer.url);
    await expectGrid(page, 2);
    const screen = page.getByRole("application").locator(".xterm-screen");
    const before = (await screen.boundingBox())?.width ?? 0;
    await page.getByRole("button", { name: "Resize terminal" }).click();
    // The refit width depends on the platform's font metrics, so wait for the narrower grid.
    await expect.poll(async () => (await screen.boundingBox())?.width).toBeLessThan(before);
    await expectGrid(page, 2);
    const canvas = page.locator("#deck-frame");
    const scale = await canvas.evaluate((element) =>
      getComputedStyle(element).getPropertyValue("--deck-scale"),
    );
    const session = await context.newCDPSession(page);
    try {
      await session.send("Emulation.setDeviceMetricsOverride", {
        // Chromium flushes resolution-query events on viewport resize. This width change
        // leaves the height-constrained slide scale and the narrowed pane's size unchanged.
        width: 1601,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false,
      });
      await page.waitForFunction(() => window.devicePixelRatio === 1);
      await expect(canvas).toHaveCSS("--deck-scale", scale);
      // Whole-pixel advances at DPR 1 hold only once the grid has refit for the new ratio.
      await expect(() => expectGrid(page, 1)).toPass();
    } finally {
      await session.detach();
    }
  });
});

test("an empty replay keeps the recording until real prompt data is rendered", async ({
  page,
  liveServer,
}) => {
  const held = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  await page.routeWebSocket("**", (socket) => {
    const server = socket.connectToServer();
    server.onMessage(async (message) => {
      const frame: unknown = typeof message === "string" ? JSON.parse(message) : undefined;
      if (
        typeof frame === "object" &&
        frame !== null &&
        "event" in frame &&
        frame.event === "deck-term:data"
      ) {
        held.resolve();
        await release.promise;
      }
      socket.send(message);
    });
  });
  try {
    // The warm-up only starts "hello". This pane starts a fresh shell with an empty replay.
    await page.goto(`${liveServer.url}#/2`);
    await held.promise;
    const terminal = page.getByRole("application", { name: "Live terminal", includeHidden: true });
    await expect(terminal.locator(".xterm-rows > div")).toHaveCount(12);
    await settled(page);
    await expect(page.getByLabel("Plain terminal recording")).toBeVisible();
    await expect(page.getByRole("application", { name: "Live terminal" })).toHaveCount(0);
    release.resolve();
    await expect(page.getByRole("application")).toContainText("$");
    await expect(page.getByLabel("Plain terminal recording")).toHaveCount(0);
  } finally {
    release.resolve();
  }
});

test.describe("tall cell bounds and an odd column count at DPR 2", () => {
  test.use({ deviceScaleFactor: 2 });
  test("a font with tall cell bounds keeps the final row inside the pane", async ({
    page,
    liveServer,
  }) => {
    await page.goto(`${liveServer.url}#/2`);
    const terminal = page.getByRole("application", { name: "Live terminal" });
    await expect(terminal).toBeVisible();
    const pane = await page
      .getByRole("region", { name: "Plain terminal", exact: true })
      .boundingBox();
    const grid = await terminal.locator(".xterm-screen").boundingBox();
    const last = await terminal.locator(".xterm-rows > div").nth(11).boundingBox();
    if (!pane || !grid || !last) throw new Error("Missing tall-font terminal grid");
    const advance = (grid.width / 61) * 2;
    expect(advance).toBeCloseTo(Math.round(advance), 4);
    expect(last.y + last.height).toBeLessThanOrEqual(pane.y + pane.height + 0.01);
    expect(grid.height).toBeCloseTo(last.y + last.height - grid.y, 1);
  });
});

test("the recording stays visible through font loading and the first xterm render", async ({
  page,
  liveServer,
}) => {
  const requested = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  await page.route("**/fonts/terminal.woff2", async (route) => {
    requested.resolve();
    await release.promise;
    await route.continue();
  });
  try {
    await page.goto(liveServer.url, { waitUntil: "domcontentloaded" });
    await requested.promise;
    await expect(page.getByLabel("Terminal recording", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Terminal status")).not.toHaveText("Live");
    const recording = await page.evaluateHandle(() => {
      const frames: boolean[] = [];
      const state = { frames, done: false };
      const sample = () => {
        const fallback = document.querySelector('[aria-label="Terminal recording"]');
        const shell = document.querySelector('[aria-label="Live terminal"]');
        const showingFallback =
          fallback instanceof HTMLElement && fallback.checkVisibility({ visibilityProperty: true });
        const showingShell =
          shell instanceof HTMLElement &&
          shell.checkVisibility({ visibilityProperty: true }) &&
          Boolean(shell.querySelector(".xterm-rows")?.textContent?.trim());
        frames.push(showingFallback || showingShell);
        if (!state.done) requestAnimationFrame(sample);
      };
      sample();
      return state;
    });
    release.resolve();
    await expect(page.getByLabel("Terminal status")).toHaveText("Live");
    await expect(page.getByLabel("Terminal recording", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("application")).toContainText("$");
    const frames = await recording.evaluate((state) => {
      state.done = true;
      return state.frames;
    });
    expect(frames.length).toBeGreaterThan(0);
    expect(frames.every(Boolean)).toBe(true);
    await recording.dispose();
  } finally {
    release.resolve();
    await page.unrouteAll({ behavior: "wait" });
  }
});
