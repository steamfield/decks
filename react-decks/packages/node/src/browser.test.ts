import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { runCommand } from "citty";
import { describe, expect, it, onTestFinished } from "vitest";
import { launchBrowser, MissingChromiumError, openBuiltDeck } from "./browser";
import { exportDeck } from "./commands/export";
import { shot } from "./commands/shot";
import { cli, fixture } from "./deck.test-support";
import { build, dev, loadDeck, scanSlides } from "./index";

async function output() {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/capture-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

async function cliWithNoBrowser(args: string[]) {
  const dir = await output();
  const child = spawn(
    process.execPath,
    ["--import", "tsx", resolve("packages/node/src/cli.ts"), ...args],
    {
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: dir, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (data) => {
    stdout += String(data);
  });
  child.stderr.on("data", (data) => {
    stderr += String(data);
  });
  const completion = new Promise<number | null>((done, reject) => {
    child.on("error", reject);
    child.on("close", done);
  });
  onTestFinished(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill();
    await completion;
  });
  const code = await completion;
  return { code, stdout, stderr };
}

describe("browser captures", async () => {
  let unavailable = "";
  try {
    const browser = await launchBrowser();
    await browser.close();
  } catch (cause) {
    if (!(cause instanceof MissingChromiumError)) throw cause;
    unavailable = cause.message;
  }
  const browserTest = it.skipIf(Boolean(unavailable));
  if (unavailable) console.warn(`Browser integration tests skipped: ${unavailable}`);

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
      expect(await reference.page.getByText("Second point", { exact: true }).count()).toBe(1);
      expect(await reference.page.getByText("Third point", { exact: true }).count()).toBe(0);
      expect(await reference.page.screenshot()).toEqual(png);
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
      expect(await capture.page.locator("[data-deck-slide]").count()).toBe(9);
      expect(
        await capture.page
          .getByRole("heading", { name: "This slide is hidden and never numbered." })
          .count(),
      ).toBe(0);
      expect(await capture.page.getByText("Welcome everyone. This is the cover.").count()).toBe(0);
      await capture.page.setViewportSize({ width: 1120, height: 630 });
      await capture.page.goto(new URL("?motion=instant#/1", capture.page.url()).href);
      await capture.page.waitForFunction("window.__deck !== undefined");
      await capture.page.evaluate("window.__deck.settled()");
      expect(
        await capture.page
          .getByRole("heading", { name: "Basic fixture deck", exact: true })
          .count(),
      ).toBe(1);
      const cover = await capture.page.screenshot();
      const reference = await browser.newPage({ viewport: { width: 1200, height: 630 } });
      await reference.setContent(
        `<body style="margin:0;background:rgb(11,13,18)"><img style="margin-left:40px;width:1120px;height:630px;display:block" src="data:image/png;base64,${cover.toString("base64")}"></body>`,
      );
      expect(await reference.screenshot()).toEqual(png);
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
    await expect(build(await loadDeck(dir), { outDir: join(dir, "site") })).rejects.toThrow(
      /Cannot capture[\s\S]*Broken capture frame/,
    );
  });
});

it("export and shot explain how to install Chromium and exit 1 without downloading it", async () => {
  for (const args of [
    ["export", "examples/basic"],
    ["shot", "examples/basic", "1"],
  ]) {
    const result = await cliWithNoBrowser(args);
    expect(result.code).toBe(1);
    expect(result.stderr).toContain("npx playwright install chromium");
    expect(result.stderr).not.toContain("This is a bug");
  }
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

it("shot rejects a missing slide and a click past its final state", async () => {
  for (const [slide, click, error] of [
    ["99", "0", "Unknown slide 99"],
    ["1", "1", "Slide 1 has 0 clicks"],
  ] as const) {
    const command = cli(process.cwd(), ["shot", "examples/basic", slide, click]);
    const [code] = await command.exit;
    expect(code).toBe(1);
    expect(command.output().stderr).toContain(error);
  }
});

it("capture commands reject unknown options instead of silently writing a file", async () => {
  for (const args of [
    ["shot", "examples/basic", "1"],
    ["export", "examples/basic"],
  ]) {
    const command = cli(process.cwd(), [...args, "--bogus"]);
    const [code] = await command.exit;
    expect(code).toBe(1);
    expect(command.output().stderr).toContain("Unknown option '--bogus'");
    expect(command.output().stderr).not.toContain("This is a bug");
  }
});
