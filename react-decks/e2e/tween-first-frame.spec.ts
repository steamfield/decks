import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { test } from "./deck.fixture";

test("An initial timeline seek paints its endpoint even during a costly mount", async ({
  page,
  editableDeck,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") errors.push(message.text());
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await writeFile(
    join(editableDeck.dir, "first-frame.html"),
    '<html><head><link rel="icon" href="data:," /></head><body><div id="deck-root"></div><script type="module" src="/first-frame.tsx"></script></body></html>',
  );
  await writeFile(
    join(editableDeck.dir, "first-frame.tsx"),
    `import { useLayoutEffect } from "react";
import { mountDeck } from "@react-decks/runtime";
import { useTimeline, useTween } from "@react-decks/motion";
function Scene() {
  const value = useTween({ x: 0 });
  useTimeline((tl, beat) => {
    beat(0);
    tl.to(value, { x: 100, duration: 1 });
    beat(1);
  });
  useLayoutEffect(() => {
    // Force the first layout of a dense slide, as a real chart's measurement would.
    document.getElementById("deck-frame")?.getBoundingClientRect();
  }, []);
  return <><output>{value.x}</output><svg>{Array.from({ length: 4000 }, (_, i) => <circle key={i} cx={i % 80} cy={Math.floor(i / 80)} r={1} />)}</svg></>;
}
mountDeck({
  manifest: { name: "first-frame", title: "First frame", canvas: { width: 1920, height: 1080 },
    slides: [{ no: 1, id: "scene", file: "scene.mdx", title: "Scene", clicks: 1 }] },
  slides: { scene: async () => ({ default: Scene }) }, frontmatter: {}, components: {},
});`,
  );
  await page.addInitScript(() => {
    const frame = () => {
      const output = document.querySelector("[data-deck-active] output");
      if (output) Reflect.set(window, "firstTweenPaint", output.textContent);
      else requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await page.goto(`${editableDeck.url}first-frame.html#/1?clicks=1`);
  await expect(page.getByRole("status")).toHaveText("100");
  await expect.poll(() => page.evaluate(() => Reflect.get(window, "firstTweenPaint"))).toBe("100");
  expect(errors).toEqual([]);
});
