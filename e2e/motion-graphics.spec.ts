import { expect, type Locator, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import { test } from "./fixtures/motion.fixture";
import { position, settled, slideNo } from "./fixtures/motion-gallery";

const kinetic = slideNo("kinetic-type");
const pathFollow = slideNo("path-follow");
const orbit = slideNo("scene-3d");
const headline = "Give the last word weight.";
const words = ["Give", "the", "last", "word", "weight."];

async function step(page: Page, no: number, key: string, click: number) {
  await page.keyboard.press(key);
  await position(page, no, click);
  await settled(page, no, click);
}

/**
 * How each word of the headline paints: "hidden" while its mask clips it, "accent" in the gallery
 * accent, "ink" otherwise. A word's screenshot is its masked box, so a clipped word is blank.
 */
async function wordPaint(page: Page) {
  const heading = page.getByRole("heading", { name: headline });
  await expect(heading).toBeVisible();
  const paints = [];
  for (const word of words) {
    const image = PNG.sync.read(await heading.getByText(word, { exact: true }).screenshot());
    const pixels = Array.from({ length: image.data.length / 4 }, (_, i) =>
      Array.from(image.data.subarray(4 * i, 4 * i + 3)),
    );
    const accent = pixels.some(([r = 0, g = 0]) => g > r + 60);
    const ink = pixels.some(([r = 0, g = 0, b = 0]) => r > 150 && Math.abs(g - r) < 30 && b > 120);
    paints.push(accent ? "accent" : ink ? "ink" : "hidden");
  }
  return paints;
}

const masked = ["hidden", "hidden", "hidden", "hidden", "hidden"];
const entered = ["ink", "ink", "ink", "ink", "ink"];
const emphasised = ["ink", "ink", "ink", "ink", "accent"];

test("kinetic type reveals every word on the first click and turns only the last word to the accent on the second", async ({
  page,
  deck,
}) => {
  await deck.goto(kinetic);
  await expect.poll(() => wordPaint(page)).toEqual(masked);
  await step(page, kinetic, "ArrowRight", 1);
  await expect.poll(() => wordPaint(page)).toEqual(entered);
  await step(page, kinetic, "ArrowRight", 2);
  await expect.poll(() => wordPaint(page)).toEqual(emphasised);
  await step(page, kinetic, "ArrowLeft", 1);
  await expect.poll(() => wordPaint(page)).toEqual(entered);
  await step(page, kinetic, "ArrowLeft", 0);
  await expect.poll(() => wordPaint(page)).toEqual(masked);
});

test("kinetic type loaded at its last click with motion instant shows the emphasised headline", async ({
  page,
}) => {
  await page.goto(`/?motion=instant#/${kinetic}?clicks=2`);
  await position(page, kinetic, 2);
  await settled(page, kinetic, 2);
  await expect.poll(() => wordPaint(page)).toEqual(emphasised);
});

const route = (page: Page) =>
  page.locator("[data-deck-active]").getByRole("img", { name: "Two legs of the route" });

/**
 * The marker's distance from the drawn tip of the route at `click` (half the route per click),
 * and whether paint reaches a quarter and three quarters of the way along it.
 */
async function routePose(page: Page, click: number) {
  // The route and its marker are decorative parts of the named image, found by tag inside it.
  const { separation, samples } = await route(page).evaluate((svg, click) => {
    const path = svg.querySelector("path");
    const dot = svg.querySelector("circle");
    const matrix = path?.getScreenCTM();
    if (!path || !dot || !matrix) throw new Error("Missing route or marker");
    const box = svg.getBoundingClientRect();
    const circle = dot.getBoundingClientRect();
    const at = (t: number) =>
      path.getPointAtLength(t * path.getTotalLength()).matrixTransform(matrix);
    const tip = at(click / 2);
    return {
      separation: Math.hypot(
        circle.x + circle.width / 2 - tip.x,
        circle.y + circle.height / 2 - tip.y,
      ),
      samples: [0.25, 0.75].map((t) => [
        Math.round(at(t).x - box.left),
        Math.round(at(t).y - box.top),
      ]),
    };
  }, click);
  const image = PNG.sync.read(await route(page).screenshot());
  const painted = samples.map(([x = 0, y = 0]) => {
    const i = 4 * (y * image.width + x);
    return image.data.readUInt8(i + 1) > image.data.readUInt8(i) + 30;
  });
  return { markerOnTip: separation < 1, painted };
}

test("the path-follow marker sits on the drawn tip at every click going forward and back", async ({
  page,
  deck,
}) => {
  await deck.goto(pathFollow);
  await expect
    .poll(() => routePose(page, 0))
    .toEqual({ markerOnTip: true, painted: [false, false] });
  await step(page, pathFollow, "ArrowRight", 1);
  await expect
    .poll(() => routePose(page, 1))
    .toEqual({ markerOnTip: true, painted: [true, false] });
  await step(page, pathFollow, "ArrowRight", 2);
  await expect.poll(() => routePose(page, 2)).toEqual({ markerOnTip: true, painted: [true, true] });
  await step(page, pathFollow, "ArrowLeft", 1);
  await expect
    .poll(() => routePose(page, 1))
    .toEqual({ markerOnTip: true, painted: [true, false] });
});

test("path follow loaded at click 1 with motion instant shows the first leg with the marker at its end", async ({
  page,
}) => {
  await page.goto(`/?motion=instant#/${pathFollow}?clicks=1`);
  await position(page, pathFollow, 1);
  await settled(page, pathFollow, 1);
  await expect
    .poll(() => routePose(page, 1))
    .toEqual({ markerOnTip: true, painted: [true, false] });
});

test("reloading path follow at its last click shows the complete route on every frame", async ({
  page,
  deck,
}) => {
  await deck.goto(pathFollow, 2);
  await page.addInitScript(() => {
    const frames: boolean[] = [];
    Reflect.set(window, "routeFrames", frames);
    const record = () => {
      const svg = document.querySelector(
        '[data-deck-active] svg[aria-label="Two legs of the route"]',
      );
      const path = svg?.querySelector("path");
      const marker = svg?.querySelector("circle");
      const matrix = marker?.transform.baseVal.consolidate()?.matrix;
      if (path && matrix) {
        const tip = path.getPointAtLength(path.getTotalLength());
        const drawn = Number.parseFloat(getComputedStyle(path).strokeDasharray);
        frames.push(
          Math.hypot(matrix.e - tip.x, matrix.f - tip.y) < 1 &&
            Math.abs(drawn - path.getTotalLength()) < 1,
        );
      }
      requestAnimationFrame(record);
    };
    requestAnimationFrame(record);
  });
  await page.reload();
  await position(page, pathFollow, 2);
  await settled(page, pathFollow, 2);
  const frames: boolean[] = await page.evaluate(() => Reflect.get(window, "routeFrames"));
  expect(frames).not.toHaveLength(0);
  expect(frames).not.toContain(false);
  await expect.poll(() => routePose(page, 2)).toEqual({ markerOnTip: true, painted: [true, true] });
});

const studio = (page: Page) =>
  page.locator("[data-deck-active]").getByRole("img", { name: "Three studio forms" });

/**
 * Finds the sphere (emerald), ring (slate) and cube (amber) by pigment in a screenshot of the
 * scene. Returns their centres' order left to right and how much the cube's shading varies across
 * its middle row, which only a turned cube (two faces in view) does by more than 15.
 */
async function studioLayout(host: Locator) {
  const { width, height, data } = PNG.sync.read(await host.screenshot());
  const pigments = {
    sphere: (r: number, g: number, b: number) => g > r + 30 && g > b + 12,
    ring: (r: number, g: number, b: number) => r > 100 && g >= r && b >= g && b - r < 45,
    cube: (r: number, g: number, b: number) => r > b + 48 && r > g + 10,
  };
  const bounds = Object.entries(pigments).map(([form, matches]) => {
    const box = { form, left: width, right: -1, top: height, bottom: -1 };
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const i = 4 * (y * width + x);
        if (!matches(data.readUInt8(i), data.readUInt8(i + 1), data.readUInt8(i + 2))) continue;
        box.left = Math.min(box.left, x);
        box.right = Math.max(box.right, x);
        box.top = Math.min(box.top, y);
        box.bottom = Math.max(box.bottom, y);
      }
    return box;
  });
  const cube = bounds[2];
  if (!cube || cube.right < cube.left) throw new Error("The cube is not painted");
  const row = Math.round((cube.top + cube.bottom) / 2);
  const shade = (fraction: number) =>
    data.readUInt8(4 * (row * width + Math.round(cube.left + fraction * (cube.right - cube.left))));
  const faces = [shade(0.02), shade(0.5), shade(0.98)];
  return {
    order: bounds
      .filter((box) => box.right > box.left)
      .sort((a, b) => a.left + a.right - (b.left + b.right))
      .map((box) => box.form),
    turned: Math.max(...faces) - Math.min(...faces) > 15,
  };
}

