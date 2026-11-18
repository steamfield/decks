import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { runCommand } from "citty";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import { cliProcess } from "../cli/cli-process.test-support";
import { exportDeck } from "../cli/commands/export";
import { shot } from "../cli/commands/shot";
import { build, dev, loadDeck, scanSlides } from "../index";
import { launchBrowser, openBuiltDeck } from "./browser";
import { bugNotice } from "./errors";
import { cli, fixture, repoPath, skipBrowserTests } from "./server.test-support";

const basic = repoPath("examples/basic");

async function output() {
  await mkdir(repoPath(".tmp"), { recursive: true });
  const dir = await mkdtemp(repoPath(".tmp/capture-"));
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
      repoPath("packages/node/src/cli/cli.ts"),
      ...args,
    ],
    { env: { ...globalThis.process.env, PLAYWRIGHT_BROWSERS_PATH: dir, NO_COLOR: "1" } },
  );
  onTestFinished(process.close);
  const [code] = await process.exit;
  return { code, ...process.output() };
}

/** The fixture's own headings and steps keep these captures independent of any example deck. */
const stepsSlides = {
  "slides/01-first.mdx": "# Cover heading\n\n<Notes>Cover speaker note.</Notes>",
  "slides/02-steps.mdx": [
    "<Step at={1}>First point</Step>",
    "<Step at={2}>Second point</Step>",
    "<Step at={3}>Third point</Step>",
  ].join("\n\n"),
  "slides/03-hidden.mdx": "---\nhide: true\n---\n# Hidden slide heading",
};

// Load, hydration and paint take longer than vi.waitFor's default 1s on a loaded runner.
const eventually = (assertion: () => Promise<void>) => vi.waitFor(assertion, { timeout: 30_000 });

function expectSameFrame(actual: Buffer, expected: Buffer) {
  const a = PNG.sync.read(actual);
  const b = PNG.sync.read(expected);
  expect([a.width, a.height]).toEqual([b.width, b.height]);
  // Two captures from one Chromium on one machine; tolerates antialiasing, not a layout change.
  expect(
    pixelmatch(a.data, b.data, undefined, a.width, a.height, { threshold: 0.1 }) /
      (a.width * a.height),
  ).toBeLessThan(0.002);
}

describe.skipIf(skipBrowserTests)("browser captures", () => {
  const browserTest = it;

  browserTest.each([false, true])(
    "exports the basic deck's PDF frames with final=%s",
    async (final) => {
      const dir = await output();
      const deck = await loadDeck(basic);
      const slides = await scanSlides(deck);
      const path = join(dir, final ? "final.pdf" : "all.pdf");
      await runCommand(exportDeck, {
        rawArgs: [basic, "--out", path, ...(final ? ["--final"] : [])],
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
      const { dir: deckDir } = await fixture(onTestFinished, stepsSlides);
      await cp(repoPath("examples/motion"), join(dir, "other"), {
        recursive: true,
        filter: (file) => !file.includes("/.vite"),
      });
      const other = await dev(await loadDeck(join(dir, "other")), { port: 0 });
      onTestFinished(() => other.close());
      const path = join(dir, `${width}.png`);
      await runCommand(shot, { rawArgs: [deckDir, "2", "2", "--out", path, ...flags] });
      const png = await readFile(path);
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([width, height]);
      const outDir = join(dir, "reference");
      await build(await loadDeck(deckDir), { outDir });
      const browser = await launchBrowser();
      onTestFinished(() => browser.close());
      const reference = await openBuiltDeck(browser, outDir, "./", "?motion=instant#/2?clicks=2", {
        width,
        height,
      });
      onTestFinished(reference.close);
      await eventually(async () =>
        expect(await reference.page.getByText("Second point", { exact: true }).isVisible()).toBe(
          true,
        ),
      );
      await eventually(async () =>
        expect(await reference.page.getByText("Third point", { exact: true }).isVisible()).toBe(
          false,
        ),
      );
      // The shot must look like the deck does in the same Chromium on this machine.
      expectSameFrame(png, await reference.page.screenshot());
    },
  );

  browserTest(
    "builds a letterboxed first-slide preview and adds absolute share metadata",
    async () => {
      const dir = await output();
      const { dir: deckDir } = await fixture(onTestFinished, stepsSlides);
      const deck = await loadDeck(deckDir);
      const visibleFrames = (await scanSlides(deck)).reduce(
        (total, { meta }) => total + meta.clicks + 1,
        0,
      );
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
      await eventually(async () =>
        expect(await capture.page.locator("[data-deck-slide]").count()).toBe(visibleFrames),
      );
      await eventually(async () =>
        expect(
          await capture.page.getByRole("heading", { name: "Hidden slide heading" }).count(),
        ).toBe(0),
      );
      await eventually(async () =>
        expect(await capture.page.getByText("Cover speaker note.").count()).toBe(0),
      );
      await capture.page.setViewportSize({ width: 1120, height: 630 });
      await capture.page.goto(new URL("?motion=instant#/1", capture.page.url()).href);
      await eventually(async () =>
        expect(
          await capture.page.getByRole("heading", { name: "Cover heading", exact: true }).count(),
        ).toBe(1),
      );
      // The 1200 x 630 preview letterboxes the 16:9 slide; its middle 1120 columns are the
      // slide as this Chromium renders it at 1120 x 630.
      const preview = PNG.sync.read(png);
      const slide = new PNG({ width: 1120, height: 630 });
      PNG.bitblt(preview, slide, 40, 0, 1120, 630, 0, 0);
      expectSameFrame(PNG.sync.write(slide), await capture.page.screenshot());
    },
  );

  browserTest("leaves a supplied public og.png unchanged", async () => {
    const dir = await output();
    await cp(repoPath("examples/basic"), join(dir, "deck"), {
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
      await build(await loadDeck(basic), {
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
  ["export", basic],
  ["shot", basic, "1"],
])("%s explains how to install Chromium and exits 1 without downloading it", async (...args) => {
  const result = await cliWithNoBrowser(args);
  expect(result.code).toBe(1);
  expect(result.stderr).toContain("npx playwright install chromium");
  expect(result.stderr).not.toContain(bugNotice);
});

it("build without Chromium succeeds with one warning and no generated image", async () => {
  const dir = await output();
  const outDir = join(dir, "site");
  const result = await cliWithNoBrowser(["build", basic, "--out", outDir]);
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
  const { dir } = await fixture(onTestFinished);
  const command = cli(dir, ["shot", ".", slide, click]);
  const [code] = await command.exit;
  expect(code).toBe(1);
  expect(command.output().stderr).toContain(error);
});

it.each([
  ["shot", ".", "1"],
  ["export", "."],
])("%s rejects unknown options instead of silently writing a file", async (...args) => {
  const { dir } = await fixture(onTestFinished);
  const command = cli(dir, [...args, "--bogus"]);
  const [code] = await command.exit;
  expect(code).toBe(1);
  expect(command.output().stderr).toContain("Unknown option '--bogus'");
  expect(command.output().stderr).not.toContain(bugNotice);
});
