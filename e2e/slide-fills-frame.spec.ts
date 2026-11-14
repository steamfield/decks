import { expect } from "@playwright/test";
import { test } from "./fixtures/deck.fixture";

async function boxes(page: import("@playwright/test").Page, frames: string) {
  return page.locator(frames).evaluateAll((elements) =>
    elements.map((frame) => {
      const slide = frame.querySelector(":scope > [data-deck-slide]");
      const outer = frame.getBoundingClientRect();
      const inner = slide?.getBoundingClientRect();
      return { frame: Math.round(outer.height), slide: inner ? Math.round(inner.height) : -1 };
    }),
  );
}

test("Every overview tile's slide is as tall as its frame.", async ({ page }) => {
  await page.goto("/#/overview/1");
  await expect(page.getByRole("button", { name: /^Slide 1:/ })).toBeVisible();
  const measured = await boxes(page, ".rd-overview-box .rd-frame");
  expect(measured.length).toBeGreaterThan(1);
  for (const { frame, slide } of measured) {
    expect(frame).toBeGreaterThan(0);
    expect(slide).toBe(frame);
  }
});

test("The presenter's current and next slides are as tall as their frames.", async ({ page }) => {
  await page.goto("/#/presenter/1");
  await expect(page.getByRole("region", { name: "Next" })).toBeVisible();
  const measured = await boxes(page, ".rd-presenter-box .rd-frame");
  expect(measured).toHaveLength(2);
  for (const { frame, slide } of measured) {
    expect(frame).toBeGreaterThan(0);
    expect(slide).toBe(frame);
  }
});
