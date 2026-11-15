import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { runCommand } from "citty";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { cliProcess } from "../cli/cli-process.test-support";
import { exportDeck } from "../cli/commands/export";
import { shot } from "../cli/commands/shot";
import { build, dev, loadDeck, scanSlides } from "../index";
import { launchBrowser, openBuiltDeck } from "./browser";
import { cli, fixture } from "./server.test-support";

async function output() {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/capture-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

async function cliWithNoBrowser(args: string[]) {
  const dir = await output();
  const process = cliProcess(
    globalThis.process.execPath,
    [
      "--conditions=@steamfield/decks/source",
      "--import",
      "tsx",
      resolve("packages/node/src/cli/cli.ts"),
      ...args,
    ],
    { env: { ...globalThis.process.env, PLAYWRIGHT_BROWSERS_PATH: dir, NO_COLOR: "1" } },
  );
  onTestFinished(process.close);
  const [code] = await process.exit;
  return { code, ...process.output() };
}

function expectSameFrame(actual: Buffer, expected: Buffer) {
  const a = PNG.sync.read(actual);
  const b = PNG.sync.read(expected);
  expect([a.width, a.height]).toEqual([b.width, b.height]);
  // Separate Chromium renders can rasterize text edges differently.
  expect(
    pixelmatch(a.data, b.data, undefined, a.width, a.height, { threshold: 0.1 }) /
      (a.width * a.height),
  ).toBeLessThan(0.002);
}

describe.skipIf(process.env.DECKS_SKIP_BROWSER_TESTS === "1")("browser captures", () => {
  const browserTest = it;

  browserTest.each([false, true])(
    "exports the basic deck's PDF frames with final=%s",
    async (final) => {
      const dir = await output();
      const deck = await loadDeck("examples/basic");
      const slides = await scanSlides(deck);
      const path = join(dir, final ? "final.pdf" : "all.pdf");
      await runCommand(exportDeck, {
        rawArgs: ["examples/basic", "--out", path, ...(final ? ["--final"] : [])],
      });
      const pdf = await readFile(path, "latin1");
      expect(pdf.startsWith("%PDF-")).toBe(true);
      expect(pdf.match(/\/Type\s*\/Page\b/g)).toHaveLength(
        final ? slides.length : slides.reduce((total, { meta }) => total + meta.clicks + 1, 0),
      );
    },
  );

  browserTest.each([
    { width: 1920, height: 1080, flags: [] },
    { width: 960, height: 540, flags: ["--width", "960", "--height", "540"] },
  ])(
    "shots the requested frame at $width x $height on its own server",
    async ({ width, height, flags }) => {
      const dir = await output();
      await cp(resolve("examples/motion"), join(dir, "other"), {
        recursive: true,
        filter: (file) => !file.includes("/.vite"),
      });
      const other = await dev(await loadDeck(join(dir, "other")), { port: 0 });
      onTestFinished(() => other.close());
      const path = join(dir, `${width}.png`);
      await runCommand(shot, { rawArgs: ["examples/basic", "2", "2", "--out", path, ...flags] });
      const png = await readFile(path);
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([width, height]);
      const outDir = join(dir, "reference");
      await build(await loadDeck("examples/basic"), { outDir });
      const browser = await launchBrowser();
      onTestFinished(() => browser.close());
      const reference = await openBuiltDeck(browser, outDir, "./", "?motion=instant#/2?clicks=2", {
        width,
        height,
      });
      onTestFinished(reference.close);
      await vi.waitFor(async () =>
        expect(await reference.page.getByText("Second point", { exact: true }).count()).toBe(1),
      );
      await vi.waitFor(async () =>
        expect(await reference.page.getByText("Third point", { exact: true }).count()).toBe(0),
      );
      expectSameFrame(
        png,
        await readFile(resolve(`tests/fixtures/browser/slide-2-click-2-${width}.png`)),
      );
    },
  );

  browserTest(
    "builds a letterboxed first-slide preview and adds absolute share metadata",
    async () => {
      const dir = await output();
      const deck = await loadDeck("examples/basic");
      const outDir = join(dir, "site");
      await build(
        { ...deck, config: { ...deck.config, info: "summary", url: "https://example.com/talk/" } },
        { outDir, base: "/talk/" },
      );
      const png = await readFile(join(outDir, "og.png"));
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
      const html = await readFile(join(outDir, "index.html"), "utf8");
      expect(html).toContain('property="og:image" content="https://example.com/talk/og.png"');
      expect(html).toContain('name="twitter:card" content="summary_large_image"');
      expect(html).toContain('name="description" content="summary"');
      const browser = await launchBrowser();
      onTestFinished(() => browser.close());
      const capture = await openBuiltDeck(browser, outDir, "/talk/", "#/print");
      onTestFinished(capture.close);
      await vi.waitFor(async () =>
        expect(await capture.page.locator("[data-deck-slide]").count()).toBe(9),
      );
      await vi.waitFor(async () =>
        expect(
          await capture.page
            .getByRole("heading", { name: "This slide is hidden and never numbered." })
            .count(),
        ).toBe(0),
      );
      await vi.waitFor(async () =>
        expect(await capture.page.getByText("Welcome everyone. This is the cover.").count()).toBe(
          0,
        ),
      );
      await capture.page.setViewportSize({ width: 1120, height: 630 });
      await capture.page.goto(new URL("?motion=instant#/1", capture.page.url()).href);
      await vi.waitFor(async () =>
        expect(
          await capture.page
            .getByRole("heading", { name: "Basic fixture deck", exact: true })
            .count(),
        ).toBe(1),
      );
      expectSameFrame(png, await readFile(resolve("tests/fixtures/browser/og.png")));
    },
  );

  browserTest("leaves a supplied public og.png unchanged", async () => {
    const dir = await output();
    await cp(resolve("examples/basic"), join(dir, "deck"), {
      recursive: true,
      filter: (file) => !file.includes("/.vite/"),
    });
    const image = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1sAAAAASUVORK5CYII=",
      "base64",
    );
    await mkdir(join(dir, "deck/public"), { recursive: true });
    await writeFile(join(dir, "deck/public/og.png"), image);
    const outDir = join(dir, "site");
    await build(await loadDeck(join(dir, "deck")), { outDir });
    expect(await readFile(join(outDir, "og.png"))).toEqual(image);
  });

  browserTest(
    "builds a preview locally when the production assets have an absolute CDN base",
    async () => {
      const dir = await output();
      await build(await loadDeck("examples/basic"), {
        outDir: dir,
        base: "https://cdn.example.invalid/talk/",
      });
      expect(existsSync(join(dir, "og.png"))).toBe(true);
      expect(await readFile(join(dir, "index.html"), "utf8")).toContain(
        'src="https://cdn.example.invalid/talk/assets/',
      );
    },
  );

  browserTest("fails capture when a slide's error boundary displays a render error", async () => {
    const { dir } = await fixture(onTestFinished, {
      "slides/01-first.mdx": '{(() => { throw new Error("Broken capture frame"); })()}',
    });
    const outDir = join(dir, "site");
    await build(await loadDeck(dir), { outDir, ogImage: false });
    const browser = await launchBrowser();
    onTestFinished(() => browser.close());
    await expect(openBuiltDeck(browser, outDir, "./", "#/1")).rejects.toThrow(
      /Cannot capture[\s\S]*Broken capture frame/,
    );
  });
});

