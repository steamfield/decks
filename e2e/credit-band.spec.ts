import { expect, test } from "@playwright/test";
import { kitFixture } from "./fixtures/kit.fixture";

const slides = {
  "slides/01-story.mdx":
    '<div className="od-slide is-story"><div className="od-story-frame">Stage</div></div>',
  "slides/02-layout.mdx": "<Section>\n\n# Bottom heading\n\n</Section>",
};

async function bottoms(page: import("@playwright/test").Page, content: string) {
  const box = async (locator: import("@playwright/test").Locator) => {
    const found = await locator.boundingBox();
    if (!found) throw new Error("Missing box");
    return found;
  };
  const slide = await box(page.locator("[data-deck-active]"));
  const target = await box(page.locator("[data-deck-active]").locator(content));
  return { slide: slide.y + slide.height, content: target.y + target.height };
}

test("A story frame and a layout's content both end above the credit.", async ({ page }) => {
  const deck = await kitFixture(slides);
  try {
    await page.goto(`${deck.url}#/1`);
    const credit = page.locator("[data-deck-active]").getByRole("link", {
      name: "Created with Decks",
    });
    await expect(credit).toBeVisible();
    const top = async () => (await credit.boundingBox())?.y ?? Number.NaN;
    expect((await bottoms(page, ".od-story-frame")).content).toBeLessThanOrEqual(await top());
    await page.goto(`${deck.url}#/2`);
    await expect(page.getByRole("heading", { name: "Bottom heading" })).toBeVisible();
    expect((await bottoms(page, "h1")).content).toBeLessThanOrEqual(await top());
  } finally {
    await deck.close();
  }
});

test("With the credit turned off a story frame reaches the bottom of a 16:9 window.", async ({
  page,
}) => {
  const deck = await kitFixture({
    ...slides,
    "deck.config.ts": 'export default { title: "Kit test", credit: false };',
  });
  try {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${deck.url}#/1`);
    await expect(page.getByText("Stage")).toBeVisible();
    const measured = await bottoms(page, ".od-story-frame");
    expect(Math.round(measured.content)).toBe(Math.round(measured.slide));
  } finally {
    await deck.close();
  }
});
