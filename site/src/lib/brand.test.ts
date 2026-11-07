// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { faviconSvg, ico, MARK, markColors, markColorsDark, markPng, markSvg } from "./brand";
import { productTheme } from "./tokens";

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

// The addon draws the same mark without importing this module (a cross-package
// import is listed as debt in AGENTS.md), so these compare the copies instead.
describe("the addon's copies of the mark", () => {
  const addon = (path: string) =>
    readFileSync(join(process.cwd(), "..", "packages/decks", path), "utf8");

  it("DecksCredit.vue uses the same geometry", () => {
    const credit = addon("components/DecksCredit.vue");
    expect(credit).toMatch(/<svg class="mark" viewBox="0 0 32 32"/);
    expect(credit.match(/class="back"\s+d="([^"]+)"/)?.[1]).toBe(MARK.back);
    const rect = credit.match(/<rect class="front"([^>]*)\/>/)?.[1] ?? "";
    const attrs = Object.fromEntries(
      [...rect.matchAll(/(\w+)="([^"]*)"/g)].map(([, name, value]) => [name, Number(value)]),
    );
    expect(attrs).toEqual(MARK.front);
  });

  it("the shipped favicon is the site's favicon", () => {
    expect(addon("public/favicon.svg").trim()).toBe(faviconSvg());
  });
});
