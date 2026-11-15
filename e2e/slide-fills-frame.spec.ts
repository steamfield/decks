import { expect } from "@playwright/test";
import { test } from "./fixtures/deck.fixture";

async function boxes(page: import("@playwright/test").Page, slides: string) {
  return page.locator(slides).evaluateAll((elements) =>
    elements.map((slide) => {
      const outer = slide.parentElement?.getBoundingClientRect();
      if (!outer) throw new Error("Slide has no frame");
      const inner = slide.getBoundingClientRect();
      return { frame: Math.round(outer.height), slide: inner ? Math.round(inner.height) : -1 };
    }),
  );
}

test("Every overview tile's slide is as tall as its frame.", async ({ page }) => {
  await page.goto("/#/overview/1");
  await expect(page.getByRole("button", { name: /^Slide 1:/ })).toBeVisible();
  const measured = await boxes(page, '[data-deck-context="overview"]');
  expect(measured.length).toBeGreaterThan(1);
  for (const { frame, slide } of measured) {
    expect(frame).toBeGreaterThan(0);
    expect(slide).toBe(frame);
  }
});

test("The presenter's current and next slides are as tall as their frames.", async ({ page }) => {
  await page.goto("/#/presenter/1");
  await expect(page.getByRole("region", { name: "Next" })).toBeVisible();
  const measured = await boxes(
    page,
    '[data-deck-context="presenter"], [data-deck-context="preview"]',
  );
  expect(measured).toHaveLength(2);
  for (const { frame, slide } of measured) {
    expect(frame).toBeGreaterThan(0);
    expect(slide).toBe(frame);
  }
});
