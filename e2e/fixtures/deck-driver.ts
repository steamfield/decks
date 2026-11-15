import { expect, type Frame, type Page } from "@playwright/test";

// Frames use the same public completion signal as top-level decks.
export async function startSettling(page: Page | Frame) {
  await page.waitForFunction(() => window.__deck !== undefined);
  return page.evaluateHandle(() => {
    if (!window.__deck) throw new Error("Missing deck settle API");
    const state = { done: false, promise: Promise.resolve() };
    state.promise = window.__deck.settled().then(() => {
      state.done = true;
    });
    return state;
  });
}

export async function settled(page: Page | Frame) {
  const state = await startSettling(page);
  try {
    await state.evaluate((state) => state.promise);
  } finally {
    await state.dispose();
  }
}

export function deckDriver(page: Page) {
  return {
    async goto(slide: number, click = 0) {
      await page.goto(`/#/${slide}${click ? `?clicks=${click}` : ""}`);
      const active = page.locator("[data-deck-active]");
      await expect(active).toHaveAttribute("data-deck-slide", String(slide));
      await settled(page);
    },
    press: (key: string) => page.keyboard.press(key),
    settled: () => settled(page),
  };
}
