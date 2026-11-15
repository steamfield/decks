import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { expect, type Page } from "@playwright/test";
import { cliProcess } from "../packages/node/src/cli-process.test-support";
import { test } from "./fixtures/deck.fixture";
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
  const env = { ...process.env };
  delete env.NODE_OPTIONS;
  delete env.NO_COLOR;
  env.FORCE_COLOR = "1";
  const server = cliProcess("bun", ["run", "decks", "dev", deck, "--port", "0"], { env });
  try {
    await use(await server.url());
  } finally {
    await server.close();
  }
}

test("The source CLI shares its runtime with the agents deck's public imports", async ({
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
    await writeFile(
      join(dir, "deck.config.ts"),
      'import { defineDeck } from "@steamfield/decks/node"; export default defineDeck({ title: "Public source" });',
    );
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
      await expect
        .poll(() =>
          page.evaluate(async () => {
            await document.fonts.load("16px Inter", "Public source deck");
            return Array.from(document.fonts).some(
              (font) => font.family === "Inter" && font.status === "loaded",
            );
          }),
        )
        .toBe(true);
    });
    const env = { ...process.env };
    delete env.NODE_OPTIONS;
    await promisify(execFile)("bun", ["run", "decks", "build", dir, "--out", join(dir, "site")], {
      env,
    });
    expect(await readFile(join(dir, "site/index.html"), "utf8")).toContain("Public source");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("Public and private motion imports share clicks in a source deck", async ({ page }) => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/mixed-source-"));
  try {
    await mkdir(join(dir, "slides"));
    await writeFile(join(dir, "deck.config.ts"), 'export default { title: "Mixed source" };');
    await writeFile(
      join(dir, "slides/01-mixed.mdx"),
      'import { Step as PublicStep } from "@steamfield/decks/motion";\nimport { Step as PrivateStep } from "@react-decks/motion";\n\n# Both imports follow the slide.\n\n<PublicStep at={1}>Public reveal</PublicStep>\n\n<PrivateStep at={2}>Private reveal</PrivateStep>',
    );
    await serve(dir, async (url) => {
      await open(page, url, "01-mixed");
      await expect(
        page.getByRole("heading", { name: "Both imports follow the slide." }),
      ).toBeVisible();
      await expect(page.getByText("Public reveal", { exact: true })).not.toBeVisible();
      await expect(page.getByText("Private reveal", { exact: true })).not.toBeVisible();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByText("Public reveal", { exact: true })).toBeVisible();
      await expect(page.getByText("Private reveal", { exact: true })).not.toBeVisible();
      await page.keyboard.press("ArrowRight");
      await expect(page.getByText("Private reveal", { exact: true })).toBeVisible();
      await expect(page).toHaveURL(/#\/1\?clicks=2$/);
    });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
