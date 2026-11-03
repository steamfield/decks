// `make demo`: builds every example deck in src/data/examples.json into
// public/demo/<name>/ for the player, records what each deck reports through the
// embed contract into fixtures/examples/<name>.json, takes each poster from the
// same build through the same contract the player uses (at the start step, once
// the deck reports it settled, so entrances have finished drawing), records the
// hero loop for each example marked `loop`, and takes the normal and warm stills
// with the repository's own `shot` script.
//
//   node scripts/demo.mjs            # everything
//   node scripts/demo.mjs --build    # deck builds only (what a deploy needs)
//   node scripts/demo.mjs --no-shots # builds and recordings, keep posters, loops and stills
//   node scripts/demo.mjs --loops    # builds and loops only
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
// committed; public/demo/ and .demo/ are not.
import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { createServer as createNetServer } from "node:net";
import { dirname, extname, join, normalize, resolve } from "node:path";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { deepMerge } from "../../packages/decks/theme/resolve.ts";

const site = resolve(import.meta.dirname, "..");
const repo = resolve(site, "..");
const work = join(site, ".demo");
const { examples: ENTRIES } = JSON.parse(
  readFileSync(join(site, "src/data/examples.json"), "utf8"),
);
const NAMES = ENTRIES.map((entry) => entry.name);
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
const STILL = { deck: "tides", clicks: 1 };
const buildOnly = process.argv.includes("--build");
const noShots = process.argv.includes("--no-shots");
const loopsOnly = process.argv.includes("--loops");

const log = (message) => console.log(`demo: ${message}`);

function run(command, args, options = {}) {
  log(`${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited ${result.status ?? result.signal}`);
  }
}

/** Slidev's CLI entry, resolved from the repository root like deck.mjs does. */
function slidevBin() {
  const require = createRequire(join(repo, "package.json"));
  const pkgPath = require.resolve("@slidev/cli/package.json");
  const { bin } = JSON.parse(readFileSync(pkgPath, "utf8"));
  return join(dirname(pkgPath), typeof bin === "string" ? bin : bin.slidev);
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

async function waitForHttp(url, timeoutMs = 90_000) {
  const until = Date.now() + timeoutMs;
  while (Date.now() < until) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Not up yet.
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`${url} did not answer within ${timeoutMs / 1000}s`);
}

/** Starts Slidev's dev server for a deck; returns its port and a stop function. */
async function devServer(entry) {
  const port = await freePort();
  const child = spawn("node", [slidevBin(), entry, "--port", String(port)], {
    cwd: repo,
    stdio: ["ignore", "ignore", "inherit"],
    detached: true,
  });
  const stop = () => {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      // Already gone.
    }
  };
  try {
    await waitForHttp(`http://localhost:${port}/`);
  } catch (error) {
    stop();
    throw error;
  }
  return { port, stop };
}

