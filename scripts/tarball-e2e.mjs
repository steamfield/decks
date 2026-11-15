import assert from "node:assert/strict";
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { mkdir, mkdtemp, readdir, readFile, realpath, rm, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify, stripVTControlCharacters } from "node:util";
import { chromium, expect } from "@playwright/test";
import { preview } from "vite";

const root = fileURLToPath(new URL("../", import.meta.url));
const keep = process.argv.includes("--keep");
const scratch = await mkdtemp(join(tmpdir(), "react-decks-tarball-"));
const offline = { ...process.env, npm_config_registry: "http://127.0.0.1:9/" };
let passed = 0;
let failed = 0;

async function step(name, run) {
  try {
    const result = await run();
    console.log(`PASS ${name}`);
    passed++;
    return result;
  } catch (error) {
    console.error(`FAIL ${name}`, error);
    failed++;
    throw error;
  }
}

async function command(cwd, bin, args, env = process.env) {
  try {
    return await promisify(execFile)(bin, args, {
      cwd,
      env,
      timeout: 180_000,
      maxBuffer: 8 * 1024 * 1024,
    });
  } catch (cause) {
    throw new Error(
      `${bin} ${args.join(" ")} in ${cwd}\n${cause.stdout ?? ""}\n${cause.stderr ?? ""}`,
      {
        cause,
      },
    );
  }
}

async function pack() {
  await step("build package", () => command(join(root, "packages/decks"), "node", ["build.mjs"]));
  return step("npm pack", async () => {
    const { stdout } = await command(join(root, "packages/decks"), "npm", [
      "pack",
      "--json",
      "--pack-destination",
      scratch,
    ]);
    const [{ filename }] = JSON.parse(stdout);
    const tarball = join(scratch, filename);
    assert((await stat(tarball)).size > 0, "npm pack must write a tarball");
    return tarball;
  });
}

async function install(manager, tarball) {
  await mkdir(join(scratch, manager));
  const project = await realpath(join(scratch, manager));
  await writeFile(
    join(project, "package.json"),
    JSON.stringify(
      {
        name: `tarball-${manager}`,
        private: true,
        type: "module",
        dependencies: {
          "@steamfield/decks": `file:${tarball}`,
          react: "19.3.1",
          "react-dom": "19.3.1",
        },
      },
      null,
      2,
    ),
  );
  await command(
    project,
    manager,
    manager === "npm" ? ["install", "--no-audit", "--no-fund"] : ["install"],
  );
  const installed = await realpath(join(project, "node_modules/@steamfield/decks"));
  assert(
    installed.startsWith(`${project}/`),
    `Package must be installed inside ${project}: ${installed}`,
  );
  return project;
}

async function writeDeck(project) {
  const files = {
    "decks.json": '{"hello":{"dir":"decks/hello"}}\n',
    "decks/hello/deck.config.ts": `import { defineDeck } from "@steamfield/decks/node";

export default defineDeck({ title: "Hello" });
`,
    "decks/hello/setup.ts": `import { installTheme, resolveTheme } from "@steamfield/decks/kit";

installTheme(resolveTheme());
`,
    "decks/hello/components/ImportedStep.tsx": `import { Step } from "@steamfield/decks/motion";

export function ImportedStep() {
  return <Step at={2}><p>Imported step appears.</p></Step>;
}
`,
    "decks/hello/slides/01-cover.mdx": `---
title: Hello
clicks: 2
---

import { StoryCard } from "@steamfield/decks/kit";

# Hello, decks.

<Step at={1}><p>Provided step appears.</p></Step>

<ImportedStep />

<StoryCard lead="The kit loads too." />
`,
    "decks/hello/slides/02-end.mdx": `---
clicks: 1
---

import { StoryCard, StoryStage, useStage } from "@steamfield/decks/kit";

export function Story() {
  const { copy, clicks, beats } = useStage({
    copy: [{ lead: "A story starts here." }, { lead: "The story advances." }],
    beats: (_tl, beat) => { beat(0); beat(1); },
  });
  return <StoryStage beats={beats} click={clicks}
    overlay={<h1 className="od-story-head">Ready to present.</h1>}
    card={<StoryCard lead={copy.lead} />} />;
}

<Story />
`,
    "decks/hello/styles/index.css": `@import "@steamfield/decks/kit/styles.css";
`,
  };
  for (const [file, content] of Object.entries(files)) {
    await mkdir(dirname(join(project, file)), { recursive: true });
    await writeFile(join(project, file), content);
  }
}

async function build(project, npm = false) {
  await command(
    project,
    npm ? "npx" : join(project, "node_modules/.bin/decks"),
    npm ? ["--no-install", "decks", "build", "hello"] : ["build", "hello"],
    offline,
  );
  const output = join(project, "dist/hello");
  assert((await readFile(join(output, "index.html"), "utf8")).includes('<div id="deck-root">'));
  const assets = await readdir(join(output, "assets"));
  for (const extension of [".js", ".css", ".woff2"])
    assert(
      assets.some((file) => file.endsWith(extension)),
      `Build must contain ${extension} assets`,
    );
}

