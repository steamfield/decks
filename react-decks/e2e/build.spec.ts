import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { resolve } from "node:path";
import { expect } from "@playwright/test";
import { build, loadDeck } from "@react-decks/node";
import { preview } from "vite";
import { test } from "./fixtures/deck.fixture";

test("A built deck served under a base path loads and walks to slide two.", async ({ page }) => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const outDir = await mkdtemp(resolve(".tmp/e2e-build-"));
  try {
    await build(await loadDeck(resolve("examples/basic")), { outDir, base: "/talk/" });
    const server = await preview({
      configFile: false,
      base: "/talk/",
      build: { outDir },
      preview: { port: 0, open: false },
    });
    try {
      const url = server.resolvedUrls?.local[0];
      if (!url) throw new Error("Vite preview did not provide a local URL");
      await page.goto(url);
      await expect(
        page.getByRole("heading", { name: "Basic fixture deck", exact: true }),
      ).toBeVisible();
      await expect(page).toHaveURL(`${url}#/1`);
      await page.keyboard.press("ArrowRight");
      await expect(page.getByRole("heading", { name: "Three steps", exact: true })).toBeVisible();
      await expect(page).toHaveURL(`${url}#/2`);
    } finally {
      await server.close();
    }
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});
