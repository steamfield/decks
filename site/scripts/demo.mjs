// `make demo`: builds every example deck in src/data/examples.json into
// public/d/<name>/ for the player, records what each deck reports through the
// embed contract into fixtures/examples/<name>.json, takes each poster from the
// same build through the same contract the player uses (at the start step, once
// the deck reports it settled, so entrances have finished drawing), records the
// hero loop for each example marked `loop`, shoots a poster for each live demo in the
// package guide (src/data/guide-demos.ts) at its last step, and takes the normal and
// warm stills with the repository's `decks shot` CLI.
//
//   node scripts/demo.mjs            # everything
//   node scripts/demo.mjs --build    # deck builds only (what a deploy needs)
//   node scripts/demo.mjs --no-shots # builds and recordings, keep posters, loops and stills
//   node scripts/demo.mjs --loops    # builds and loops only
//   node scripts/demo.mjs --posters  # builds, recordings and posters only
//   node scripts/demo.mjs --headed   # visible Chromium (default on macOS)
//   DEMO_HEADLESS=1 node scripts/demo.mjs # headless capture for CI
//   node scripts/demo.mjs --only opendata-pitch,aisd-showcase # selected builds and fixtures
//
// A loop is the deck in the player's frame from its start step: three steps
// forward, then three back, so it shows the stepped build and the reverse replay
// (three back, then three forward when the start is fewer than three steps from
// the end of the deck)
// and ends where it began. It is written to public/loops/<name>.{webm,mp4}, and
// fixtures/examples/<name>.loop.json holds the step shown at each time so the
// caption under the video can follow it. Needs ffmpeg on PATH.
//
// Run from site/. The parent repository must have its dependencies installed
// (`bun install` at the root). Posters, loops, stills and recordings are
// committed; public/d/ and .demo/ are not.
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { deepMerge, resolveTheme } from "../../packages/kit/src/theme/theme-resolve.ts";
import { DEMO_POSTERS, demoName, guideDemos, resolveDemo } from "../src/data/guide-demos.ts";

const site = resolve(import.meta.dirname, "..");
const repo = resolve(site, "..");
const registry = JSON.parse(readFileSync(join(repo, "decks.json"), "utf8"));
const work = join(site, ".demo");
const { examples: ENTRIES } = JSON.parse(
  readFileSync(join(site, "src/data/examples.json"), "utf8"),
);
const onlyIndex = process.argv.indexOf("--only");
const only = onlyIndex >= 0 ? process.argv[onlyIndex + 1]?.split(",") : null;
if (onlyIndex >= 0 && (!only || only.some((name) => !ENTRIES.some((entry) => entry.name === name))))
  throw new Error("--only requires registered example names separated by commas");
const SELECTED = ENTRIES.filter((entry) => !only || only.includes(entry.name));
const NAMES = SELECTED.map((entry) => entry.name);
const entryOf = (name) => ENTRIES.find((entry) => entry.name === name);
const startBeatOf = (name) => entryOf(name)?.startBeat ?? 0;
/** The loop's frame size, its dwell on each step, and the steps it takes. */
const LOOP = {
  width: 960,
  height: 540,
  dwellMs: 2600,
  steps: ["next", "next", "next", "prev", "prev", "prev"],
};
/** The NORMAL/WARM stills: this deck, at its start slide, after this many clicks. */
const STILL = { deck: "aisd-showcase", clicks: 1 };
const buildOnly = process.argv.includes("--build");
const noShots = process.argv.includes("--no-shots");
const loopsOnly = process.argv.includes("--loops");
const postersOnly = process.argv.includes("--posters");
const headed =
  process.argv.includes("--headed") ||
  (process.platform === "darwin" && process.env.DEMO_HEADLESS !== "1" && !process.env.CI);

const log = (message) => console.log(`demo: ${message}`);

function run(command, args, options = {}) {
  log(`${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited ${result.status ?? result.signal}`);
  }
}

/** Resolve the site's slug through the repository's registered deck directories. */
function aliasOf(name) {
  const alias = Object.entries(registry).find(
    ([key, value]) => !key.startsWith("_") && value.dir === `examples/${name}`,
  )?.[0];
  if (!alias) throw new Error(`${name}: no deck registered in decks.json`);
  return alias;
}

