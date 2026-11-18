import { expect, type Page } from "@playwright/test";
import { slideNo } from "./fixtures/motion-gallery";
import { keys, open, seekRootTransition, settle, test } from "./fixtures/transitions";

test.use({
  launchOptions: {
    args: ["--disable-features=OverlayScrollbar"],
    ignoreDefaultArgs: ["--hide-scrollbars"],
  },
});

const [cut, push, morphSteps, fade] = [
  slideNo("cut"),
  slideNo("push"),
  slideNo("morph-steps"),
  slideNo("fade"),
];

test("Attribute logs preserve two changes delivered in one mutation batch", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    const html = document.documentElement;
    html.setAttribute("data-deck-transition", "fade");
    html.setAttribute("data-deck-nav", "forward");
    html.setAttribute("data-deck-transition", "zoom");
    html.setAttribute("data-deck-nav", "backward");
  });
  await expect
    .poll(() => page.evaluate(() => window.e2eTransitionAttributes))
    .toEqual(["fade", "zoom"]);
  await expect
    .poll(() => page.evaluate(() => window.e2eNavAttributes))
    .toEqual(["forward", "backward"]);
});

test("A fade boundary publishes its URL immediately and removes its forward attributes before settling", async ({
  page,
}) => {
  await open(page, 1);
  await keys(page, ["ArrowRight"]);
  await expect(page).toHaveURL(/#\/2$/);
  await settle(page);
  await expect.poll(() => page.evaluate(() => window.e2eTransitionAttributes)).toContain("fade");
  await expect.poll(() => page.evaluate(() => window.e2eNavAttributes)).toContain("forward");
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-transition");
  await expect(page.locator("html")).not.toHaveAttribute("data-deck-nav");
});

test("Going back across a fade boundary uses its backward direction", async ({ page }) => {
  await open(page, fade);
  await keys(page, ["ArrowLeft"]);
  await settle(page);
  await expect.poll(() => page.evaluate(() => window.e2eTransitionAttributes)).toContain("fade");
  await expect.poll(() => page.evaluate(() => window.e2eNavAttributes)).toContain("backward");
  await expect(page).toHaveURL(/#\/1$/);
});

test("Fade preserves additive cross-fade coverage for both root snapshots", async ({ page }) => {
  await open(page, 1);
  await keys(page, ["ArrowRight"]);
  const blending = await page.evaluate(async () => {
    await window.e2eTransition?.ready;
    return ["old", "new"].map(
      (kind) =>
        getComputedStyle(document.documentElement, `::view-transition-${kind}(root)`).mixBlendMode,
    );
  });
  expect(blending).toEqual(["plus-lighter", "plus-lighter"]);
  await settle(page);
});

test("Fade has no root-group motion that outlasts its opacity animation", async ({ page }) => {
  await open(page, 1);
  await keys(page, ["ArrowRight"]);
  const durations = await page.evaluate(async () => {
    await window.e2eTransition?.ready;
    const group = getComputedStyle(document.documentElement, "::view-transition-group(root)");
    const snapshot = getComputedStyle(document.documentElement, "::view-transition-new(root)");
    return {
      group: group.animationName === "none" ? 0 : Number.parseFloat(group.animationDuration),
      snapshot: Number.parseFloat(snapshot.animationDuration),
    };
  });
  expect(durations.group).toBeLessThanOrEqual(durations.snapshot);
  await settle(page);
});

test("A cut boundary never sets transition attributes", async ({ page }) => {
  await open(page, cut);
  await keys(page, ["ArrowRight"]);
  await settle(page);
  await expect(page.getByRole("heading", { name: "Follow one idea." })).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  await expect.poll(() => page.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
});

test("Instant and live reduced-motion changes disable transitions", async ({ page }) => {
  await open(page, push, "?motion=instant");
  await keys(page, ["ArrowRight"]);
  await settle(page);
  await expect(page.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  await expect.poll(() => page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  await expect.poll(() => page.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
  await open(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator("html")).toHaveAttribute("data-deck-motion", "instant");
  await keys(page, ["ArrowRight"]);
  await settle(page);
  await expect.poll(() => page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  await expect.poll(() => page.evaluate(() => window.e2eTransitionAttributes)).toEqual([]);
});

test("Only clicks marked morphSteps start a step transition", async ({ page }) => {
  await open(page, fade);
  await keys(page, ["ArrowRight"]);
  await settle(page);
  await expect.poll(() => page.evaluate(() => window.e2eTransitionNames)).toEqual([]);
  await open(page, morphSteps);
  await keys(page, ["ArrowRight"]);
  await settle(page);
  await expect.poll(() => page.evaluate(() => window.e2eTransitionAttributes)).toContain("step");
  await expect.poll(() => page.evaluate(() => window.e2eTransitionNames)).toEqual(["fade", "step"]);
});

type RootSnapshot = Awaited<ReturnType<typeof seekRootTransition>>[number]["next"];

function expectFaceOn({ left, right, width, turn }: RootSnapshot) {
  expect(left).toBeCloseTo(0, 2);
  expect(right).toBeCloseTo(width, 2);
  expect(turn).toBeCloseTo(0, 4);
}

function pixels(length: string | undefined, basis: number) {
  if (length?.endsWith("%")) return (Number.parseFloat(length) * basis) / 100;
  if (length?.endsWith("px")) return Number.parseFloat(length);
  return NaN;
}

async function boundary(page: Page, preset: string, direction: 1 | -1 = 1, points = [0, 0.5, 1]) {
  const slide = slideNo(`transition-${preset}`);
  const from = direction === 1 ? slide : slide + 1;
  const key = direction === 1 ? "ArrowRight" : "ArrowLeft";
  await open(page, from);
  const frames = await seekRootTransition(page, key, points);
  await expect(page).toHaveURL(new RegExp(`#/${from + direction}$`));
  await settle(page);
  return frames;
}

for (const [direction, arrival, departure, vertical, navigation] of [
  [1, "right", "left", "below", "forward"],
  [-1, "left", "right", "above", "backward"],
] as const) {
  test(`rise moves the new slide in from ${vertical} going ${navigation}`, async ({ page }) => {
    const [first, frame, last] = await boundary(page, "rise", direction);
    if (!first || !frame || !last) throw new Error("Missing rise frames");
    expect(first.next.y).toBe(first.next.height * direction);
    expect(frame.next.y * direction).toBeGreaterThan(0);
    expect(frame.old.y * direction).toBeLessThan(0);
    expect((frame.next.y - frame.old.y) * direction).toBeCloseTo(frame.old.height, 1);
    expect(last.next.stationary).toBe(true);
    expect([frame.old.x, frame.next.x]).toEqual([0, 0]);
    expect([frame.old.opacity, frame.next.opacity]).toEqual([1, 1]);
  });

  test(`cover slides in from the ${arrival} over the stationary old slide`, async ({ page }) => {
    const [first, frame, last] = await boundary(page, "cover", direction);
    if (!first || !frame || !last) throw new Error("Missing cover frames");
    expect(first.next.x).toBe(first.next.width * direction);
    expect(frame.next.x * direction).toBeGreaterThan(0);
    expect(frame.next.x * direction).toBeLessThan(frame.next.width);
    expect(last.next.stationary).toBe(true);
    expect(frame.old.stationary).toBe(true);
    expect(frame.next.y).toBe(0);
    expect(frame.next.z).toBeGreaterThan(frame.old.z);
    expect([frame.old.opacity, frame.next.opacity]).toEqual([1, 1]);
  });

  test(`reveal slides the old slide to the ${departure} over the stationary new slide`, async ({
    page,
  }) => {
    const [first, frame, last] = await boundary(page, "reveal", direction);
    if (!first || !frame || !last) throw new Error("Missing reveal frames");
    expect(first.old.stationary).toBe(true);
    expect(frame.old.x * direction).toBeLessThan(0);
    expect(frame.old.x * direction).toBeGreaterThan(-frame.old.width);
    expect(last.old.x).toBe(-last.old.width * direction);
    expect(frame.next.stationary).toBe(true);
    expect(frame.old.y).toBe(0);
    expect(frame.old.z).toBeGreaterThan(frame.next.z);
    expect([frame.old.opacity, frame.next.opacity]).toEqual([1, 1]);
  });

  test(`wipe uncovers the new slide while its clipped ${arrival} edge recedes`, async ({
    page,
  }) => {
    const [first, frame, last] = await boundary(page, "wipe", direction);
    if (!first || !frame || !last) throw new Error("Missing wipe frames");
    const inset = ({ clip, width, height }: RootSnapshot) => {
      if (clip === "none") return 0;
      const edges = /^inset\(([^)]+)\)$/.exec(clip)?.[1]?.split(" ") ?? [];
      const [top, right = top, bottom = top, left = right] = edges;
      expect([
        pixels(top, height),
        pixels(bottom, height),
        pixels(direction === 1 ? left : right, width),
      ]).toEqual([0, 0, 0]);
      return pixels(direction === 1 ? right : left, width);
    };
    expect(inset(first.next)).toBe(first.next.width);
    const midpoint = inset(frame.next);
    expect(midpoint).toBeGreaterThan(0);
    expect(midpoint).toBeLessThan(frame.next.width);
    expect(inset(last.next)).toBe(0);
    expect([frame.old.clip, frame.old.opacity, frame.next.opacity]).toEqual(["none", 1, 1]);
  });

  test(`flip hands off between edge-on snapshots turning ${navigation}`, async ({ page }) => {
    const [start, first, middle, last, end] = await boundary(
      page,
      "flip",
      direction,
      [0, 0.25, 0.5, 0.75, 1],
    );
    if (!start || !first || !middle || !last || !end) throw new Error("Missing flip frames");
    expectFaceOn(start.old);
    expectFaceOn(end.next);
    expect(first.old.turn * direction).toBeLessThan(0);
    expect(first.old.turn * direction).toBeGreaterThan(-1);
    expect(first.next.turn * direction).toBeCloseTo(1);
    expect(middle.old.turn * direction).toBeCloseTo(-1);
    expect(middle.next.turn * direction).toBeCloseTo(1);
    expect(last.old.turn * direction).toBeCloseTo(-1);
    expect(last.next.turn * direction).toBeGreaterThan(0);
    expect(last.next.turn * direction).toBeLessThan(1);
    expect(middle.old.perspective * middle.next.perspective).toBeLessThan(0);
  });

  test(`cube turns both faces around their shared edge going ${navigation}`, async ({ page }) => {
    const [first, frame, last] = await boundary(page, "cube", direction);
    if (!first || !frame || !last) throw new Error("Missing cube frames");
    expectFaceOn(first.old);
    expectFaceOn(last.next);
    const [left, right] = direction === 1 ? [frame.old, frame.next] : [frame.next, frame.old];
    expect(left.turn).toBeGreaterThan(0);
    expect(right.turn).toBeLessThan(0);
    expect(left.perspective * right.perspective).toBeLessThan(0);
    expect(left.right).toBeCloseTo(right.left, 1);
    expect(left.left).toBeLessThan(left.right);
    expect(right.left).toBeLessThan(right.right);
  });
}

test("cube ends flush beside a classic scrollbar", async ({ page }) => {
  await open(page, slideNo("transition-cube"));
  await page.addStyleTag({ content: "html { overflow-y: scroll; scrollbar-width: thin; }" });
  await expect
    .poll(() => page.evaluate(() => innerWidth - document.documentElement.clientWidth))
    .toBeGreaterThan(0);
  const [last] = await seekRootTransition(page, "ArrowRight", [1]);
  if (!last) throw new Error("Missing cube end frame");
  expectFaceOn(last.next);
  await settle(page);
});

test("iris opens a circular window from the center of the new slide", async ({ page }) => {
  const [first, middle, last] = await boundary(page, "iris");
  if (!first || !middle || !last) throw new Error("Missing iris frames");
  const radius = ({ clip, width, height }: RootSnapshot) => {
    const [, size, x = "50%", y = "50%"] = /^circle\((\S+)(?: at (\S+) (\S+))?\)$/.exec(clip) ?? [];
    expect([pixels(x, width), pixels(y, height)]).toEqual([width / 2, height / 2]);
    return pixels(size, Math.hypot(width, height) * Math.SQRT1_2);
  };
  expect(radius(first.next)).toBe(0);
  const midpoint = radius(middle.next);
  const end = radius(last.next);
  expect(midpoint).toBeGreaterThan(0);
  expect(midpoint).toBeLessThan(end);
  expect(end).toBeGreaterThanOrEqual(Math.hypot(last.next.width, last.next.height) / 2);
  expect([middle.old.clip, middle.old.opacity, middle.next.opacity]).toEqual(["none", 1, 1]);
});

test("blur softens and fades the old slide while the new slide sharpens", async ({ page }) => {
  const [first, middle, last] = await boundary(page, "blur");
  if (!first || !middle || !last) throw new Error("Missing blur frames");
  const blur = (filter: string) => Number(/^blur\(([\d.]+)px\)$/.exec(filter)?.[1]);
  expect(blur(middle.old.filter), middle.old.filter).toBeGreaterThan(0);
  expect(blur(last.old.filter)).toBeGreaterThan(blur(middle.old.filter));
  expect(blur(middle.next.filter), middle.next.filter).toBeGreaterThan(0);
  expect(blur(first.next.filter)).toBeGreaterThan(blur(middle.next.filter));
  expect(middle.old.opacity).toBeGreaterThan(0);
  expect(middle.old.opacity).toBeLessThan(1);
  expect(middle.old.opacity + middle.next.opacity).toBeCloseTo(1);
  expect([first.old.opacity, first.next.opacity, last.old.opacity, last.next.opacity]).toEqual([
    1, 0, 0, 1,
  ]);
  expect(last.next.filter).toMatch(/^(none|blur\(0px\))$/);
});
