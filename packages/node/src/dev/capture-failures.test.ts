import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { build, loadDeck } from "../index";
import { launchBrowser, openBuiltDeck, waitForCapture } from "./browser";
import { DeckError } from "./errors";
import { cli, fixture } from "./server.test-support";

describe.skipIf(process.env.DECKS_SKIP_BROWSER_TESTS === "1")("capture failures", () => {
  it.each(["shot", "export"])("%s does not capture the share image", async (command) => {
    const { dir } = await fixture(onTestFinished, {
      "components/FirstSlide.tsx": `
        import { useEffect } from "react";
        import { useSlide } from "@steamfield/decks";
        export function FirstSlide() {
          const { isActive: active } = useSlide();
          useEffect(() => { if (active) console.error("OG capture must not run"); }, [active]);
          return <h1>First slide</h1>;
        }`,
      "slides/01-first.mdx": "<FirstSlide />",
      "slides/02-second.mdx": "# Requested frame",
    });
    const out = join(dir, command === "shot" ? "frame.png" : "frames.pdf");
    const process = cli(dir, [command, ".", ...(command === "shot" ? ["2"] : []), "--out", out]);
    expect((await process.exit)[0], process.output().stderr).toBe(0);
    expect(process.output().stderr).toBe("");
    expect(existsSync(out)).toBe(true);
  });

  it("builds with one warning when the first slide logs a console error", async () => {
    const { dir } = await fixture(onTestFinished, {
      "slides/01-first.mdx":
        '{(() => { console.error("First slide error\\nwith details"); return "Still rendered"; })()}',
    });
    const process = cli(dir, ["build", ".", "--out", "site"]);
    expect((await process.exit)[0], process.output().stderr).toBe(0);
    const lines = process.output().stderr.trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/decks build: og.png skipped\..*First slide error.*with details/);
    expect(existsSync(join(dir, "site/index.html"))).toBe(true);
    expect(existsSync(join(dir, "site/og.png"))).toBe(false);
  });

  it.each(["#/2?clicks=1", "#/print", "?print=final#/print"])(
    "bounds settling at %s and reports the busy animation's slide and click",
    async (path) => {
      const { dir } = await fixture(onTestFinished, {
        "public/og.png": "Supplied image",
        "slides/02-second.mdx":
          "---\nclicks: 1\n---\n# Long animation\n\n<Step at={1}><h2>Still moving</h2></Step>",
        "styles/index.css": `
          @keyframes capture-long { from { opacity: 0.2; } to { opacity: 1; } }
          h2 { animation: capture-long 3600s linear paused; }
        `,
      });
      const outDir = join(dir, "site");
      await build(await loadDeck(dir), { outDir });
      const browser = await launchBrowser();
      onTestFinished(() => browser.close());
      const capture = await openBuiltDeck(browser, outDir, "./", path);
      onTestFinished(capture.close);
      await capture.page.evaluate(
        "document.getAnimations().forEach(animation => animation.play())",
      );
      await expect(waitForCapture(capture.page, 100)).rejects.toMatchObject({
        name: "DeckError",
        message: expect.stringMatching(
          path.includes("print=final")
            ? /Timed out.*slide print click final.*slide 2: capture-long/
            : path.includes("print")
              ? /Timed out.*slide print click all.*slide 2: capture-long/
              : /Timed out.*slide 2 click 1.*slide 2: capture-long/,
        ),
      });
    },
  );

  it("bounds the initial capture wait for a slide with a long finite animation", async () => {
    const { dir } = await fixture(onTestFinished, {
      "public/og.png": "Supplied image",
      "styles/index.css": `
        @keyframes capture-long { from { opacity: 0.2; } to { opacity: 1; } }
        h1 { animation: capture-long 3600s linear; }
      `,
    });
    const outDir = join(dir, "site");
    await build(await loadDeck(dir), { outDir });
    const browser = await launchBrowser();
    onTestFinished(() => browser.close());
    await expect(openBuiltDeck(browser, outDir, "./", "#/1", undefined, 100)).rejects.toMatchObject(
      {
        name: "DeckError",
        message: expect.stringMatching(/Timed out after 100 ms.*slide 1 click 0/),
      },
    );
  });

  it("keeps capture errors fatal when the requested slide logs an error", async () => {
    const { dir } = await fixture(onTestFinished, {
      "public/og.png": "Supplied image",
      "slides/01-first.mdx":
        '{(() => { console.error("Requested frame failed"); return "Frame"; })()}',
    });
    const outDir = join(dir, "site");
    await build(await loadDeck(dir), { outDir });
    const browser = await launchBrowser();
    onTestFinished(() => browser.close());
    await expect(openBuiltDeck(browser, outDir, "./", "#/1")).rejects.toThrow(DeckError);
  });
});