const freePort = () =>
  new Promise((done, fail) => {
    const server = createNetServer();
    server.once("error", fail);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => done(port));
    });
  });

function build(name) {
  const out = join(site, "public/d", name);
  rmSync(out, { recursive: true, force: true });
  run("bun", ["run", "decks", "build", aliasOf(name), "--base", `/d/${name}/`, "--out", out], {
    cwd: repo,
  });
}

const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

/** Serves public/ plus a harness page that embeds a deck and keeps its messages. */
async function staticServer() {
  const root = join(site, "public");
  const harness = `<!doctype html><meta charset="utf-8"><style>body{margin:0}</style><iframe id="deck" style="display:block;width:1920px;height:1080px;border:0"></iframe>
<script>
  window.messages = [];
  addEventListener("message", (event) => {
    if (event.origin === location.origin && event.source === document.getElementById("deck").contentWindow) window.messages.push(event.data);
  });
  window.send = (message) => document.getElementById("deck").contentWindow.postMessage(message, location.origin);
</script>`;
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, "http://x").pathname);
    if (path === "/__harness.html") {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(harness);
      return;
    }
    let file = normalize(join(root, path));
    if (!file.startsWith(root)) {
      response.writeHead(403).end();
      return;
    }
    if (path.endsWith("/")) file = join(file, "index.html");
    if (!existsSync(file)) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "Content-Type": TYPES[extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
  });
  const port = await freePort();
  await new Promise((done) => server.listen(port, done));
  return { port, close: () => server.close() };
}

/**
 * Drives one built deck through the embed contract: waits for decks:meta and a
 * settled state, goes to the first slide, then steps `next` to the end and keeps
 * every settled state. This is the same contract the player uses.
 */
// Timer polling stays live when a full-frame WebGL iframe stops the harness rAF.
async function record(page, port, name) {
  await page.goto(`http://localhost:${port}/__harness.html`);
  await page.evaluate((src) => {
    document.getElementById("deck").src = src;
  }, `/d/${name}/?decks-bridge&motion=instant`);
  /** The newest settled state once more than `after` have arrived. */
  const settled = async (after) => {
    await page.waitForFunction(
      (n) => window.messages.filter((m) => m.type === "decks:state" && m.settled).length > n,
      after,
      { timeout: 30_000, polling: 100 },
    );
    return page.evaluate(() =>
      window.messages.filter((m) => m.type === "decks:state" && m.settled).at(-1),
    );
  };
  let state = await settled(0);
  if (entryOf(name)?.featured && !state.lead) {
    await page.waitForFunction(
      () => window.messages.some((m) => m.type === "decks:state" && m.settled && m.lead),
      null,
      { timeout: 30_000, polling: 100 },
    );
    state = await page.evaluate(() =>
      window.messages.filter((m) => m.type === "decks:state" && m.settled && m.lead).at(-1),
    );
  }
  const meta = await page.evaluate(() => window.messages.find((m) => m.type === "decks:meta"));
  if (!meta) throw new Error(`${name}: no decks:meta before the first state`);
  let requestId = 0;
  const step = async (message) => {
    const expected =
      message.cmd === "go"
        ? { slide: message.slide, beat: message.beat }
        : state.beat < state.beats
          ? { slide: state.slide, beat: state.beat + 1 }
          : { slide: state.slide + 1, beat: 0 };
    const id = ++requestId;
    await page.evaluate((m) => window.send(m), { ...message, requestId: id });
    await page.waitForFunction(
      ({ id, slide, beat }) =>
        window.messages.some(
          (m) =>
            m.type === "decks:state" &&
            m.settled &&
            m.requestId === id &&
            m.slide === slide &&
            m.beat === beat,
        ),
      { id, ...expected },
      { timeout: 30_000, polling: 100 },
    );
    return page.evaluate(
      (id) =>
        window.messages.findLast(
          (m) => m.type === "decks:state" && m.settled && m.requestId === id,
        ),
      id,
    );
  };
  if (state.slide !== 1 || state.beat !== 0)
    state = await step({ type: "decks:cmd", cmd: "go", slide: 1, beat: 0 });
  const states = [];
  const key = (s) => `${s.slide}:${s.beat}`;
  for (let guard = 0; guard < 400; guard++) {
    if (states.some((s) => key(s) === key(state))) break;
    log(`${name}: recorded slide ${state.slide}, step ${state.beat + 1}`);
    states.push({
      slide: state.slide,
      beat: state.beat,
      beats: state.beats,
      lead: state.lead,
      body: state.body,
    });
    if (state.slide >= state.slides && state.beat >= state.beats) break;
    state = await step({ type: "decks:cmd", cmd: "next" });
  }
  const story = states.find((s) => s.lead);
  const startSlide = entryOf(name)?.startSlide ?? story?.slide ?? 1;
  const startBeat = startBeatOf(name);
  if (!states.some((s) => s.slide === startSlide && s.beat === startBeat))
    throw new Error(`${name}: no step ${startBeat + 1} on start slide ${startSlide}`);
  return {
    title: meta.title,
    slides: meta.slides,
    slideTitles: meta.slideTitles,
    startSlide,
    startBeat,
    states,
  };
}

