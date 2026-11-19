import { copyFile, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { expect, type Frame, type Page } from "@playwright/test";
import { build, loadDeck } from "@steamfield/decks/node";
import { preview } from "vite";
import { test as base } from "./deck.fixture";
import { boot } from "./embed.fixture";

export { step } from "./embed.fixture";

type ShowLog = Record<
  "data-deck-motion" | "data-deck-nav" | "data-deck-transition" | "opacity",
  (string | null)[]
>;

declare global {
  interface Window {
    e2eShowLog: ShowLog;
  }
}

/** Boots the embed on a slide and waits until it and its neighbours have rendered. */
export async function bootShow(page: Page, url: string, slide: number) {
  await boot(page, url, `./index.html?decks-bridge=1#/${slide}`);
  const frame = page.frame({ url: (url) => url.pathname.endsWith("/index.html") });
  if (!frame) throw new Error("Missing deck frame");
  const names = ["Show cover", "Entrance beat", "Show end"];
  // Mounted neighbours have resolved modules, so a move to them can run a transition.
  for (const name of names.slice(Math.max(0, slide - 2), slide + 1))
    await expect(frame.getByText(name)).toBeAttached();
  return frame;
}

/**
 * Records, from now on, every value the root's motion and transition attributes take and every
 * inline opacity the entrance writes. MutationObserver batches changes, so each attribute's
 * intermediate values come from the old values of the later records in a batch.
 */
export async function record(frame: Frame) {
  await frame.evaluate(() => {
    const html = document.documentElement;
    const log: ShowLog = {
      "data-deck-motion": [],
      "data-deck-nav": [],
      "data-deck-transition": [],
      opacity: [],
    };
    window.e2eShowLog = log;
    new MutationObserver((records) => {
      const changes = new Map<keyof ShowLog, (string | null)[]>();
      for (const change of records) {
        const name = change.attributeName;
        if (change.target === html && name && name !== "style" && name in log) {
          const key = name as keyof ShowLog;
          changes.set(key, [...(changes.get(key) ?? []), change.oldValue]);
        } else if (change.target instanceof HTMLElement && change.target.dataset.entrance === "")
          log.opacity.push(change.target.style.opacity);
      }
      for (const [name, olds] of changes) log[name].push(...olds.slice(1), html.getAttribute(name));
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ["data-deck-motion", "data-deck-nav", "data-deck-transition", "style"],
    });
  });
}

export const readLog = (frame: Frame) => frame.evaluate(() => window.e2eShowLog);

export const test = base.extend<object, { embedURL: string }>({
  embedURL: [
    async ({ browserName: _browserName }, use) => {
      await mkdir(resolve(".tmp"), { recursive: true });
      const dir = await mkdtemp(resolve(".tmp/embed-show-"));
      try {
        const files = {
          "deck.config.ts":
            'export default { title: "Embed show fixture", credit: false, transition: "push" };',
          "setup.ts":
            'import { installTheme, resolveTheme } from "@steamfield/decks/kit"; installTheme(resolveTheme());',
          "styles/index.css": '@import "@steamfield/decks/kit/styles.css";',
          "slides/01-cover.mdx": "---\ntitle: Cover\n---\n# Show cover",
          "slides/02-entrance.mdx": "---\ntitle: Entrance\nclicks: 2\n---\n<Entrance />",
          "slides/03-end.mdx": "---\ntitle: End\n---\n# Show end",
          "components/Entrance.tsx": `
import { useSlide } from "@steamfield/decks";
import { gsap, motionMode } from "@steamfield/decks/motion";
import { useLayoutEffect, useRef } from "react";
export function Entrance() {
  const { clicks, isActive, renderContext } = useSlide();
  const root = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    if (!isActive || renderContext !== "slide" || motionMode() === "instant") {
      gsap.set(el, { opacity: 1 });
      return;
    }
    const tween = gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.6 });
    return () => {
      tween.kill();
    };
  }, [isActive, renderContext]);
  return <h1 ref={root} data-entrance="">Entrance beat {clicks}</h1>;
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
          if (!url) throw new Error("Embed show preview did not provide a local URL");
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
