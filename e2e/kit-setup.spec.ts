import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { test } from "./fixtures/deck.fixture";
import { kitFixture } from "./fixtures/kit.fixture";

test("Setup installs before component modules evaluate and editing it reloads the page", async ({
  page,
  deckServer,
}) => {
  const server = await kitFixture(deckServer, {
    "setup.ts":
      'document.documentElement.dataset.setup = document.getElementById("deck-root")?.childElementCount === 0 ? "before mount" : "too late";',
    "slides/01-setup.mdx": "<SetupProbe />",
    "components/SetupProbe.tsx":
      'const atLoad = document.documentElement.dataset.setup ?? "missing setup"; export function SetupProbe() { return <h1>{atLoad}</h1>; }',
  });
  try {
    await page.goto(server.url);
    await expect(page.getByRole("heading")).toHaveText("before mount");
    const loaded = page.waitForEvent("load");
    await writeFile(
      join(server.dir, "setup.ts"),
      'document.documentElement.dataset.setup = "reinstalled before mount";',
    );
    await loaded;
    await expect(page.getByRole("heading")).toHaveText("reinstalled before mount");
  } finally {
    await server.close();
  }
});
