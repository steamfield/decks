// Compare this deck's frames with the Slidev capture, frame by frame.
//
//   node examples/building-for-agents/scripts/parity.mjs            # every frame
//   node examples/building-for-agents/scripts/parity.mjs 4 5        # slides 4 and 5
//
// Run from react-decks/. It starts `decks dev agents` on a free port, loads each frame with
// motion off, waits for fonts and for the deck to settle, and counts differing pixels against
// the baseline with the same settings the Slidev `snap diff` uses. Diff images and the
// captured frames go to examples/building-for-agents/.out/. The cover and the close run a
// live WebGL scene: two Slidev captures of them differ by about 1%, so they are reported but
// judged by eye.
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const deck = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseline =
  process.env.BFA_BASELINE ??
  "/private/tmp/claude-501/-Users-riley--claude-spares-spare-BdMOe7/636427da-5e73-4422-94d4-718ee4e977c5/scratchpad/bfa-baseline";
const out = join(deck, ".out");
const LIMIT = 0.002;
const LIVE = new Set(["s01-c0.png", "s19-c0.png"]);
const only = process.argv.slice(2).map(Number);

const port = await new Promise((done, fail) => {
  const probe = createServer();
  probe.once("error", fail);
  probe.listen(0, () => {
    const { port } = probe.address();
    probe.close(() => done(port));
  });
});
const server = spawn("bun", ["run", "decks", "dev", "agents", "--port", String(port)], {
  cwd: resolve(deck, "../.."),
  stdio: ["ignore", "pipe", "pipe"],
});
let log = "";
server.stdout.on("data", (chunk) => (log += chunk));
server.stderr.on("data", (chunk) => (log += chunk));
const url = `http://localhost:${port}`;
const deadline = Date.now() + 60_000;
for (;;) {
  try {
    if ((await fetch(url)).ok) break;
  } catch {}
  if (Date.now() > deadline) {
    server.kill();
    throw new Error(`decks dev agents did not start:\n${log}`);
  }
  await new Promise((done) => setTimeout(done, 200));
}

// A baseline frame's slide number is the Slidev page number, which is the file prefix here.
// While the port is partial the deck has fewer slides, so find each slide's current position.
const ported = (await readdir(join(deck, "slides"))).filter((name) => name.endsWith(".mdx")).sort();
const position = (slide) => ported.findIndex((name) => Number(name.slice(0, 2)) === slide) + 1;
const frames = (await readdir(baseline))
  .filter((name) => /^s\d+-c\d+\.png$/.test(name))
  .filter((name) => !only.length || only.includes(Number(name.slice(1, 3))))
  .sort();
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
page.on("pageerror", (error) => errors.push(String(error)));
let failed = 0;
try {
  for (const name of frames) {
    const page_ = Number(name.slice(1, 3));
    const slide = position(page_);
    const click = Number(name.match(/-c(\d+)/)[1]);
    if (!slide) {
      console.log(`${name}\tnot ported yet`);
      continue;
    }
    // The cover and close are compared with their scene running, as the baseline was captured.
    const query = LIVE.has(name) ? "" : "?motion=instant";
    await page.goto(`${url}/${query}#/${slide}${click ? `?clicks=${click}` : ""}`);
    await page.reload();
    // The slide's host exists before its lazily loaded module has rendered.
    await page
      .locator(
        `[data-deck-slide="${slide}"][data-deck-active] > .od-slide:not(.sf-tube-host) .od-story-frame`,
      )
      .waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await window.__deck.settled();
    });
    // A slide with a hosted page (slide 13) shows a placeholder until its iframe has loaded.
    const hosted = page.frames().filter((frame) => frame !== page.mainFrame());
    if (hosted.length) {
      await Promise.all(hosted.map((frame) => frame.waitForLoadState("load")));
      await page.locator("[data-deck-active] iframe").first().waitFor();
      await page.waitForTimeout(1500);
    }
    // The Slidev capture waited 3.2 s on every frame; the live scene needs the same to draw.
    if (LIVE.has(name)) await page.waitForTimeout(3200);
    const file = join(out, name);
    await page.screenshot({ path: file });
    const actual = PNG.sync.read(await readFile(file));
    const expected = PNG.sync.read(await readFile(join(baseline, name)));
    if (actual.width !== expected.width || actual.height !== expected.height) {
      console.log(
        `${name}\tsize ${actual.width}x${actual.height}, baseline ${expected.width}x${expected.height}`,
      );
      failed++;
      continue;
    }
    const diff = new PNG({ width: actual.width, height: actual.height });
    const pixels = pixelmatch(actual.data, expected.data, diff.data, actual.width, actual.height, {
      threshold: 0.1,
    });
    await writeFile(join(out, name.replace(".png", "-diff.png")), PNG.sync.write(diff));
    const fraction = pixels / (actual.width * actual.height);
    const verdict = LIVE.has(name)
      ? "live scene, judge by eye"
      : fraction <= LIMIT
        ? "ok"
        : "DIFFERS";
    if (verdict === "DIFFERS") failed++;
    console.log(`${name}\t${(fraction * 100).toFixed(3)}%\t${verdict}`);
  }
} finally {
  await browser.close();
  server.kill();
}
if (errors.length) console.log(`console errors:\n${[...new Set(errors)].join("\n")}`);
process.exitCode = failed || errors.length ? 1 : 0;
