import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { expect, type Locator } from "@playwright/test";
import { build, loadDeck } from "@react-decks/node";
import { preview } from "vite";
import { test as editableTest } from "./fixtures/deck.fixture";
import { test } from "./fixtures/motion.fixture";

const shapes = [
  { width: 1920, height: 1080 },
  { width: 1024, height: 768 },
  { width: 2560, height: 1080 },
];

async function box(locator: Locator) {
  const result = await locator.boundingBox();
  if (!result) throw new Error("Missing visible box");
  return result;
}

test("Center keeps its content centered at every window shape", async ({ page }) => {
  await page.goto("/?motion=instant#/26");
  const content = page.getByText("Give one idea the room.").locator("..");
  await expect(content).toBeVisible();
  for (const shape of shapes) {
    await page.setViewportSize(shape);
    await expect
      .poll(async () => {
        const bounds = await box(content);
        return Math.max(
          Math.abs(bounds.x + bounds.width / 2 - shape.width / 2),
          Math.abs(bounds.y + bounds.height / 2 - shape.height / 2),
        );
      })
      .toBeLessThan(1);
  }
});

test("TwoCol gives the first column twice the width without overflowing", async ({ page }) => {
  await page.goto("/?motion=instant#/29");
  const layout = page.locator('[data-deck-active] [data-deck-layout="two-col"]');
  await expect(layout).toBeVisible();
  for (const shape of shapes) {
    await page.setViewportSize(shape);
    await expect.poll(async () => (await box(layout)).width).toBeCloseTo(shape.width, 1);
    await expect
      .poll(async () => {
        const first = await box(layout.locator(":scope > div"));
        const second = await box(page.getByRole("complementary"));
        return Math.abs(first.width - 2 * second.width);
      })
      .toBeLessThan(1);
    const first = await box(layout.locator(":scope > div"));
    const second = await box(page.getByRole("complementary"));
    expect(first.x).toBeGreaterThan(0);
    expect(second.x + second.width).toBeLessThan(shape.width);
    expect(Math.max(first.y + first.height, second.y + second.height)).toBeLessThan(shape.height);
  }
});

test("ImageSide runs its right image to three edges and pads the text", async ({ page }) => {
  await page.goto("/?motion=instant#/30");
  const image = page.getByRole("img", {
    name: "Mint paths converge around an amber circle on a dark field",
  });
  await expect(image).toBeVisible();
  for (const shape of shapes) {
    await page.setViewportSize(shape);
    await expect
      .poll(async () => {
        const bounds = await box(image);
        return Math.max(
          Math.abs(bounds.y),
          Math.abs(bounds.x + bounds.width - shape.width),
          Math.abs(bounds.height - shape.height),
        );
      })
      .toBeLessThan(1);
    const heading = await box(
      page.getByRole("heading", { name: "Let the image carry the motion." }),
    );
    const scale = Math.min(shape.width / 1920, shape.height / 1080);
    expect(heading.x).toBeCloseTo(120 * scale, 1);
    expect(heading.y).toBeGreaterThanOrEqual(96 * scale);
    expect(heading.x + heading.width).toBeLessThan((await box(image)).x);
  }
  await mkdir(resolve(".tmp"), { recursive: true });
  const outDir = await mkdtemp(resolve(".tmp/e2e-layout-build-"));
  try {
    await build(await loadDeck("examples/motion"), { outDir, base: "/talk/" });
    const server = await preview({
      configFile: false,
      base: "/talk/",
      build: { outDir },
      preview: { port: 0, open: false },
    });
    try {
      const url = server.resolvedUrls?.local[0];
      if (!url) throw new Error("Missing preview URL");
      await page.goto(`${url}#/30`);
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate(
            (element) => element instanceof HTMLImageElement && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
    } finally {
      await new Promise<void>((done, reject) =>
        server.httpServer.close((error) => (error ? reject(error) : done())),
      );
    }
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});

test("Cover and Section keep their content inside the padding at every window shape", async ({
  page,
}) => {
  for (const [slide, layout] of [
    [27, "cover"],
    [28, "section"],
  ] as const) {
    await page.goto(`/?motion=instant#/${slide}`);
    const content = page.locator(`[data-deck-active] [data-deck-layout="${layout}"]`);
    await expect(content.getByRole("heading")).toBeVisible();
    for (const shape of shapes) {
      await page.setViewportSize(shape);
      await expect.poll(async () => (await box(content)).width).toBeCloseTo(shape.width, 1);
      const scale = Math.min(shape.width / 1920, shape.height / 1080);
      const first = await box(content.locator(":scope > *").first());
      const last = await box(content.locator(":scope > *").last());
      if (layout === "cover")
        expect((first.y + last.y + last.height) / 2).toBeCloseTo(shape.height / 2, 1);
      else expect(last.y + last.height).toBeCloseTo(shape.height - 96 * scale, 1);
      for (const child of await content.locator(":scope > *").all()) {
        const bounds = await box(child);
        expect(bounds.x).toBeCloseTo(120 * scale, 1);
        expect(bounds.y).toBeGreaterThanOrEqual(96 * scale - 1);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(shape.width - 120 * scale + 1);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(shape.height - 96 * scale + 1);
      }
    }
  }
});

editableTest("A deck's Center replaces the framework layout", async ({ page, editableDeck }) => {
  await mkdir(join(editableDeck.dir, "components"), { recursive: true });
  await writeFile(
    join(editableDeck.dir, "components/Center.tsx"),
    "export default function Center() { return <h1>A center of our own.</h1>; }",
  );
  await writeFile(join(editableDeck.dir, "slides/01-cover.mdx"), "<Center />");
  await page.goto(editableDeck.url);
  await expect(page.getByRole("heading", { name: "A center of our own." })).toBeVisible();
  await expect(page.locator('[data-deck-active] [data-deck-layout="center"]')).toHaveCount(0);
});
