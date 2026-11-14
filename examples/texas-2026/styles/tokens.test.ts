// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { expect as browserExpect, chromium } from "@playwright/test";
import { createDeckStore, Deck, type DeckSource } from "@steamfield/decks";
import { InkNumber, installTheme, resolveTheme } from "@steamfield/decks/kit";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { expect, it } from "vitest";
import deckTheme from "../theme.json";

const css = (file: string) =>
  readFileSync(new URL(file, import.meta.url), "utf8").replace(/^@import[^;]+;/gm, "");

it("resizes an InkNumber when the deck figure-size token changes", async () => {
  installTheme(resolveTheme(deckTheme));
  window.history.replaceState(null, "", "/?motion=instant#/1");
  const source: DeckSource = {
    manifest: {
      name: "texas-tokens",
      title: "Texas tokens",
      canvas: { width: 1920, height: 1080 },
      slides: [{ no: 1, id: "figure", file: "figure.mdx", title: "Figure", clicks: 0 }],
    },
    slides: {
      figure: async () => ({
        default: () => createElement(InkNumber, { value: "120", count: false }),
      }),
    },
    frontmatter: {},
    components: {},
    layers: { credit: false },
  };
  const store = createDeckStore(source.manifest);
  const view = render(createElement(Deck, { source, store }));
  try {
    const number = await screen.findByText("120");
    const markup = number.parentElement?.outerHTML;
    if (!markup) throw new Error("InkNumber 120 has no rendered parent");
    const browser = await chromium.launch();
    try {
      const page = await browser.newPage();
      await page.setContent(`<style>${css("./tokens.css")}\n${css("./index.css")}</style>
        <div class="od-slide is-story" style="--sw:19.2px;--sh:10.8px">${markup}</div>`);
      const figure = page.getByText("120", { exact: true });
      await page.locator(".od-slide").evaluate((el) => {
        el.style.setProperty("--tx-figure-size", "120px");
      });
      await browserExpect(figure).toHaveCSS("font-size", "120px");
      const before = await figure.boundingBox();
      await page.locator(".od-slide").evaluate((el) => {
        el.style.setProperty("--tx-figure-size", "240px");
      });
      await browserExpect(figure).toHaveCSS("font-size", "240px");
      const after = await figure.boundingBox();
      if (!before || !after) throw new Error("InkNumber 120 has no browser bounds");
      expect(after.height).toBeGreaterThan(before.height);
    } finally {
      await browser.close();
    }
  } finally {
    view.unmount();
    store.destroy();
    window.history.replaceState(null, "", "/");
  }
});
