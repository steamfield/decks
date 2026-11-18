import { expect, type Locator } from "@playwright/test";
import { startSettling } from "./fixtures/deck-driver";
import { test } from "./fixtures/motion.fixture";
import { position, slideNo } from "./fixtures/motion-gallery";

const camera = slideNo("camera");
const morph = slideNo("shape-morph");
const mapName = "River route from the spring to the harbour";
const shapeName = "A circle becomes a square and then a star";
const circle = "M200 50a150 150 0 1 1 0 300a150 150 0 1 1 0 -300Z";
const square = "M50 50H350V350H50Z";
const star = "M200 30L244 147L370 151L270 230L306 352L200 280L94 352L130 230L30 151L156 147Z";

function framing(svg: Locator) {
  return svg.evaluate((svg) => {
    const inner = svg.parentElement;
    const viewport = inner?.parentElement;
    if (!inner || !viewport) throw new Error("Missing map viewport");
    const matrix = new DOMMatrixReadOnly(getComputedStyle(inner).transform);
    return {
      x: (viewport.clientWidth / 2 - matrix.e) / matrix.a,
      y: (viewport.clientHeight / 2 - matrix.f) / matrix.d,
      zoom: matrix.a,
    };
  });
}

test("one click forward in the live slide tweens the camera transform and ends at the target", async ({
  page,
  deck,
  motionClock,
}) => {
  await deck.goto(camera, 1);
  const map = page.getByRole("img", { name: mapName });
  await motionClock.pauseAt();
  await deck.press("ArrowRight");
  await motionClock.step(300);
  const middle = await framing(map);
  expect(middle.zoom).toBeGreaterThan(1.5);
  expect(middle.zoom).toBeLessThan(2);
  await motionClock.settle();
  expect(await framing(map)).toEqual({ x: 250, y: 200, zoom: 2 });
});

test("one click back tweens back", async ({ page, deck, motionClock }) => {
  await deck.goto(camera, 2);
  const map = page.getByRole("img", { name: mapName });
  await motionClock.pauseAt();
  await deck.press("ArrowLeft");
  await motionClock.step(300);
  const middle = await framing(map);
  expect(middle.zoom).toBeGreaterThan(1);
  expect(middle.zoom).toBeLessThan(1.5);
  await motionClock.settle();
  expect(await framing(map)).toEqual({ x: 600, y: 300, zoom: 1 });
});

test("a second click mid-tween continues from the visible position without a jump", async ({
  page,
  deck,
  motionClock,
}) => {
  await deck.goto(camera, 1);
  const map = page.getByRole("img", { name: mapName });
  await motionClock.pauseAt();
  await deck.press("ArrowRight");
  await motionClock.step(256);
  const visible = await framing(map);
  expect(visible.zoom).toBeGreaterThan(1.5);
  await deck.press("ArrowRight");
  expect(await framing(map)).toEqual(visible);
  await motionClock.step(32);
  const nextFrame = await framing(map);
  expect(nextFrame.zoom).toBeLessThan(visible.zoom);
  expect(nextFrame.zoom).toBeGreaterThan(1.5);
  await motionClock.settle();
  expect(await framing(map)).toEqual({ x: 950, y: 350, zoom: 1.5 });
});

test("camera slide forward, back, two quick clicks and reload at the last click give the expected transform", async ({
  page,
  deck,
  motionClock,
}) => {
  await page.addInitScript(() => {
    const frame = () => {
      const map = document.querySelector(
        "[data-deck-active] svg[aria-label='River route from the spring to the harbour']",
      );
      const layer = map?.parentElement;
      const viewport = layer?.parentElement;
      if (!layer || !viewport) return requestAnimationFrame(frame);
      const m = new DOMMatrixReadOnly(getComputedStyle(layer).transform);
      Reflect.set(window, "firstCameraPose", [
        (viewport.clientWidth / 2 - m.e) / m.a,
        (viewport.clientHeight / 2 - m.f) / m.d,
        m.a,
      ]);
    };
    requestAnimationFrame(frame);
  });
  const map = page.getByRole("img", { name: mapName });
  await deck.goto(camera, 1);
  await motionClock.pauseAt();
  const initial = { x: 600, y: 300, zoom: 1 };
  const spring = { x: 250, y: 200, zoom: 2 };
  const harbour = { x: 950, y: 350, zoom: 1.5 };
  await expect.poll(() => framing(map)).toEqual(initial);
  await deck.press("ArrowRight");
  await motionClock.settle();
  await expect.poll(() => framing(map)).toEqual(spring);
  await deck.press("ArrowLeft");
  await motionClock.settle();
  await expect.poll(() => framing(map)).toEqual(initial);
  await deck.press("ArrowRight");
  await motionClock.step(128);
  const visible = await framing(map);
  expect(visible.zoom).toBeGreaterThan(1);
  expect(visible.zoom).toBeLessThan(2);
  await deck.press("ArrowRight");
  await position(page, camera, 3);
  expect(await framing(map)).toEqual(visible);
  await motionClock.settle();
  await expect.poll(() => framing(map)).toEqual(harbour);
  await page.clock.resume();
  await page.reload();
  await position(page, camera, 3);
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "firstCameraPose")))
    .toEqual([950, 350, 1.5]);
});

