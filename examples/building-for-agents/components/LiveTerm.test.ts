import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";
import { resolveTheme } from "@steamfield/decks/kit";
import { dev, loadDeck } from "@steamfield/decks/node";
import { PNG } from "pngjs";
import { onTestFinished, test } from "vitest";
import { settled } from "../../../e2e/fixtures/deck-driver";
import deckTheme from "../theme.json";

const browserTest = test.skipIf(spawnSync("zsh", ["--version"]).status !== 0);

async function openDemo(position: string) {
  const browser = await chromium.launch();
  let server: Awaited<ReturnType<typeof dev>> | undefined;
  const errors: string[] = [];
  onTestFinished(async () => {
    await browser.close();
    await server?.close();
    expect(errors).toEqual([]);
  });
  server = await dev(await loadDeck(resolve(import.meta.dirname, "..")), {
    port: 0,
    liveTerm: true,
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`${server.url}${position}`);
  await page.getByRole("heading", { name: "Stacks gives a failed check an exit code." }).waitFor();
  await settled(page);
  return page;
}

browserTest(
  "the opening caption stays visible with the screen off, including after stepping back",
  async () => {
    const page = await openDemo("?motion=instant#/7");
    await expect(
      page.getByRole("heading", { name: "Stacks gives a failed check an exit code." }),
    ).toBeVisible();
    const leads = await page.evaluate<string[]>(
      `import("/data/07-stacks-live.ts").then(({ COPY }) => COPY.map(entry => entry.lead))`,
    );
    for (const click of [0, 1, 0]) {
      if (click === 1) await page.keyboard.press("ArrowRight");
      else if (page.url().includes("clicks=1")) await page.keyboard.press("ArrowLeft");
      await settled(page);
      const lead = leads[click];
      if (!lead) throw new Error(`Missing caption at click ${click}`);
      await expect
        .poll(() =>
          page
            .getByText(lead, { exact: true })
            .evaluateAll((elements) =>
              elements.some((element) =>
                element.checkVisibility({ opacityProperty: true, visibilityProperty: true }),
              ),
            ),
        )
        .toBe(true);
    }
  },
);

browserTest("all sixteen ANSI colors remain visually distinct in the live pane", async () => {
  const page = await openDemo("#/7?clicks=1");
  const terminal = page.getByRole("application", { name: "Live terminal" });
  await terminal.getByText("$", { exact: true }).waitFor();
  await terminal.click();
  await page.keyboard.type(
    "for n in {0..15}; do if (( n < 8 )); then c=$((30+n)); else c=$((90+n-8)); fi; printf '\\e[%smANSI%02d\\e[0m ' $c $n; done; printf '\\n'",
  );
  await page.keyboard.press("Enter");
  await expect(terminal.getByText("ANSI15", { exact: true })).toBeVisible();
  await settled(page);
  const theme = resolveTheme(deckTheme);
  const palette = [
    theme.text.faint,
    theme.ramps.rose[0],
    theme.ramps.emerald[1],
    theme.accents.amber,
    theme.ramps.violet[1],
    theme.accents.pink,
    theme.accents.cyan,
    theme.text.secondary,
    theme.text.muted,
    theme.ramps.rose[2],
    theme.ramps.emerald[2],
    theme.ramps.amber[2],
    theme.ramps.violet[2],
    theme.ramps.rose[3],
    theme.ramps.cyan[2],
    theme.text.highlight,
  ];
  for (const [n, color] of palette.entries()) {
    if (!color) throw new Error(`Missing ANSI color ${n}`);
    const image = PNG.sync.read(
      await terminal.getByText(`ANSI${String(n).padStart(2, "0")}`, { exact: true }).screenshot(),
    );
    // Solid glyph interiors are brighter than the CRT background and antialiased edges.
    let brightest = [0, 0, 0];
    let brightness = 0;
    for (let at = 0; at < image.data.length; at += 4) {
      const pixel = [image.data[at] ?? 0, image.data[at + 1] ?? 0, image.data[at + 2] ?? 0];
      const value = pixel.reduce((sum, channel) => sum + channel * channel, 0);
      if (value > brightness) {
        brightness = value;
        brightest = pixel;
      }
    }
    const expected = [...color.matchAll(/[a-f\d]{2}/gi)].map(([hex]) => Number.parseInt(hex, 16));
    for (const [channel, value] of expected.entries())
      expect(
        Math.abs((brightest[channel] ?? 0) - value),
        `ANSI ${n}, channel ${channel}`,
      ).toBeLessThanOrEqual(16);
  }
});

browserTest("selected plain output retains light glyphs against a dark background", async () => {
  const page = await openDemo("#/7?clicks=1");
  const terminal = page.getByRole("application", { name: "Live terminal" });
  await terminal.getByText("$", { exact: true }).waitFor();
  await terminal.click();
  await page.keyboard.type("printf 'Selection remains readable\\n'");
  await page.keyboard.press("Enter");
  const output = terminal.getByText("Selection remains readable", { exact: true });
  await expect(output).toBeVisible();
  await settled(page);
  const clip = await output.boundingBox();
  if (!clip) throw new Error("Missing selection output bounds");
  const before = PNG.sync.read(await page.screenshot({ clip }));
  await output.click({ clickCount: 3 });
  const selected = PNG.sync.read(await page.screenshot({ clip }));
  expect(selected.data).not.toEqual(before.data);
  let dark = 0;
  let light = 0;
  for (let at = 0; at < selected.data.length; at += 4) {
    const sum =
      (selected.data[at] ?? 0) + (selected.data[at + 1] ?? 0) + (selected.data[at + 2] ?? 0);
    if (sum < 3 * 120) dark++;
    if (sum > 3 * 180) light++;
  }
  const pixels = selected.width * selected.height;
  // Ignore the unselected edge pixels from fractional slide coordinates.
  expect(dark / pixels).toBeGreaterThan(0.2);
  expect(light / pixels).toBeGreaterThan(0.05);
});
