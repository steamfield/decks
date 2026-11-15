// Compare a ported deck's frames with its Slidev capture, frame by frame.
//
//   node scripts/parity.mjs <alias>                 # every frame
//   node scripts/parity.mjs <alias> 4 5             # slides 4 and 5
//   node scripts/parity.mjs <alias> --live s01-c0   # frames with a live scene, judged by eye
//   node scripts/parity.mjs <alias> --ready ".od-slide"   # what marks a slide as rendered
//                                                          (default: a story frame)
//
// Run from the repo root. Baselines are `bun run snap <slidev alias> .parity/<alias>` captures
// at 1920x1080, found in the nearest `.parity/<alias>` directory above this one (override with
// PARITY_BASELINE). A baseline frame sNN-cK is slide NN at click K; a ported deck names its
// slides `slides/NN-slug.mdx` with NN the Slidev slide position, so a partial port still lines
// up. The script starts `decks dev <alias>` on a free port, loads each frame with motion off,
// waits for fonts and for the deck to settle, and counts differing pixels with the settings
// Slidev's `snap diff` uses. Captures and diff images go to <deck>/.out/.
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LIMIT = 0.002;
const args = process.argv.slice(2);
const usage =
  "usage: node scripts/parity.mjs <alias> [slide...] [--live sNN-cK,...] [--ready <selector>]";
// A usage mistake gets one line and the usage, not a stack trace.
const fail = (message) => {
  console.error(`parity: ${message}\n${usage}`);
  process.exit(2);
};
const registry = JSON.parse(await readFile(join(root, "decks.json"), "utf8"));
const aliases = Object.keys(registry).filter((key) => !key.startsWith("_"));
const alias = args.shift();
if (!alias) fail(`which deck? Registered: ${aliases.join(", ")}.`);
const live = new Set();
// A layer (a CRT tube, a credit) can be in the slide host before the slide module renders.
let ready = ".od-story-frame";
const only = [];
while (args.length) {
  const arg = args.shift();
  if (arg === "--ready" || arg === "--live") {
    const value = args.shift();
    if (value === undefined || value.startsWith("--")) fail(`${arg} needs a value.`);
    if (arg === "--ready") ready = value;
    else for (const name of value.split(",")) live.add(`${name}.png`);
  } else if (/^\d+$/.test(arg)) only.push(Number(arg));
  else fail(`${JSON.stringify(arg)} is not a slide number or an option.`);
}

if (!registry[alias]?.dir)
  fail(`${JSON.stringify(alias)} is not in decks.json. Registered: ${aliases.join(", ")}.`);
const deck = join(root, registry[alias].dir);
const findBaseline = () => {
  for (let dir = root; ; dir = dirname(dir)) {
    const candidate = join(dir, ".parity", alias);
    if (existsSync(candidate)) return candidate;
    if (dirname(dir) === dir)
      fail(
        `no .parity/${alias} baseline above ${root}. Capture one from the slidev-final tag, or set PARITY_BASELINE.`,
      );
  }
};
const baseline = process.env.PARITY_BASELINE ?? findBaseline();
const out = join(deck, ".out");

const port = await new Promise((done, fail) => {
  const probe = createServer();
  probe.once("error", fail);
  probe.listen(0, () => {
    const { port } = probe.address();
    probe.close(() => done(port));
  });
});
const server = spawn("bun", ["run", "decks", "dev", alias, "--port", String(port)], {
  cwd: root,
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
    throw new Error(`decks dev ${alias} did not start:\n${log}`);
  }
  await new Promise((done) => setTimeout(done, 200));
}

const ported = (await readdir(join(deck, "slides"))).filter((name) => name.endsWith(".mdx")).sort();
const position = (slide) => ported.findIndex((name) => Number(name.slice(0, 2)) === slide) + 1;
const frames = (await readdir(baseline))
  .filter((name) => /^s\d+-c\d+\.png$/.test(name))
  .filter((name) => !only.length || only.includes(Number(name.match(/^s(\d+)/)[1])))
  .sort();
await mkdir(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});
// The Slidev baseline has no credit, so compare without it and without the band it reserves.
await page.addInitScript(() => {
  const style = document.createElement("style");
  style.textContent =
    '[data-deck-slide] { --deck-credit-space: 0px !important; } [data-deck-layer="credit"] { display: none; }';
  const add = () => document.documentElement?.append(style);
  if (document.documentElement) add();
  else
    new MutationObserver((_records, observer) => {
      if (!document.documentElement) return;
      observer.disconnect();
      add();
    }).observe(document, { childList: true });
});
const errors = [];
page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
page.on("pageerror", (error) => errors.push(String(error)));
let failed = 0;
try {
  for (const name of frames) {
    const [, number, clicks] = name.match(/^s(\d+)-c(\d+)/);
    const slide = position(Number(number));
    const click = Number(clicks);
    if (!slide) {
      console.log(`${name}\tnot ported yet`);
      continue;
    }
    const query = live.has(name) ? "" : "?motion=instant";
    await page.goto(`${url}/${query}#/${slide}${click ? `?clicks=${click}` : ""}`);
    await page.reload();
    // The slide's host exists before its lazily loaded module has rendered.
    await page.locator(`[data-deck-slide="${slide}"][data-deck-active] ${ready}`).first().waitFor();
    await page.evaluate(async () => {
      await document.fonts.ready;
      await window.__deck.settled();
    });
    const hosted = page.frames().filter((frame) => frame !== page.mainFrame());
    if (hosted.length) {
      await Promise.all(hosted.map((frame) => frame.waitForLoadState("load")));
      await page.waitForTimeout(1500);
    }
    // The Slidev capture waited 3.2 s on every frame; a live scene needs the same to draw.
    if (live.has(name)) await page.waitForTimeout(3200);
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
    const verdict = live.has(name)
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
