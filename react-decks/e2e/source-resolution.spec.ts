import { spawn } from "node:child_process";
import { once } from "node:events";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { expect, type Page, test } from "@playwright/test";
import { settled } from "./fixtures/kit.fixture";

async function open(page: Page, url: string, slide: string) {
  const path = `/slides/${slide}.mdx`;
  const compiled = page.waitForResponse(
    (response) => new URL(response.url()).pathname === path && response.status() === 200,
    { timeout: 30_000 },
  );
  await page.goto(`${url}?motion=instant#/1`);
  await (await compiled).finished();
  await page.waitForFunction(() => window.__deck !== undefined, undefined, { timeout: 30_000 });
  // Mounting publishes the settle API before the lazy slide and its imports have loaded.
  await page.evaluate(async (path) => {
    await import(path);
  }, path);
  await settled(page);
}

async function serve(deck: string, use: (url: string) => Promise<void>) {
  const child = spawn(
    resolve("node_modules/.bin/tsx"),
    [resolve("packages/node/src/cli.ts"), "dev", deck, "--port", "0"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  const closed = once(child, "close");
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (data) => {
    stdout += String(data);
  });
  child.stderr.on("data", (data) => {
    stderr += String(data);
  });
  try {
    await expect
      .poll(() => stdout, { message: stderr, timeout: 10_000 })
      .toMatch(/http:\/\/[^\s]+/);
    const url = stdout.match(/http:\/\/[^\s]+/)?.[0];
    if (!url) throw new Error(`Source CLI did not print a URL: ${stderr}`);
    await use(url);
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
    await closed;
  }
}

test("The source CLI shares its runtime with the agents deck's private imports", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await serve("agents", async (url) => {
    await open(page, url, "01-cover");
    await expect(page.getByRole("heading", { name: /Building for agents/ })).toBeVisible();
    await expect(page.getByText(/failed to (render|load)/)).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test("A public-only source deck loads motion and Inter without built package output", async ({
  page,
}) => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/public-source-"));
  try {
    const facade = join(dir, "node_modules/@steamfield/decks");
    await mkdir(facade, { recursive: true });
    await cp(resolve("packages/decks/package.json"), join(facade, "package.json"));
    await cp(resolve("packages/decks/src"), join(facade, "src"), { recursive: true });
    await mkdir(join(dir, "node_modules/@react-decks"), { recursive: true });
    for (const name of ["core", "runtime", "motion", "node", "kit"])
      await symlink(resolve("packages", name), join(dir, "node_modules/@react-decks", name), "dir");
    await mkdir(join(dir, "slides"));
    await mkdir(join(dir, "styles"));
    await writeFile(join(dir, "package.json"), '{"type":"module"}');
    await writeFile(join(dir, "deck.config.ts"), 'export default { title: "Public source" };');
    await writeFile(
      join(dir, "slides/01-first.mdx"),
      'import { useDeck } from "@steamfield/decks";\nimport { Step } from "@steamfield/decks/motion";\n\nexport function Status() { return <p>Public slide {useDeck().slide}</p>; }\n\n<Step at={0}><h1>Public source deck</h1><Status /></Step>',
    );
    await writeFile(
      join(dir, "styles/index.css"),
      '@import "@steamfield/decks/kit/styles.css";\nh1 { font-family: Inter; }',
    );
    await serve(dir, async (url) => {
      await open(page, url, "01-first");
      await expect(page.getByRole("heading", { name: "Public source deck" })).toBeVisible();
      await expect(page.getByText("Public slide 1", { exact: true })).toBeVisible();
      expect(
        await page.evaluate(async () => {
          await document.fonts.load("16px Inter", "Public source deck");
          return Array.from(document.fonts).some(
            (font) => font.family === "Inter" && font.status === "loaded",
          );
        }),
      ).toBe(true);
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
