import { expect, type Locator, type Page } from "@playwright/test";
import { test } from "./fixtures/deck.fixture";
import { kitFixture } from "./fixtures/kit.fixture";

const slides = {
  "slides/01-story.mdx":
    '<div className="od-slide is-story"><div className="od-story-frame">Stage</div></div>',
  "slides/02-layout.mdx": "<Section>\n\n# Bottom heading\n\n</Section>",
};

async function bottoms(page: Page, content: Locator) {
  const box = async (locator: Locator) => {
    const found = await locator.boundingBox();
    if (!found) throw new Error("Missing box");
    return found;
  };
  const slide = await box(page.locator("[data-deck-active]"));
  const target = await box(content);
  return { slide: slide.y + slide.height, content: target.y + target.height };
}

test("A story frame and a layout's content both end above the credit.", async ({
  page,
  deckServer,
}) => {
  const deck = await kitFixture(deckServer, slides);
  try {
    await page.goto(`${deck.url}#/1`);
    const credit = page.locator("[data-deck-active]").getByRole("link", {
      name: "Created with Decks",
    });
    await expect(credit).toBeVisible();
    const top = async () => (await credit.boundingBox())?.y ?? Number.NaN;
    expect(
      (await bottoms(page, page.getByText("Stage", { exact: true }))).content,
    ).toBeLessThanOrEqual(await top());
    await page.goto(`${deck.url}#/2`);
    await expect(page.getByRole("heading", { name: "Bottom heading" })).toBeVisible();
    expect(
      (await bottoms(page, page.getByRole("heading", { name: "Bottom heading" }))).content,
    ).toBeLessThanOrEqual(await top());
  } finally {
    await deck.close();
  }
});

test("With the credit turned off a story frame reaches the bottom of a 16:9 window.", async ({
  page,
  deckServer,
}) => {
  const deck = await kitFixture(deckServer, {
    ...slides,
    "deck.config.ts": 'export default { title: "Kit test", credit: false };',
  });
  try {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`${deck.url}#/1`);
    await expect(page.getByText("Stage")).toBeVisible();
    const measured = await bottoms(page, page.getByText("Stage", { exact: true }));
    expect(Math.round(measured.content)).toBe(Math.round(measured.slide));
  } finally {
    await deck.close();
  }
});
