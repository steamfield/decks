// @vitest-environment node
import { join } from "node:path";
import satori from "satori";
import { describe, expect, it } from "vitest";
import { clip, ogCard, ogFonts, stillDataUrl } from "./og";
import { landingTokens } from "./tokens";

describe("social cards", () => {
  it("clips long text on a word boundary", () => {
    expect(clip("short", 10)).toBe("short");
    expect(clip("one two three four", 12)).toBe("one two…");
  });

  it("renders the title over a real slide still in the product's colors", async () => {
    const still = await stillDataUrl(join(process.cwd(), "public/posters/tides-1280.webp"));
    expect(still.startsWith("data:image/png;base64,")).toBe(true);
    const card = ogCard(
      { title: "Installation", description: "Install it.", siteName: "Acme" },
      still,
    );
    const svg = await satori(card as never, { width: 1200, height: 630, fonts: await ogFonts() });
    expect(svg).toMatch(/^<svg[^>]+width="1200"[^>]+height="630"/);
    expect(svg).toContain("<path");
    expect(svg).toContain("<image");
    expect(svg).toContain(landingTokens().canvas);
  });

  it("renders without a still", async () => {
    const card = ogCard({ title: "T", description: "D", siteName: "S" }, null);
    const svg = await satori(card as never, { width: 1200, height: 630, fonts: await ogFonts() });
    expect(svg).not.toContain("<image");
  });
});