/**
 * The poster: the built deck at its start step, loaded the way the player loads
 * it (`#/<slide>?clicks=<beat>`), captured once the deck reports that step
 * settled, so the entrance has drawn and the picture matches the first frame
 * the player shows after PLAY. Returns a 1920x1080 PNG buffer.
 */
async function poster(page, port, name, { startSlide, startBeat }) {
  await page.goto(`http://localhost:${port}/__harness.html`);
  const query = startBeat ? `?clicks=${startBeat}` : "";
  await page.evaluate((src) => {
    document.getElementById("deck").src = src;
  }, `/d/${name}/index.html?decks-bridge#/${startSlide}${query}`);
  await page.waitForFunction(
    ([slide, beat, featured]) =>
      window.messages.some(
        (m) =>
          m.type === "decks:state" &&
          m.settled &&
          m.slide === slide &&
          m.beat === beat &&
          (!featured || m.lead),
      ),
    [startSlide, startBeat, Boolean(entryOf(name)?.featured)],
    { timeout: 30_000, polling: 100 },
  );
  return page.locator("#deck").screenshot();
}

/**
 * The hero loop: the deck at the loop's frame size, from its start step through
 * LOOP.steps (reversed when the start is too near the end), filmed by Playwright and re-encoded by ffmpeg to small WebM (VP9)
 * and MP4 (H.264) files. Each mark is the time a step began, from the trim point.
 */