async function browse(url) {
  const browser = await chromium.launch();
  const errors = [];
  try {
    const page = await browser.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(`${url}?motion=instant#/1`, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Hello, decks." })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("The kit loads too.", { exact: true })).toBeVisible();
    await expect(page.getByText("Provided step appears.", { exact: true })).not.toBeVisible();
    await expect(page.getByText("Imported step appears.", { exact: true })).not.toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/#\/1\?clicks=1$/);
    await expect(page.getByText("Provided step appears.", { exact: true })).toBeVisible();
    await expect(page.getByText("Imported step appears.", { exact: true })).not.toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/#\/1\?clicks=2$/);
    await expect(page.getByText("Imported step appears.", { exact: true })).toBeVisible();
    const font = await page.evaluate(async () => {
      await document.fonts.load("16px Inter", "Hello, decks.");
      return (
        document.fonts.check("16px Inter", "Hello, decks.") &&
        Array.from(document.fonts).some(
          (face) => face.family === "Inter" && face.status === "loaded",
        )
      );
    });
    assert(font, "The shipped Inter font must load");
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("heading", { name: "Ready to present." })).toBeVisible();
    await expect(page.getByText("A story starts here.", { exact: true })).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/#\/2\?clicks=1$/);
    await expect(page.getByText("The story advances.", { exact: true })).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await expect(page.getByText("A story starts here.", { exact: true })).toBeVisible();
    assert.deepEqual(errors, [], "Browser must have no console or page errors");
  } catch (cause) {
    throw new Error(`Browser at ${url}\n${errors.join("\n")}`, { cause });
  } finally {
    await browser.close();
  }
}

async function staticBuild(project) {
  const server = await preview({
    configFile: false,
    root: project,
    build: { outDir: "dist/hello" },
    preview: { host: "127.0.0.1", port: 0, open: false },
  });
  try {
    const url = server.resolvedUrls.local[0];
    assert(url, "Static server must provide a URL");
    await browse(url);
  } finally {
    await server.close();
  }
}

async function dev(project) {
  const env = { ...offline, FORCE_COLOR: "1" };
  delete env.NO_COLOR;
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await promisify(socket.close.bind(socket))();
  const child = spawn(
    join(project, "node_modules/.bin/decks"),
    ["dev", "hello", "--port", String(port)],
    {
      cwd: project,
      env,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  const closed = once(child, "close");
  let output = "";
  child.stdout.on("data", (data) => {
    output += data;
  });
  child.stderr.on("data", (data) => {
    output += data;
  });
  try {
    await expect
      .poll(
        () => {
          assert(child.exitCode === null, `Dev server exited: ${output}`);
          return stripVTControlCharacters(output).match(/http:\/\/[^\s]+/)?.[0];
        },
        { timeout: 30_000, message: "Dev server must print its URL" },
      )
      .toBeTruthy();
    await browse(stripVTControlCharacters(output).match(/http:\/\/[^\s]+/)[0]);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    await closed;
  }
}

async function bunCase(tarball) {
  const project = await step("bun install tarball outside workspace", () =>
    install("bun", tarball),
  );
  await step("write getting-started deck", () => writeDeck(project));
  await step("decks build hello and assets", () => build(project));
  await step("Chromium static build: heading, both steps, kit, Inter, no errors", () =>
    staticBuild(project),
  );
  await step("Chromium decks dev: heading, both steps, kit, Inter, no errors", () => dev(project));
}

async function npmCase(tarball) {
  const project = await step("npm install tarball outside workspace", () =>
    install("npm", tarball),
  );
  await step("write npm deck", () => writeDeck(project));
  await step("npx decks build hello and assets", () => build(project, true));
  await step("Chromium npm static build", () => staticBuild(project));
}

try {
  await step("repo Chromium is installed", async () => {
    let browser;
    try {
      browser = await chromium.launch();
    } catch (cause) {
      if (cause instanceof Error && cause.message.includes("Executable doesn't exist"))
        throw new Error(
          "Chromium for the repo's Playwright is not installed. Run bunx --no-install playwright install chromium.",
          { cause },
        );
      throw cause;
    }
    await browser.close();
  });
  const tarball = await pack();
  for (const run of [bunCase, npmCase]) {
    try {
      await run(tarball);
    } catch {
      // The failed step has already printed its error; the other installer still runs.
    }
  }
} catch {
  // Pack failures are reported by step() and prevent dependent install cases.
} finally {
  console.log(`${passed} passed, ${failed} failed`);
  if (keep) console.log(`kept: ${scratch}`);
  else await rm(scratch, { recursive: true, force: true });
  process.exitCode = failed ? 1 : 0;
}
