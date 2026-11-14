import { expect, type Page } from "@playwright/test";
import { test } from "./motion.fixture";

async function settle(page: Page) {
  await page.evaluate(() => {
    if (!window.__deck) throw new Error("Missing settle API");
    return window.__deck.settled();
  });
}

async function travel(page: Page, name: string, key: string) {
  return page.evaluate(
    async ({ name, key }) => {
      const api = window.__deck;
      if (!api) throw new Error("Missing settle API");
      window.dispatchEvent(new KeyboardEvent("keydown", { key, code: key }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key, code: key }));
      const frames: { x: number; y: number; width: number }[] = [];
      let done = false;
      const finished = api.settled().then(() => {
        done = true;
      });
      while (!done) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const style = getComputedStyle(
          document.documentElement,
          `::view-transition-group(${name})`,
        );
        if (
          style.transform === "none" ||
          !document.documentElement.hasAttribute("data-deck-transition")
        )
          continue;
        const matrix = new DOMMatrixReadOnly(style.transform);
        frames.push({ x: matrix.e, y: matrix.f, width: Number.parseFloat(style.width) });
      }
      await finished;
      return frames;
    },
    { name, key },
  );
}

test("A shared Morph moves and resizes monotonically between slides in both directions", async ({
  page,
}) => {
  await page.goto("/#/20");
  await expect(page.getByRole("heading", { name: "Follow one idea." })).toBeVisible();
  await settle(page);
  for (const [key, sign, heading] of [
    ["ArrowRight", 1, "Give it more room."],
    ["ArrowLeft", -1, "Follow one idea."],
  ] as const) {
    const samples = await travel(page, "gallery-card", key);
    expect(samples.length).toBeGreaterThan(5);
    const first = samples[0];
    const last = samples.at(-1);
    if (!first || !last) throw new Error("Missing morph frames");
    expect((last.x - first.x) * sign).toBeGreaterThan(400);
    expect((last.y - first.y) * sign).toBeGreaterThan(40);
    expect((last.width - first.width) * sign).toBeGreaterThan(100);
    for (const [i, frame] of samples.entries()) {
      const previous = samples[i - 1];
      if (!previous) continue;
      expect((frame.x - previous.x) * sign).toBeGreaterThanOrEqual(-0.1);
      expect((frame.y - previous.y) * sign).toBeGreaterThanOrEqual(-0.1);
    }
    await settle(page);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});

test("A morphSteps click moves monotonically while the root avoids a cross-fade", async ({
  page,
}) => {
  await page.goto("/#/22");
  await expect(page.getByRole("heading", { name: "Move within the frame." })).toBeVisible();
  await settle(page);
  const root = await page.evaluate(async () => {
    const start = document.startViewTransition.bind(document);
    return new Promise<{ old: string; animation: string }>((resolve) => {
      document.startViewTransition = (update) => {
        const transition = start(update);
        void transition.ready.then(() =>
          resolve({
            old: getComputedStyle(document.documentElement, "::view-transition-old(root)").display,
            animation: getComputedStyle(document.documentElement, "::view-transition-new(root)")
              .animationName,
          }),
        );
        return transition;
      };
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight" }));
      window.dispatchEvent(new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight" }));
    });
  });
  expect(root).toEqual({ old: "none", animation: "none" });
  await settle(page);
  const samples = await travel(page, "step-card", "ArrowLeft");
  expect(samples.length).toBeGreaterThan(5);
  expect(
    samples.every((frame, i) => i === 0 || frame.x <= (samples[i - 1]?.x ?? frame.x) + 0.1),
  ).toBe(true);
  expect(
    samples.every((frame, i) => i === 0 || frame.y <= (samples[i - 1]?.y ?? frame.y) + 0.1),
  ).toBe(true);
  const first = samples[0];
  const last = samples.at(-1);
  if (!first || !last) throw new Error("Missing step frames");
  expect(first.x - last.x).toBeGreaterThan(400);
  await settle(page);
});

test("settled during a timeline beat resolves after its last visible change", async ({ page }) => {
  await page.goto("/#/15");
  const scene = page.getByRole("img", { name: "Three beats move and recolor two shapes" });
  await expect(scene).toBeVisible();
  await settle(page);
  await page.keyboard.press("ArrowRight");
  await settle(page);
  await expect(scene.locator("g")).toHaveAttribute("transform", "translate(460 260)");
  const poses = await scene.locator("g").evaluate(async (group) => {
    const values: (string | null)[] = [];
    for (let i = 0; i < 3; i++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      values.push(group.getAttribute("transform"));
    }
    return values;
  });
  expect(poses).toEqual(Array(3).fill("translate(460 260)"));
});

test("settled ignores the gallery loop and infinite browser animations", async ({ page }) => {
  await page.goto("/#/23");
  const loop = page.getByRole("img", { name: "Continuously turning ring" });
  await expect(loop).toBeVisible();
  await loop.evaluate((element) => {
    element.animate([{ opacity: 0.5 }, { opacity: 1 }], { duration: 600, iterations: Infinity });
    element.animate([{ filter: "brightness(1)" }, { filter: "brightness(1.01)" }], {
      duration: Infinity,
    });
  });
  await settle(page);
  const before = await loop.evaluate((element) => getComputedStyle(element).transform);
  await expect
    .poll(() => loop.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(before);
  await loop.evaluate((element) => {
    for (const animation of element.getAnimations()) {
      if (!(animation instanceof CSSAnimation)) animation.cancel();
    }
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  await settle(page);
  const reduced = await loop.evaluate(async (element) => {
    const frames: string[] = [];
    for (let i = 0; i < 4; i++) {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      frames.push(getComputedStyle(element).transform);
    }
    return frames;
  });
  expect(new Set(reduced).size).toBe(1);
});