async function loopVideo(browser, port, name, { startSlide, startBeat, states }) {
  const at = states.findIndex((s) => s.slide === startSlide && s.beat === startBeat);
  const ahead = states.length - 1 - at;
  const forward = LOOP.steps.filter((cmd) => cmd === "next").length;
  const steps = ahead >= forward ? LOOP.steps : LOOP.steps.toReversed();
  const raw = join(work, "loops", name);
  rmSync(raw, { recursive: true, force: true });
  const size = { width: LOOP.width, height: LOOP.height };
  const context = await browser.newContext({ viewport: size, recordVideo: { dir: raw, size } });
  // Playwright starts the page's video when it creates the page, so the clock starts
  // just before: a mark can only come out a few milliseconds late, never early.
  const began = Date.now();
  const page = await context.newPage();
  const now = () => (Date.now() - began) / 1000;
  await page.goto(`http://localhost:${port}/__harness.html`);
  const query = startBeat ? `?clicks=${startBeat}` : "";
  await page.evaluate((src) => {
    const deck = document.getElementById("deck");
    deck.style.width = "100vw";
    deck.style.height = "100vh";
    deck.src = src;
  }, `/d/${name}/index.html?decks-bridge#/${startSlide}${query}`);
  const settledCount = () =>
    page.evaluate(
      () => window.messages.filter((m) => m.type === "decks:state" && m.settled).length,
    );
  await page.waitForFunction(
    ([slide, beat]) =>
      window.messages.some(
        (m) => m.type === "decks:state" && m.settled && m.slide === slide && m.beat === beat,
      ),
    [startSlide, startBeat],
    { timeout: 30_000 },
  );
  await page
    .locator("#deck")
    .contentFrame()
    .locator("body")
    .evaluate(() => document.fonts.ready);
  const trim = now();
  const marks = [{ t: 0, slide: startSlide, beat: startBeat }];
  await page.waitForTimeout(LOOP.dwellMs);
  for (const cmd of steps) {
    const before = await settledCount();
    const t = Number((now() - trim).toFixed(2));
    await page.evaluate((m) => window.send(m), { type: "decks:cmd", cmd });
    await page.waitForFunction(
      (n) => window.messages.filter((m) => m.type === "decks:state" && m.settled).length > n,
      before,
      { timeout: 30_000 },
    );
    const state = await page.evaluate(() =>
      window.messages.filter((m) => m.type === "decks:state" && m.settled).at(-1),
    );
    marks.push({ t, slide: state.slide, beat: state.beat });
    await page.waitForTimeout(LOOP.dwellMs);
  }
  const end = now();
  const video = page.video();
  await context.close();
  const input = await video.path();
  const out = join(site, "public/loops", name);
  mkdirSync(dirname(out), { recursive: true });
  const cut = [
    "-y",
    "-loglevel",
    "error",
    "-ss",
    trim.toFixed(2),
    "-to",
    end.toFixed(2),
    "-i",
    input,
    "-an",
    "-r",
    "24",
  ];
  run("ffmpeg", [
    ...cut,
    "-c:v",
    "libvpx-vp9",
    "-b:v",
    "0",
    "-crf",
    "48",
    "-row-mt",
    "1",
    `${out}.webm`,
  ]);
  run("ffmpeg", [
    ...cut,
    "-c:v",
    "libx264",
    "-crf",
    "34",
    "-preset",
    "veryslow",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    `${out}.mp4`,
  ]);
  writeFileSync(
    join(site, "fixtures/examples", `${name}.loop.json`),
    `${JSON.stringify({ width: LOOP.width, height: LOOP.height, marks }, null, 2)}\n`,
  );
  log(`wrote public/loops/${name}.{webm,mp4} and fixtures/examples/${name}.loop.json`);
}

/** Converts one 1920x1080 shot into the 640, 1280 and 1920 AVIF and WebP files the page uses. */
async function encode(png, base) {
  mkdirSync(dirname(base), { recursive: true });
  for (const width of [640, 1280, 1920]) {
    const resized = sharp(png).resize(width, Math.round((width * 9) / 16));
    await resized.clone().avif({ quality: 50, effort: 6 }).toFile(`${base}-${width}.avif`);
    await resized.clone().webp({ quality: 74 }).toFile(`${base}-${width}.webp`);
  }
  log(`wrote ${base.replace(`${site}/`, "")}-{640,1280,1920}.{avif,webp}`);
}

/** Runs the source CLI's settled screenshot command; returns the PNG path. */
function shot(entry, slide, clicks, outDir) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const png = join(outDir, `slide-${slide}-c${clicks}.png`);
  run("bun", ["run", "decks", "shot", entry, String(slide), String(clicks), "--out", png], {
    cwd: repo,
  });
  if (!existsSync(png)) throw new Error(`shot wrote no ${png}`);
  return png;
}

/** A copy of the deck with demo/warm-theme.json merged over its own theme.json. */
function warmCopy(name) {
  const copy = join(work, `${name}-warm`);
  rmSync(copy, { recursive: true, force: true });
  cpSync(join(repo, "examples", name), copy, {
    recursive: true,
    filter: (source) => !source.includes("node_modules"),
  });
  // Bun installs this deck's direct dependencies beside it, outside the copy.
  symlinkSync(join(repo, "examples", name, "node_modules"), join(copy, "node_modules"), "dir");
  const own = join(copy, "theme.json");
  const warm = JSON.parse(readFileSync(join(site, "demo/warm-theme.json"), "utf8"));
  const defaults = JSON.parse(
    readFileSync(join(repo, "packages/kit/src/theme/theme-default.json"), "utf8"),
  );
  const override = existsSync(own) ? deepMerge(JSON.parse(readFileSync(own, "utf8")), warm) : warm;
  const theme = resolveTheme(defaults, override);
  writeFileSync(own, `${JSON.stringify(theme, null, 2)}\n`);
  writeFileSync(
    join(copy, "setup.ts"),
    'import { installTheme, resolveTheme } from "@steamfield/decks/kit";\nimport theme from "./theme.json";\n\ninstallTheme(resolveTheme(theme));\n',
  );
  return copy;
}

