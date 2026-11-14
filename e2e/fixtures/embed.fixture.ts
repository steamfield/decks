import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { test as base, type Page } from "@playwright/test";
import { build, loadDeck } from "@steamfield/decks/node";
import { preview } from "vite";

declare global {
  interface Window {
    embedMessages: Record<string, unknown>[];
    sendEmbed(command: unknown): void;
  }
}

export async function boot(page: Page, url: string, src?: string) {
  await page.goto(`${url}embed-host.html${src ? `?src=${encodeURIComponent(src)}` : ""}`);
  await page.waitForFunction(() => window.embedMessages.some((m) => m.settled === true));
}

export async function step(page: Page, cmd: string, requestId: number, extra = {}) {
  await page.evaluate((command) => window.sendEmbed(command), {
    type: "decks:cmd",
    cmd,
    requestId,
    ...extra,
  });
  await page.waitForFunction(
    (id) => window.embedMessages.some((m) => m.requestId === id && m.settled === true),
    requestId,
  );
  return page.evaluate((id) => window.embedMessages.filter((m) => m.requestId === id), requestId);
}

export const test = base.extend<object, { embedURL: string }>({
  embedURL: [
    async ({ browserName: _browserName }, use) => {
      await mkdir(resolve(".tmp"), { recursive: true });
      const dir = await mkdtemp(resolve(".tmp/embed-"));
      try {
        const files = {
          "deck.config.ts": 'export default { title: "Embed fixture", credit: false };',
          "setup.ts":
            'import { installTheme, resolveTheme } from "@steamfield/decks/kit"; installTheme(resolveTheme());',
          "styles/index.css": '@import "@steamfield/decks/kit/styles.css";',
          "slides/01-cover.mdx": "---\ntitle: Cover\n---\n# Embed cover",
          "slides/02-story.mdx": "---\ntitle: Story\nclicks: 2\nmorphSteps: true\n---\n<Caption />",
          "slides/03-stage.mdx": "---\ntitle: Stage\nclicks: 1\n---\n<OwnKeys />",
          "slides/04-error.mdx": "---\ntitle: Error\nclicks: 1\n---\n<Broken />",
          "components/Embed.tsx": `
import { StoryCard } from "@steamfield/decks/kit";
import { routeEmbedNavigation, useDeck, useSlide } from "@steamfield/decks";
import { useState } from "react";
export function Caption() {
  const { clicks } = useSlide();
  const [caption, setCaption] = useState("default");
  return <><h1>Story slide</h1>{(caption === "hidden" || caption === "visible") && <StoryCard lead="Hidden lead" style={{ visibility: "hidden" }} />}<StoryCard lead={caption === "default" ? "Lead " + clicks : caption === "late" ? "Late lead" : "Visible lead"} body={"Body " + clicks} style={{ visibility: caption === "hidden" ? "hidden" : "visible" }} /><input aria-label="Caption input" /><button onClick={() => setCaption("late")}>Late caption</button><button onClick={() => setCaption("hidden")}>Hide caption</button><button onClick={() => setCaption("visible")}>Show caption</button></>;
}
export function OwnKeys() {
  const deck = useDeck();
  return <button data-decks-own-keys onKeyDown={(event) => {
    if (routeEmbedNavigation(event.nativeEvent)) return;
    if (event.key === "ArrowRight") { event.stopPropagation(); deck.next(); }
    if (event.key === "ArrowLeft") { event.stopPropagation(); deck.prev(); }
  }}>Stage keys</button>;
}
export function Broken() {
  if (useSlide().clicks) throw new Error("Fixture render failed");
  return <h1>Error slide</h1>;
}`,
        };
        for (const [file, content] of Object.entries(files)) {
          await mkdir(dirname(join(dir, file)), { recursive: true });
          await writeFile(join(dir, file), content);
        }
        await mkdir(join(dir, "node_modules/@steamfield"), { recursive: true });
        await symlink(
          resolve("packages/decks"),
          join(dir, "node_modules/@steamfield/decks"),
          "dir",
        );
        await mkdir(join(dir, "public"), { recursive: true });
        await copyFile(
          resolve("e2e/fixtures/embed-host.html"),
          join(dir, "public/embed-host.html"),
        );
        const outDir = join(dir, "dist");
        await build(await loadDeck(dir), { outDir, base: "/d/fixture/" });
        const server = await preview({
          configFile: false,
          base: "/d/fixture/",
          build: { outDir },
          preview: { host: true, port: 0, open: false },
        });
        try {
          const url = server.resolvedUrls?.local[0];
          if (!url) throw new Error("Embed preview did not provide a local URL");
          await use(url);
        } finally {
          await server.close();
        }
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
    { scope: "worker" },
  ],
});
