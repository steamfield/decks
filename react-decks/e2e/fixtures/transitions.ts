import { expect, type Page } from "@playwright/test";
import { loadDeck, scanSlides } from "@steamfield/decks/node";
import { test as motionTest } from "./motion.fixture";

const gallery = await scanSlides(await loadDeck("examples/motion"));
const gallerySize = gallery.length;
const finalSlide = gallery.at(-1)?.meta;
if (!finalSlide) throw new Error("The motion gallery has no slides");
export const lastSlide = finalSlide;

declare global {
  interface Window {
    e2eTransition?: ViewTransition;
    e2eTransitionNames: string[];
    e2eTransitionAttributes: string[];
    e2eNavAttributes: string[];
  }
}

export async function settle(page: Page) {
  await page.evaluate(() => {
    if (!window.__deck) throw new Error("Missing deck settle API");
    return window.__deck.settled();
  });
}

export async function open(page: Page, slide = 17, search = "") {
  await page.goto(`/${search}#/${slide}`);
  await expect(page.locator("[data-deck-active]")).toHaveAttribute(
    "data-deck-slide",
    String(slide),
  );
  await page.waitForFunction(
    (count) =>
      performance
        .getEntriesByType("resource")
        .filter((entry) => /\/slides\/.*\.mdx$/.test(new URL(entry.name).pathname)).length ===
      count,
    gallerySize,
  );
  await page.evaluate(async () => {
    await Promise.all(
      performance
        .getEntriesByType("resource")
        .filter((entry) => /\/slides\/.*\.mdx$/.test(new URL(entry.name).pathname))
        .map((entry) => import(new URL(entry.name).pathname)),
    );
  });
  await settle(page);
}

export async function keys(page: Page, names: string[]) {
  await page.evaluate((names) => {
    for (const key of names) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key, code: key, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key, code: key, bubbles: true }));
    }
  }, names);
}

export const test = motionTest.extend({
  context: async ({ context }, use) => {
    await context.addInitScript(() => {
      const start = document.startViewTransition.bind(document);
      window.e2eTransitionNames = [];
      window.e2eTransitionAttributes = [];
      window.e2eNavAttributes = [];
      new MutationObserver((records) => {
        const changed = new Set<string>();
        for (const record of records) {
          if (record.target !== document.documentElement) continue;
          const name = record.attributeName;
          if (!name) continue;
          const log =
            name === "data-deck-nav" ? window.e2eNavAttributes : window.e2eTransitionAttributes;
          if (record.oldValue) log.push(record.oldValue);
          changed.add(name);
        }
        for (const name of changed) {
          const log =
            name === "data-deck-nav" ? window.e2eNavAttributes : window.e2eTransitionAttributes;
          const current = document.documentElement.getAttribute(name);
          if (current) log.push(current);
        }
      }).observe(document, {
        subtree: true,
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ["data-deck-transition", "data-deck-nav"],
      });
      document.startViewTransition = (update) => {
        window.e2eTransitionNames.push(
          document.documentElement.getAttribute("data-deck-transition") ?? "missing",
        );
        const transition = start(update);
        window.e2eTransition = transition;
        return transition;
      };
    });
    await use(context);
  },
});
