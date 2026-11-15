// @vitest-environment node
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { type Browser, chromium } from "@playwright/test";
import { type DevServer, dev, loadDeck } from "@steamfield/decks/node";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { faviconSvg, ico, MARK, markColors, markColorsDark, markPng, markSvg } from "./brand";
import { productTheme } from "./tokens";

// The repo root's node_modules, found from this file so the test runs from any directory.
const repoNodeModules = fileURLToPath(new URL("../../../node_modules", import.meta.url));

describe("brand mark", () => {
  it("takes its colors from the product theme's cyan and violet ramps", () => {
    const { ramps } = productTheme();
    expect(markColors()).toEqual({ front: ramps.cyan[1], back: ramps.violet[1] });
    expect(markColorsDark()).toEqual({ front: ramps.cyan[2], back: ramps.violet[2] });
    const favicon = faviconSvg();
    for (const color of [ramps.cyan[1], ramps.violet[1], ramps.cyan[2], ramps.violet[2]]) {
      expect(favicon).toContain(color);
    }
    expect(favicon).toContain("prefers-color-scheme:dark");
  });

  it("draws without masks or ids, so it can repeat on a page", () => {
    expect(markSvg(markColors())).not.toMatch(/\bid=|mask/);
  });

  it("renders PNGs at the requested size, framed on the canvas when asked", async () => {
    const plain = await sharp(await markPng(32)).metadata();
    expect([plain.width, plain.height, plain.hasAlpha]).toEqual([32, 32, true]);
    const framed = await markPng(180, { framed: true });
    const corner = await sharp(framed)
      .extract({ left: 0, top: 0, width: 1, height: 1 })
      .raw()
      .toBuffer();
    expect(`#${corner.subarray(0, 3).toString("hex")}`).toBe(productTheme().surfaces.canvas);
  });

  it("packs PNGs into an ICO directory", async () => {
    const images = await Promise.all(
      [16, 32].map(async (size) => ({ size, png: await markPng(size) })),
    );
    const file = ico(images);
    expect([file.readUInt16LE(2), file.readUInt16LE(4)]).toEqual([1, 2]);
    expect([file.readUInt8(6), file.readUInt8(22)]).toEqual([16, 32]);
    const second = file.readUInt32LE(22 + 12);
    expect(file.subarray(second + 1, second + 4).toString()).toBe("PNG");
    expect(second + file.readUInt32LE(22 + 8)).toBe(file.length);
  });
});

describe("the framework's visible mark", () => {
  it("uses the site's geometry in its credit and default icon", async () => {
    const dir = mkdtempSync(join(tmpdir(), "decks-site-mark-"));
    let server: DevServer | undefined;
    let browser: Browser | undefined;
    try {
      mkdirSync(join(dir, "slides"));
      symlinkSync(repoNodeModules, join(dir, "node_modules"), "dir");
      writeFileSync(join(dir, "deck.config.ts"), 'export default { title: "Brand mark" };');
      writeFileSync(join(dir, "slides/01-cover.mdx"), "# Brand mark.\n");
      server = await dev(await loadDeck(dir), { port: 0 });
      browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(server.url);
      const credit = page.getByRole("link", { name: "Created with Decks" });
      await credit.waitFor({ state: "visible" });
      const artwork = await credit.locator("svg").evaluate((svg) => ({
        viewBox: svg.getAttribute("viewBox"),
        back: svg.querySelector("path")?.getAttribute("d"),
        front: Object.fromEntries(
          [...(svg.querySelector("rect")?.attributes ?? [])].map(({ name, value }) => [
            name,
            Number(value),
          ]),
        ),
      }));
      expect(artwork).toEqual({ viewBox: "0 0 32 32", back: MARK.back, front: MARK.front });
      const icon = await page.locator('link[rel="icon"]').getAttribute("href");
      expect(decodeURIComponent(icon?.split(",")[1] ?? "")).toBe(markSvg(markColors()));
    } finally {
      await browser?.close();
      await server?.close();
      rmSync(dir, { recursive: true, force: true });
    }
    // Cold-starts a Vite dev server and Chromium, as tests/build.test.ts does for its own builds.
  }, 180_000);
});