function springOffset(map: Locator) {
  return map.evaluate((svg) => {
    const spring = svg.querySelector("circle")?.getBoundingClientRect();
    const box = svg.parentElement?.parentElement?.getBoundingClientRect();
    if (!box || !spring) throw new Error("Missing spring marker");
    return [
      Math.round(spring.x + spring.width / 2) - Math.round(box.x + box.width / 2),
      Math.round(spring.y + spring.height / 2) - Math.round(box.y + box.height / 2),
    ];
  });
}

test("tabbing to an offscreen marker keeps the current stop centred", async ({ page, deck }) => {
  await deck.goto(camera, 2);
  const map = page.getByRole("img", { name: mapName });
  const harbour = map.locator("circle").last();
  await harbour.evaluate((marker) => marker.setAttribute("tabindex", "0"));
  await expect.poll(() => springOffset(map)).toEqual([0, 0]);
  await page.keyboard.press("Tab");
  await expect(harbour).toBeFocused();
  await expect.poll(() => springOffset(map)).toEqual([0, 0]);
});

test("a resize keeps the stop's point at the viewport centre", async ({ page, deck }) => {
  await deck.goto(camera, 2);
  const map = page.getByRole("img", { name: mapName });
  const viewport = map.locator("../..");
  await expect(viewport).toHaveCSS("overflow", "clip");
  await viewport.evaluate((viewport) => {
    const parent = viewport.parentElement;
    if (!parent) throw new Error("Missing gallery container");
    parent.style.width = "900px";
    parent.style.height = "420px";
  });
  await expect(viewport).toHaveCSS("width", "900px");
  await expect(viewport).toHaveCSS("height", "420px");
  await expect.poll(() => framing(map)).toEqual({ x: 250, y: 200, zoom: 2 });
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect.poll(() => springOffset(map)).toEqual([0, 0]);
});

for (const [name, no, click] of [
  ["camera", camera, 1],
  ["morph", morph, 0],
] as const) {
  test(`settled waits for a running camera or morph tween (${name})`, async ({
    page,
    deck,
    motionClock,
  }) => {
    await deck.goto(no, click);
    await motionClock.pauseAt();
    await deck.press("ArrowRight");
    await position(page, no, click + 1);
    const completion = await startSettling(page);
    try {
      await motionClock.step(160);
      expect(await completion.evaluate((state) => state.done)).toBe(false);
      await motionClock.step(600);
      expect(await completion.evaluate((state) => state.done)).toBe(true);
    } finally {
      await completion.dispose();
    }
  });
}

test("shape-morph slide forward and back end on the expected path data", async ({ page, deck }) => {
  await deck.goto(morph);
  const outline = page.getByRole("img", { name: shapeName }).locator("path");
  await expect(outline).toHaveCount(1);
  await expect(outline).toHaveAttribute("d", circle);
  for (const [key, d] of [
    ["ArrowRight", square],
    ["ArrowRight", star],
    ["ArrowLeft", square],
    ["ArrowLeft", circle],
  ] as const) {
    await deck.press(key);
    await deck.settled();
    await expect(outline).toHaveAttribute("d", d);
  }
});

test("instant arrival at the last click renders the camera and outline", async ({ page }) => {
  await page.goto(`/?motion=instant#/${camera}?clicks=3`);
  await position(page, camera, 3);
  await expect
    .poll(() => framing(page.getByRole("img", { name: mapName })))
    .toEqual({ x: 950, y: 350, zoom: 1.5 });
  await page.goto(`/?motion=instant#/${morph}?clicks=2`);
  await expect(page.getByRole("img", { name: shapeName }).locator("path")).toHaveAttribute(
    "d",
    star,
  );
});
