import { expect, type Locator } from "@playwright/test";
import { test } from "./fixtures/deck.fixture";
import { kitFixture, settled } from "./fixtures/kit.fixture";

async function expectMarkFits(word: Locator) {
  const mark = word.locator("svg");
  await expect(mark).toBeVisible();
  await expect(mark.locator("path").first()).toHaveAttribute("d", /^M/);
  const width = await word.evaluate((el) => {
    if (!(el instanceof HTMLElement)) throw new Error("Underlined word is not an HTML element");
    return el.offsetWidth;
  });
  await expect(mark).toHaveAttribute("width", String(width));
  await expect
    .poll(async () => {
      const textBox = await word.boundingBox();
      const markBox = await mark.boundingBox();
      if (!textBox || !markBox) throw new Error("Missing visible underlined word or mark");
      return Math.abs(textBox.width - markBox.width);
    })
    .toBeLessThanOrEqual(1);
}

for (const style of ["clean", "marker"]) {
  test(`The ${style} underline follows its word after font loading and frame resizing`, async ({
    page,
    deckServer,
  }) => {
    const fonts = Promise.withResolvers<void>();
    const server = await kitFixture(deckServer, {
      "setup.ts": `import { installTheme, resolveTheme, STORY_STYLE } from "@steamfield/decks/kit";
installTheme(resolveTheme()); STORY_STYLE.ink = "${style}";`,
      "slides/01-underline.mdx": "<UnderlineProbe />",
      "components/UnderlineProbe.tsx": `import { StoryStage, Underline } from "@steamfield/decks/kit";
export function UnderlineProbe() {
  return <StoryStage overlay={<p style={{ position: "absolute", left: "10%", top: "30%", fontFamily: "Inter, monospace", fontSize: "calc(3 * var(--sw))" }}><Underline>WWWiii last</Underline></p>} />;
}`,
    });
    try {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.route("**/*.woff2*", async (route) => {
        await fonts.promise;
        await route.continue();
      });
      const fontRequested = page.waitForRequest((request) => request.url().includes(".woff2"));
      await page.goto(`${server.url}?motion=instant`, { waitUntil: "domcontentloaded" });
      await fontRequested;
      const word = page.getByText("WWWiii last", { exact: true });
      await expectMarkFits(word);
      const fallback = await word.boundingBox();
      if (!fallback) throw new Error("Missing word in its fallback font");
      fonts.resolve();
      await settled(page);
      await expect.poll(async () => (await word.boundingBox())?.width).not.toBe(fallback.width);
      await expectMarkFits(word);
      const fullWidth = await word.boundingBox();
      if (!fullWidth) throw new Error("Missing word after its font loaded");
      await page.setViewportSize({ width: 1280, height: 720 });
      await settled(page);
      await expectMarkFits(word);
      await expect
        .poll(async () => (await word.boundingBox())?.width)
        .toBeCloseTo((fullWidth.width * 2) / 3, 0);
    } finally {
      fonts.resolve();
      await server.close();
    }
  });
}