async function main() {
  run("bun", ["run", "decks", "check"], { cwd: repo });
  // A full run owns public/d/: a build left by a renamed or removed example would still be
  // served. --only rebuilds just its decks and leaves the others.
  if (!only) rmSync(join(site, "public/d"), { recursive: true, force: true });
  for (const name of NAMES) build(name);
  if (buildOnly) return;

  mkdirSync(join(site, "fixtures/examples"), { recursive: true });
  const server = await staticServer();
  const recordings = {};
  try {
    // The untimed text walk crosses nested demos and WebGL covers. Headless,
    // instant motion avoids capture stalls; pixel captures below stay live.
    const recorder = await chromium.launch({ headless: true, args: ["--use-angle=swiftshader"] });
    try {
      for (const name of NAMES) {
        const page = await recorder.newPage({ viewport: { width: 1920, height: 1080 } });
        log(`recording ${name}`);
        try {
          recordings[name] = await record(page, server.port, name);
        } finally {
          await page.close();
        }
        writeFileSync(
          join(site, "fixtures/examples", `${name}.json`),
          `${JSON.stringify(recordings[name], null, 2)}\n`,
        );
      }
    } finally {
      await recorder.close();
    }
    if (!noShots) {
      // Native Metal keeps macOS WebGL captures responsive; software rendering
      // can stall animation frames. CI/DEMO_HEADLESS can use headless capture.
      const browser = await chromium.launch({
        headless: !headed,
        args: headed ? [] : ["--use-angle=swiftshader"],
      });
      try {
        if (!loopsOnly) {
          const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
          for (const name of NAMES) {
            const { startSlide, startBeat } = recordings[name];
            log(`poster ${name} at slide ${startSlide}, step ${startBeat + 1}`);
            await encode(
              await poster(page, server.port, name, recordings[name]),
              join(site, "public/posters", name),
            );
          }
          for (const demo of guideDemos().filter(({ deck }) => NAMES.includes(deck))) {
            const { last } = resolveDemo(demo);
            const beats = recordings[demo.deck].states.find((state) => state.slide === last)?.beats;
            if (beats === undefined)
              throw new Error(
                `${demo.page}: demo ${demo.deck}/${demo.last} has no recorded slide ${last}`,
              );
            log(
              `poster ${demo.page} ${demo.deck}/${demoName(demo)} at slide ${last}, step ${beats + 1}`,
            );
            await encode(
              await poster(page, server.port, demo.deck, { startSlide: last, startBeat: beats }),
              join(site, "public", DEMO_POSTERS, demo.deck, demoName(demo)),
            );
          }
          await page.close();
        }
        if (!postersOnly) {
          for (const entry of SELECTED.filter((e) => e.loop)) {
            log(`loop ${entry.name}`);
            await loopVideo(browser, server.port, entry.name, recordings[entry.name]);
          }
        }
      } finally {
        await browser.close();
      }
    }
  } finally {
    server.close();
  }
  run("bunx", ["biome", "format", "--write", "fixtures/examples"], { cwd: site });
  if (noShots || loopsOnly || postersOnly || only) return;

  const { startSlide } = recordings[STILL.deck];
  const normal = await shot(
    aliasOf(STILL.deck),
    startSlide,
    STILL.clicks,
    join(work, "shots", "normal"),
  );
  await encode(normal, join(site, "public/stills", `${STILL.deck}-normal`));
  const copy = warmCopy(STILL.deck);
  const warm = await shot(copy, startSlide, STILL.clicks, join(work, "shots", "warm"));
  await encode(warm, join(site, "public/stills", `${STILL.deck}-warm`));
  log("done");
}

main().catch((error) => {
  console.error(`demo: ${error.message}`);
  process.exit(1);
});
