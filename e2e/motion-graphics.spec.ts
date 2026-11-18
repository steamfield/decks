import { expect, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import { test } from "./fixtures/motion.fixture";
import { position, settled, slideNo } from "./fixtures/motion-gallery";

const graphics = ["kinetic-type", "path-follow", "scene-3d"] as const;
type Graphic = (typeof graphics)[number];

async function pose(page: Page, name: Graphic) {
  const active = page.locator("[data-deck-active]");
  if (name === "kinetic-type") {
    const heading = active.getByRole("heading", { name: "Give the last word weight." });
    await expect(heading).toHaveAttribute("aria-label", "Give the last word weight.");
    return heading.evaluate((element) => {
      const words = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const result: [number, string][] = [];
      for (let node = words.nextNode(); node; node = words.nextNode()) {
        if (!node.textContent?.trim() || !node.parentElement) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        result.push([
          range.getBoundingClientRect().top,
          getComputedStyle(node.parentElement).color,
        ]);
      }
      return result;
    });
  }
  if (name === "path-follow") {
    const route = active.getByRole("img", { name: "Two legs of the route" });
    const { marker, samples, separation } = await route.evaluate((svg) => {
      const click = Number(new URLSearchParams(location.hash.split("?")[1]).get("clicks"));
      const path = svg.querySelector("path");
      const dot = svg.querySelector("circle");
      const matrix = path?.getScreenCTM();
      if (!path || !dot || !matrix) throw new Error("Missing route or marker");
      const box = svg.getBoundingClientRect(),
        circle = dot.getBoundingClientRect();
      const samples = [0.25, 0.75].map((t) => {
        const p = path.getPointAtLength(t * path.getTotalLength()).matrixTransform(matrix);
        return [Math.round(p.x - box.left), Math.round(p.y - box.top)] as const;
      });
      const tip = path
        .getPointAtLength((path.getTotalLength() * click) / 2)
        .matrixTransform(matrix);
      return {
        marker: [circle.x - box.left, circle.y - box.top],
        samples,
        separation: Math.hypot(
          circle.x + circle.width / 2 - tip.x,
          circle.y + circle.height / 2 - tip.y,
        ),
      };
    });
    expect(separation).toBeLessThan(1);
    const image = PNG.sync.read(await route.screenshot());
    const painted = samples.map(([x, y]) => {
      const i = 4 * (y * image.width + x);
      return image.data.readUInt8(i + 1) > image.data.readUInt8(i) + 30;
    });
    return [...marker, ...painted];
  }
  const host = active.getByRole("img", { name: "Three studio forms" });
  const instant = (await page.locator("html").getAttribute("data-deck-motion")) === "instant";
  await expect(host.locator(instant ? "svg" : "canvas")).toBeVisible();
  const { width, height, data } = PNG.sync.read(await host.screenshot());
  const pigments = [
    (r: number, g: number, b: number) => g > r + 30 && g > b + 12,
    (r: number, g: number, b: number) => r > 100 && g >= r && b >= g && b - r < 45,
    (r: number, g: number, b: number) => r > b + 48 && r > g + 10,
  ];
  return pigments.map((matches, form) => {
    let left = width,
      right = -1,
      top = height,
      bottom = -1;
    for (let y = 0; y < height; y++)
      for (let x = 0; x < width; x++) {
        const index = 4 * (y * width + x);
        const r = data.readUInt8(index),
          g = data.readUInt8(index + 1),
          b = data.readUInt8(index + 2);
        if (matches(r, g, b)) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    expect(right).toBeGreaterThan(left);
    if (form === 2) {
      const face = (fraction: number) => {
        const x = Math.round(left + fraction * (right - left));
        return data.readUInt8(4 * (Math.round((top + bottom) / 2) * width + x));
      };
      const faces = [face(0.02), face(0.5), face(0.98)];
      expect(Math.max(...faces) - Math.min(...faces)).toBeGreaterThan(15);
    }
    // Units are percent of the viewport. A lit solid and its SVG projection have different edges.
    return [
      ((left + right) * 50) / width,
      ((top + bottom) * 50) / height,
      ((right - left) * 100) / width,
      ((bottom - top) * 100) / height,
    ];
  });
}

async function step(page: Page, no: number, key: string, click: number) {
  await page.keyboard.press(key);
  await position(page, no, click);
  await settled(page, no, click);
}

for (const name of graphics) {
  test(`kinetic type, path follow and scene slides land on the same pose by clicking live and by loading at the click with motion instant: ${name}`, async ({
    page,
    browser,
  }) => {
    const no = slideNo(name);
    await page.goto(`/#/${no}`);
    await position(page, no);
    if (name === "scene-3d")
      await expect(
        page.getByRole("img", { name: "Three studio forms" }).locator("canvas"),
      ).toBeVisible();
    const instant = await browser.newPage({ viewport: page.viewportSize() ?? undefined });
    try {
      for (const click of [0, 1, 2]) {
        if (click) await step(page, no, "ArrowRight", click);
        if (name === "scene-3d" && click !== 2) continue;
        await instant.goto(
          new URL(`/?motion=instant#/${no}${click ? `?clicks=${click}` : ""}`, page.url()).href,
        );
        await position(instant, no, click);
        await settled(instant, no, click);
        const live = await pose(page, name),
          still = await pose(instant, name);
        if (name === "path-follow") expect(live.slice(-2)).toEqual([click >= 1, click === 2]);
        if (name === "scene-3d") {
          for (const [index, value] of live.flat().entries())
            expect(Number(value)).toBeCloseTo(Number(still.flat()[index]), 0);
        } else expect(still).toEqual(live);
      }
    } finally {
      await instant.close();
    }
  });

  test(`each of slides 47-49 forward, back, two quick clicks and reload at the last click: ${name}`, async ({
    page,
    deck,
  }) => {
    const no = slideNo(name);
    await deck.goto(no);
    const start = await pose(page, name);
    await step(page, no, "ArrowRight", 1);
    const middle = await pose(page, name);
    expect(middle).not.toEqual(start);
    await step(page, no, "ArrowRight", 2);
    const end = await pose(page, name);
    expect(end).not.toEqual(middle);
    await step(page, no, "ArrowLeft", 1);
    expect(await pose(page, name)).toEqual(middle);
    await step(page, no, "ArrowLeft", 0);
    expect(await pose(page, name)).toEqual(start);
    await page.keyboard.press("ArrowRight");
    await step(page, no, "ArrowRight", 2);
    expect(await pose(page, name)).toEqual(end);
    if (name === "path-follow")
      await page.addInitScript(() => {
        const record = () => {
          const route = document.querySelector(
            '[data-deck-active] svg[aria-label="Two legs of the route"]',
          );
          const path = route?.querySelector("path"),
            marker = route?.querySelector("circle");
          if (!path || !marker) {
            requestAnimationFrame(record);
            return;
          }
          const tip = path.getPointAtLength(path.getTotalLength());
          const drawn = Number.parseFloat(getComputedStyle(path).strokeDasharray);
          const matrix = marker.transform.baseVal.consolidate()?.matrix;
          Reflect.set(
            window,
            "firstRouteComplete",
            !!matrix &&
              Math.hypot(matrix.e - tip.x, matrix.f - tip.y) < 1 &&
              Math.abs(drawn - path.getTotalLength()) < 1,
          );
        };
        requestAnimationFrame(record);
      });
    await page.reload();
    await position(page, no, 2);
    if (name === "path-follow")
      await expect
        .poll(() => page.evaluate(() => Reflect.get(window, "firstRouteComplete")))
        .toBe(true);
    expect(await pose(page, name)).toEqual(end);
  });
}

test("words emerge in reading order and a third quick press leaves a complete heading on return", async ({
  page,
  motionClock,
}) => {
  const no = slideNo("kinetic-type");
  await page.goto(`/#/${no}`);
  const heading = page.getByRole("heading", { name: "Give the last word weight." });
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
  expect(await heights()).toEqual(moving);
  await page.clock.resume();
  await page.keyboard.press("ArrowRight");
  await position(page, slideNo("path-follow"));
  await settled(page, slideNo("path-follow"), 0);
  await page.keyboard.press("ArrowLeft");
  await position(page, no, 2);
  await settled(page, no, 2);
  await expect(heading).toHaveAccessibleName("Give the last word weight.");
});