const orbited = { order: ["sphere", "ring", "cube"], turned: true };

test("the live orbit ends with the sphere, ring and cube in a row and the cube's side in view", async ({
  page,
  deck,
}) => {
  await deck.goto(orbit);
  // The live canvas is a presentational child of the named image.
  await expect(studio(page).locator("canvas")).toBeVisible();
  await step(page, orbit, "ArrowRight", 1);
  await step(page, orbit, "ArrowRight", 2);
  await expect.poll(() => studioLayout(studio(page))).toEqual(orbited);
  await page.reload();
  await position(page, orbit, 2);
  await settled(page, orbit, 2);
  await expect(studio(page).locator("canvas")).toBeVisible();
  await expect.poll(() => studioLayout(studio(page))).toEqual(orbited);
});

test("the orbit loaded with motion instant shows the poster's sphere, ring and turned cube", async ({
  page,
}) => {
  await page.goto(`/?motion=instant#/${orbit}?clicks=2`);
  await position(page, orbit, 2);
  await settled(page, orbit, 2);
  // The poster is a presentational child of the named image.
  await expect(studio(page).locator("svg")).toBeVisible();
  await expect.poll(() => studioLayout(studio(page))).toEqual(orbited);
});

test("words emerge in reading order and a third quick press leaves a complete heading on return", async ({
  page,
  motionClock,
}) => {
  await page.goto(`/#/${kinetic}`);
  const heading = page.getByRole("heading", { name: headline });
  await expect(heading).toBeVisible();
  await motionClock.pauseAt();
  const image = PNG.sync.read(await heading.screenshot());
  expect(image.data.some((red, i) => i % 4 === 0 && red > 150)).toBe(false);
  const heights = () =>
    heading.evaluate((h) => {
      const nodes = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
      const ys: number[] = [];
      for (let node = nodes.nextNode(); node; node = nodes.nextNode()) {
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        ys.push(range.getBoundingClientRect().top);
      }
      return ys;
    });
  const before = await heights();
  await page.keyboard.press("ArrowRight");
  await motionClock.step(120);
  const moving = await heights();
  expect(moving[0]).toBeLessThan(before[0] ?? 0);
  expect(moving.at(-1)).toBe(before.at(-1));
  await page.keyboard.press("ArrowRight");
  await position(page, kinetic, 2);
  expect(await heights()).toEqual(moving);
  await page.clock.resume();
  await page.keyboard.press("ArrowRight");
  await position(page, pathFollow);
  await settled(page, pathFollow, 0);
  await page.keyboard.press("ArrowLeft");
  await position(page, kinetic, 2);
  await settled(page, kinetic, 2);
  await expect(heading).toHaveAccessibleName(headline);
});
