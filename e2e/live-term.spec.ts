import { mkdir, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { expect } from "@playwright/test";
import { build, loadDeck } from "@steamfield/decks/node";
import { preview } from "vite";
import { settled, test } from "./fixtures/deck.fixture";

test("without --live-term the fixture shows its recording in play and static views", async ({
  page,
  deckServer,
}) => {
  const server = await deckServer(resolve("examples/terminal"));
  await page.goto(server.url);
  await expect(page.getByLabel("Terminal recording", { exact: true })).toHaveText("$ ");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByLabel("Terminal recording", { exact: true })).toHaveText(
    "$ echo hello\nhello\n$ ls\n$ ",
  );
  await expect(page.getByRole("application", { name: "Live terminal" })).toHaveCount(0);
  const opened = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await opened;
  await expect(
    presenter.getByRole("region", { name: "Current slide" }).getByLabel("Terminal recording"),
  ).toBeVisible();
  await presenter.close();
  await page.keyboard.press("o");
  await expect(
    page
      .getByRole("button", { name: "Slide 1: Commands run inside the slide." })
      .getByLabel("Terminal recording"),
  ).toBeVisible();
  await page.goto(`${server.url}#/print`);
  await expect(page.getByLabel("Terminal recording", { exact: true })).toHaveText([
    "$ ",
    "$ echo hello\nhello\n$ ",
    "$ echo hello\nhello\n$ ls\n$ ",
    "$ echo hello\nhello\n$ ls\n$ echo third\nthird\n$ ",
  ]);
  await page.goto(`${server.url}?motion=instant#/1`);
  await settled(page);
  await expect(page.getByLabel("Terminal recording", { exact: true })).toBeVisible();
  await expect(page.getByRole("application", { name: "Live terminal" })).toHaveCount(0);
});

test("a built terminal deck contains no xterm code and displays its recording", async ({
  page,
}) => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const outDir = await mkdtemp(resolve(".tmp/e2e-terminal-"));
  try {
    await build(await loadDeck(resolve("examples/terminal")), { outDir });
    const files = await readdir(outDir, { recursive: true });
    const scripts = await Promise.all(
      files
        .filter((file) => file.endsWith(".js") || file.endsWith(".css"))
        .map((file) => readFile(join(outDir, file), "utf8")),
    );
    expect(scripts.join("\n")).not.toMatch(/@xterm|xterm-screen|xterm-viewport|XtermHost/);
    const server = await preview({
      configFile: false,
      build: { outDir },
      preview: { port: 0, open: false },
    });
    try {
      const url = server.resolvedUrls?.local[0];
      if (!url) throw new Error("Vite preview did not provide a local URL");
      await page.goto(url);
      await settled(page);
      await expect(page.getByLabel("Terminal recording", { exact: true })).toHaveText("$ ");
      await expect(page.getByRole("application", { name: "Live terminal" })).toHaveCount(0);
    } finally {
      await server.close();
    }
  } finally {
    await rm(outDir, { recursive: true, force: true });
  }
});
