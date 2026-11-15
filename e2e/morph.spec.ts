import { expect, type Page } from "@playwright/test";
import { seekTransition, settled } from "./fixtures/deck.fixture";
import { test } from "./fixtures/motion.fixture";

async function travel(page: Page, name: string, key: string) {
  const samples = seekTransition(page, name, [0, 0.25, 0.5, 0.75, 1]);
  await page.keyboard.press(key);
  return samples;
}

test("A shared Morph moves and resizes monotonically between slides in both directions", async ({
  page,
}) => {
  await page.goto("/#/20");
  await expect(page.getByRole("heading", { name: "Follow one idea." })).toBeVisible();
  await settled(page);
  for (const [key, sign, heading] of [
    ["ArrowRight", 1, "Give it more room."],
    ["ArrowLeft", -1, "Follow one idea."],
  ] as const) {
    const samples = await travel(page, "gallery-card", key);
    const first = samples[0];
    const last = samples.at(-1);
    if (!first || !last) throw new Error("Missing morph frames");
    expect((last.x - first.x) * sign).toBeGreaterThan(400);
    expect((last.y - first.y) * sign).toBeGreaterThan(40);
    expect((last.width - first.width) * sign).toBeGreaterThan(100);
    for (const [i, frame] of samples.entries()) {
      const previous = samples[i - 1];
      if (!previous) continue;
      expect((frame.x - previous.x) * sign).toBeGreaterThanOrEqual(0);
      expect((frame.y - previous.y) * sign).toBeGreaterThanOrEqual(0);
    }
    await settled(page);
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
});

test("A morphSteps click moves monotonically while the root avoids a cross-fade", async ({
  page,
}) => {
  await page.goto("/#/22");
  await expect(page.getByRole("heading", { name: "Move within the frame." })).toBeVisible();
  await settled(page);
  const samplesForward = seekTransition(page, "step-card", [0, 0.5, 1]);
  await page.keyboard.press("ArrowRight");
  const forward = await samplesForward;
  expect(forward[0]?.rootOldDisplay).toBe("none");
  expect(forward[0]?.rootAnimation).toBe("none");
  await settled(page);
  const samples = await travel(page, "step-card", "ArrowLeft");
  expect(samples.every((frame, i) => i === 0 || frame.x <= (samples[i - 1]?.x ?? frame.x))).toBe(
    true,
  );
  expect(samples.every((frame, i) => i === 0 || frame.y <= (samples[i - 1]?.y ?? frame.y))).toBe(
    true,
  );
  const first = samples[0];
  const last = samples.at(-1);
  if (!first || !last) throw new Error("Missing step frames");
  expect(first.x - last.x).toBeGreaterThan(400);
  await settled(page);
});

test("settled during a timeline beat resolves after its last visible change", async ({ page }) => {
  await page.goto("/#/15");
  const scene = page.getByRole("img", { name: "Three beats move and recolor two shapes" });
  await expect(scene).toBeVisible();
  await settled(page);
  await page.keyboard.press("ArrowRight");
  await settled(page);
  await expect(scene.locator("g")).toHaveAttribute("transform", "translate(460 260)");
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
  await settled(page);
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
  await settled(page);
  await expect(loop).toHaveCSS("transform", "none");
  await expect.poll(() => loop.evaluate((element) => element.getAnimations().length)).toBe(0);
});

test("A transition that never starts fails with the group it waited for", async ({
  deck,
  page,
}) => {
  await deck.goto(22);
  await expect(seekTransition(page, "never-starts", [0, 0.5, 1])).rejects.toThrow(
    "Waiting for View Transition group never-starts",
  );
});
