import { expect, type Page } from "@playwright/test";
import { test } from "./deck.fixture";

const headings = ["Basic fixture deck", "Three steps", "A deck component", "One click", "The end"];
const points = ["First point", "Second point", "Third point"];
const frames: readonly (readonly [number, number])[] = [
  [1, 0],
  [2, 0],
  [2, 1],
  [2, 2],
  [2, 3],
  [3, 0],
  [4, 0],
  [4, 1],
  [5, 0],
];

async function position(page: Page, slide: number, click = 0) {
  await expect(page.getByRole("heading", { name: headings[slide - 1], exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`#/${slide}${click ? `\\?clicks=${click}` : ""}$`));
  if (slide === 2) await expect(page.getByRole("listitem")).toHaveText(points.slice(0, click));
  if (slide >= 4) {
    await expect(
      page.getByText(`Slide ${slide} of 5, click ${click} of ${slide === 4 ? 1 : 0}, active`, {
        exact: true,
      }),
    ).toBeVisible();
  }
}

test("A cold start loads once without console errors or outdated dependencies.", async ({
  page,
}) => {
  const errors: string[] = [];
  const outdated: string[] = [];
  const documents: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => {
    if (response.status() === 504) outdated.push(response.url());
  });
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      documents.push(request.url());
  });
  await page.goto("/");
  await position(page, 1);
  await page.evaluate(() => {
    window.e2eDocument = "first paint";
  });
  // Idle prefetch can discover dependencies after the first slide has painted.
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Basic fixture deck", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => window.e2eDocument)).toBe("first paint");
  expect(documents).toHaveLength(1);
  expect(outdated).toEqual([]);
  expect(errors).toEqual([]);
});

test("Arrow keys walk every frame forward and backward and stop at the ends.", async ({ page }) => {
  await page.goto("/");
  for (const [slide, click] of frames) {
    await position(page, slide, click);
    await page.keyboard.press("ArrowRight");
  }
  await position(page, 5);
  for (const [slide, click] of frames.toReversed()) {
    await position(page, slide, click);
    await page.keyboard.press("ArrowLeft");
  }
  await position(page, 1);
});

test("Slide shortcuts, Home, End, Space and Shift+Space navigate the deck.", async ({ page }) => {
  await page.goto("/#/2?clicks=2");
  await position(page, 2, 2);
  for (const [key, slide, click] of [
    ["ArrowDown", 3, 0],
    ["ArrowUp", 2, 0],
    ["End", 5, 0],
    ["Home", 1, 0],
    ["Space", 2, 0],
    ["Space", 2, 1],
    ["Shift+Space", 2, 0],
    ["Shift+Space", 1, 0],
  ] as const) {
    await page.keyboard.press(key);
    await position(page, slide, click);
  }
});

test("Reload keeps the slide, click and URL.", async ({ page }) => {
  await page.goto("/#/2?clicks=2");
  await position(page, 2, 2);
  const url = page.url();
  await page.reload();
  await position(page, 2, 2);
  await expect(page).toHaveURL(url);
});

test("The URL opens and clamps positions and browser Back restores the previous slide.", async ({
  page,
}) => {
  await page.goto("/#/4?clicks=1");
  await position(page, 4, 1);
  await page.goto("/#/99");
  await position(page, 5);
  await page.goto("/#/2?clicks=9");
  await position(page, 2, 3);
  await page.keyboard.press("ArrowRight");
  await position(page, 3);
  await page.goBack();
  await position(page, 2, 3);
});

test("The hidden slide has no frame and the deck contains five slides.", async ({ page }) => {
  await page.goto("/");
  for (let slide = 1; slide <= 5; slide++) {
    await position(page, slide);
    await expect(
      page.getByRole("heading", {
        name: "This slide is hidden and never numbered.",
        includeHidden: true,
      }),
    ).toHaveCount(0);
    await page.keyboard.press("ArrowDown");
  }
  await position(page, 5);
});

test("Deck components and computed MDX render without imports in the slide.", async ({ page }) => {
  await page.goto("/#/3");
  await position(page, 3);
  await expect(page.getByText("auto-provided", { exact: true })).toBeVisible();
  await expect(page.getByText("4 is computed in MDX.", { exact: true })).toBeVisible();
});

test("Only the active slide and its neighbours are mounted.", async ({ page }) => {
  await page.goto("/#/3");
  await position(page, 3);
  await expect(page.locator("[data-deck-slide]")).toHaveCount(3);
  await expect(page.locator("[data-deck-active]")).toHaveCount(1);
  await expect(page.locator('[data-deck-slide="3"][data-deck-active]')).toBeVisible();
  await expect(page.locator('[data-deck-slide="2"]')).toHaveCount(1);
  await expect(page.locator('[data-deck-slide="4"]')).toHaveCount(1);
  await expect(page.locator('[data-deck-slide="2"]')).toBeHidden();
  await expect(page.locator('[data-deck-slide="4"]')).toBeHidden();
});

test("The canvas fills each window and live resizing preserves the document.", async ({ page }) => {
  await page.goto("/#/3");
  await position(page, 3);
  await page.evaluate(() => {
    window.e2eDocument = "before resize";
  });
  for (const [width, height, logicalWidth, logicalHeight] of [
    [1920, 1080, 1920, 1080],
    [960, 540, 1920, 1080],
    [1600, 1200, 1920, 1440],
    [2560, 1080, 2560, 1080],
  ] as const) {
    await page.setViewportSize({ width, height });
    const frame = page.locator("#deck-frame");
    await expect(frame).toHaveCSS("--deck-w", String(logicalWidth));
    await expect(frame).toHaveCSS("--deck-h", String(logicalHeight));
    await expect.poll(() => frame.boundingBox()).toEqual({ x: 0, y: 0, width, height });
    const heading = await page
      .getByRole("heading", { name: "A deck component", exact: true })
      .boundingBox();
    expect(heading).not.toBeNull();
    if (!heading) throw new Error("Active heading has no bounding box");
    expect(heading.x).toBeGreaterThanOrEqual(0);
    expect(heading.y).toBeGreaterThanOrEqual(0);
    expect(heading.x + heading.width).toBeLessThanOrEqual(width);
    expect(heading.y + heading.height).toBeLessThanOrEqual(height);
  }
  expect(await page.evaluate(() => window.e2eDocument)).toBe("before resize");
});