it.each([
  ["export", "examples/basic"],
  ["shot", "examples/basic", "1"],
])("%s explains how to install Chromium and exits 1 without downloading it", async (...args) => {
  const result = await cliWithNoBrowser(args);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("npx playwright install chromium");
  expect(result.stderr).not.toContain("This is a bug");
});

it("build without Chromium succeeds with one warning and no generated image", async () => {
  const dir = await output();
  const outDir = join(dir, "site");
  const result = await cliWithNoBrowser(["build", "examples/basic", "--out", outDir]);
  expect(result.code).toBe(0);
  expect(result.stderr.trim().split("\n")).toEqual([
    "decks build: og.png skipped. Chromium is not installed. Run npx playwright install chromium.",
  ]);
  expect(existsSync(join(outDir, "og.png"))).toBe(false);
  expect(existsSync(join(outDir, "index.html"))).toBe(true);
});

it.each([
  ["99", "0", "Unknown slide 99"],
  ["1", "1", "Slide 1 has 0 clicks"],
])("shot rejects slide %s click %s", async (slide, click, error) => {
  const command = cli(process.cwd(), ["shot", "examples/basic", slide, click]);
  const [code] = await command.exit;
  expect(code).toBe(1);
  expect(command.output().stderr).toContain(error);
});

it.each([
  ["shot", "examples/basic", "1"],
  ["export", "examples/basic"],
])("%s rejects unknown options instead of silently writing a file", async (...args) => {
  const command = cli(process.cwd(), [...args, "--bogus"]);
  const [code] = await command.exit;
  expect(code).toBe(1);
  expect(command.output().stderr).toContain("Unknown option '--bogus'");
  expect(command.output().stderr).not.toContain("This is a bug");
});
