import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/deck.fixture";

// Slide 2 of the basic deck has a note segment per click: "Start here.", then "First point.",
// "Second point." and "Third point." A 100px panel shows about two of them.
async function openNotes(page: Page) {
  await page.goto("/#/presenter/2?clicks=1");
  const notes = page.getByRole("region", { name: "Notes" });
  const first = notes.getByText("First point.", { exact: true });
  await expect(first.locator("..")).toHaveAttribute("aria-current", "true");
  await notes.evaluate((region) => {
    region.style.height = "100px";
  });
  return { notes, first, second: notes.getByText("Second point.", { exact: true }) };
}

// Records the panel's scrollTop on every frame from the key press until scrolling ends.
async function recordScroll(page: Page, notes: ReturnType<Page["getByRole"]>) {
  await notes.evaluate((region) => {
    const log: number[] = [region.scrollTop];
    const frame = () => {
      log.push(region.scrollTop);
      if (!(window as { __scrollDone?: boolean }).__scrollDone) requestAnimationFrame(frame);
    };
    region.addEventListener("scrollend", () => {
      (window as { __scrollDone?: boolean }).__scrollDone = true;
      log.push(region.scrollTop);
    });
    (window as { __scrollLog?: number[] }).__scrollLog = log;
    requestAnimationFrame(frame);
  });
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() => (window as { __scrollDone?: boolean }).__scrollDone === true);
  return page.evaluate(() => (window as { __scrollLog?: number[] }).__scrollLog ?? []);
}

test("advancing pins the current click's notes to the top of the panel, past the earlier ones", async ({
  page,
}) => {
  const { first, second } = await openNotes(page);
  await page.keyboard.press("ArrowRight");
  await expect(second.locator("..")).toHaveAttribute("aria-current", "true");
  await expect(second).toBeInViewport();
  await expect(first).not.toBeInViewport();
});

test("the notes panel glides to the next click instead of jumping", async ({ page }) => {
  const { notes } = await openNotes(page);
  const log = await recordScroll(page, notes);
  const start = log[0] ?? 0;
  const end = log.at(-1) ?? 0;
  expect(end).toBeGreaterThan(start);
  expect(log).toEqual([...log].sort((a, b) => a - b));
  expect(log.some((value) => value > start && value < end)).toBe(true);
});

test("with reduced motion the notes panel jumps straight to the next click", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { notes } = await openNotes(page);
  const log = await recordScroll(page, notes);
  const start = log[0] ?? 0;
  const end = log.at(-1) ?? 0;
  expect(end).toBeGreaterThan(start);
  expect(log.every((value) => value === start || value === end)).toBe(true);
});