function build(name) {
  const out = join(site, "public/demo", name);
  rmSync(out, { recursive: true, force: true });
  run(
    "node",
    [slidevBin(), "build", `examples/${name}/slides.md`, "--base", `/demo/${name}/`, "--out", out],
    {
      cwd: repo,
    },
  );
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
async function record(page, port, name) {
  await page.goto(`http://localhost:${port}/__harness.html`);
  await page.evaluate((src) => {
    document.getElementById("deck").src = src;
  }, `/demo/${name}/`);
  const count = () =>
    page.evaluate(
      () => window.messages.filter((m) => m.type === "decks:state" && m.settled).length,
    );
  /** The newest settled state once more than `after` have arrived. */
  const settled = async (after) => {
    await page.waitForFunction(
      (n) => window.messages.filter((m) => m.type === "decks:state" && m.settled).length > n,
      after,
      { timeout: 30_000 },
    );
    return page.evaluate(() =>
      window.messages.filter((m) => m.type === "decks:state" && m.settled).at(-1),
    );
  };
  let state = await settled(0);
  const meta = await page.evaluate(() => window.messages.find((m) => m.type === "decks:meta"));
  if (!meta) throw new Error(`${name}: no decks:meta before the first state`);
  const step = async (message) => {
    const before = await count();
    await page.evaluate((m) => window.send(m), message);
    return settled(before);
  };
  if (state.slide !== 1 || state.beat !== 0)
    state = await step({ type: "decks:cmd", cmd: "go", slide: 1, beat: 0 });
  const states = [];
  const key = (s) => `${s.slide}:${s.beat}`;
  for (let guard = 0; guard < 400; guard++) {
    if (states.some((s) => key(s) === key(state))) break;
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
  }, `/demo/${name}/index.html#/${startSlide}${query}`);
  await page.waitForFunction(
    ([slide, beat]) =>
      window.messages.some(
        (m) => m.type === "decks:state" && m.settled && m.slide === slide && m.beat === beat,
      ),
    [startSlide, startBeat],
    { timeout: 30_000 },
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
  const page = await context.newPage();
  const began = Date.now();
  const now = () => (Date.now() - began) / 1000;
  await page.goto(`http://localhost:${port}/__harness.html`);
  const query = startBeat ? `?clicks=${startBeat}` : "";
  await page.evaluate((src) => {
    const deck = document.getElementById("deck");
    deck.style.width = "100vw";
    deck.style.height = "100vh";
    deck.src = src;
  }, `/demo/${name}/index.html#/${startSlide}${query}`);
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
  // Let fonts and the first draw finish before the loop starts.
  await page.waitForTimeout(800);
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

/** Converts one 1920x1080 shot into the 640 and 1280 AVIF and WebP files the page uses. */
async function encode(png, base) {
  mkdirSync(dirname(base), { recursive: true });
  for (const width of [640, 1280]) {
    const resized = sharp(png).resize(width, Math.round((width * 9) / 16));
    await resized.clone().avif({ quality: 50, effort: 6 }).toFile(`${base}-${width}.avif`);
    await resized.clone().webp({ quality: 74 }).toFile(`${base}-${width}.webp`);
  }
  log(`wrote ${base.replace(`${site}/`, "")}-{640,1280}.{avif,webp}`);
}

/** Runs the repository's `shot` script against a dev server for `entry`; returns the PNG path. */
async function shot(entry, slide, clicks, outDir) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const server = await devServer(entry);
  try {
    run("bun", ["run", "shot", String(slide), String(clicks), String(server.port)], {
      cwd: repo,
      env: { ...process.env, SHOT_DIR: outDir },
    });
  } finally {
    server.stop();
  }
  const png = join(outDir, `slide-${slide}-c${clicks}.png`);
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
  const own = join(copy, "theme.json");
  const warm = JSON.parse(readFileSync(join(site, "demo/warm-theme.json"), "utf8"));
  const theme = existsSync(own) ? deepMerge(JSON.parse(readFileSync(own, "utf8")), warm) : warm;
  writeFileSync(own, `${JSON.stringify(theme, null, 2)}\n`);
  return copy;
}

async function main() {
  run("bun", ["run", "lint"], { cwd: repo });
  run("bun", ["run", "check"], { cwd: repo });
  for (const name of NAMES) build(name);
  if (buildOnly) return;

  mkdirSync(join(site, "fixtures/examples"), { recursive: true });
  const server = await staticServer();
  const browser = await chromium.launch();
  const recordings = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    for (const name of NAMES) {
      log(`recording ${name}`);
      recordings[name] = await record(page, server.port, name);
      writeFileSync(
        join(site, "fixtures/examples", `${name}.json`),
        `${JSON.stringify(recordings[name], null, 2)}\n`,
      );
    }
    if (!noShots) {
      for (const entry of ENTRIES.filter((e) => e.loop)) {
        log(`loop ${entry.name}`);
        await loopVideo(browser, server.port, entry.name, recordings[entry.name]);
      }
    }
    if (!noShots && !loopsOnly) {
      for (const name of NAMES) {
        const { startSlide, startBeat } = recordings[name];
        log(`poster ${name} at slide ${startSlide}, step ${startBeat + 1}`);
        await encode(
          await poster(page, server.port, name, recordings[name]),
          join(site, "public/posters", name),
        );
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
  run("bunx", ["biome", "format", "--write", "fixtures/examples"], { cwd: site });
  if (noShots || loopsOnly) return;

  const { startSlide } = recordings[STILL.deck];
  const normal = await shot(
    `examples/${STILL.deck}/slides.md`,
    startSlide,
    STILL.clicks,
    join(work, "shots", "normal"),
  );
  await encode(normal, join(site, "public/stills", `${STILL.deck}-normal`));
  const copy = warmCopy(STILL.deck);
  const warm = await shot(
    join(copy, "slides.md"),
    startSlide,
    STILL.clicks,
    join(work, "shots", "warm"),
  );
  await encode(warm, join(site, "public/stills", `${STILL.deck}-warm`));
  log("done");
}

main().catch((error) => {
  console.error(`demo: ${error.message}`);
  process.exit(1);
});
