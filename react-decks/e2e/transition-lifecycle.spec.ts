import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { test } from "./fixtures/deck.fixture";

declare global {
  interface Window {
    releaseLifecycleSnapshot?: () => void;
  }
}

test("Destroying a deck cancels its pending transition before a replacement deck navigates", async ({
  page,
  editableDeck,
}) => {
  await writeFile(
    join(editableDeck.dir, "lifecycle.html"),
    '<html><head><link rel="icon" href="data:," /></head><body><div id="deck-root"></div><script type="module" src="/lifecycle.tsx"></script></body></html>',
  );
  await writeFile(
    join(editableDeck.dir, "lifecycle.tsx"),
    `
import { createElement } from "react";
import { mountDeck, type DeckSource } from "@react-decks/runtime";
const source: DeckSource = {
  manifest: { name: "lifecycle", title: "Lifecycle", canvas: { width: 1920, height: 1080 },
    slides: [1, 2].map(no => ({ no, id: String(no), file: String(no) + ".mdx", title: "Lifecycle " + no, clicks: 0 })) },
  slides: Object.fromEntries([1, 2].map(no => [String(no), async () => ({ default: () => createElement("h1", null, "Lifecycle " + no) })])),
  frontmatter: {}, components: {},
};
let unmount = mountDeck(source);
window.addEventListener("replace-deck", () => {
  unmount();
  history.replaceState(null, "", location.pathname + "#/1");
  unmount = mountDeck(source);
});
`,
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`${editableDeck.url}lifecycle.html#/1`);
  await expect(page.getByRole("heading", { name: "Lifecycle 1" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lifecycle 2", includeHidden: true })).toHaveCount(
    1,
  );
  await page.evaluate(() => window.__deck?.settled());
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document);
    let first = true;
    document.startViewTransition = (update) => {
      const hold = first;
      first = false;
      return start(async () => {
        if (hold)
          await new Promise<void>((resolve) => {
            window.releaseLifecycleSnapshot = resolve;
          });
        if (typeof update === "function") await update();
      });
    };
  });
  await page.keyboard.press("ArrowRight");
  await page.evaluate(() => window.dispatchEvent(new Event("replace-deck")));
  await expect(page.getByRole("heading", { name: "Lifecycle 1" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/2$/);
  await page.waitForFunction(() => typeof window.releaseLifecycleSnapshot === "function");
  await page.evaluate(() => window.releaseLifecycleSnapshot?.());
  await page.evaluate(() => window.__deck?.settled());
  await expect(page.getByRole("heading", { name: "Lifecycle 2" })).toBeVisible();
  expect(errors).toEqual([]);
});
