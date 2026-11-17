import { expect, type Locator } from "@playwright/test";
import { PNG } from "pngjs";
import { settled } from "./fixtures/deck-driver";
import { test } from "./fixtures/motion.fixture";
import { slideNo } from "./fixtures/motion-gallery";
import { expectMonotone, record } from "./fixtures/motion-recorder";

const no = slideNo("mark");
const words = ["Underline", "Circle", "Box", "Strike", "Cross", "Bracket"];

async function expectOffset(root: Locator, offset: string) {
  const paths = root.locator('path[pathLength="1"]');
  expect(await paths.count()).toBeGreaterThan(0);
  for (const path of await paths.all()) await expect(path).toHaveCSS("stroke-dashoffset", offset);
}

async function underlineColumns(mark: Locator) {
  const image = PNG.sync.read(await mark.screenshot());
  return Array.from({ length: image.width }, (_, x) => {
    for (let y = Math.floor(image.height * 0.9); y < image.height; y++) {
      if ((image.data[(y * image.width + x) * 4] ?? 0) > 128) return true;
    }
    return false;
  });
}

async function setMarkSizes(root: Locator, sizes: { width: number; height: number }[]) {
  const marks = root.locator("[data-step-state]");
  await expect(marks).toHaveCount(sizes.length);
  for (const [index, size] of sizes.entries()) {
    await marks.nth(index).evaluate((element, size) => {
      if (!(element instanceof HTMLElement)) throw new Error("Expected an HTML mark");
      element.style.width = `${size.width}px`;
      element.style.height = `${size.height}px`;
    }, size);
  }
}

function pathData(root: Locator) {
  return root
    .locator("[data-step-state] path")
    .evaluateAll((paths) => paths.map((path) => path.getAttribute("d")));
}

async function pauseStroke(mark: Locator, key: string, fraction: number) {
  const pending = await mark.evaluateHandle((root) => {
    const path = root.querySelector("path");
    if (!path) throw new Error("Missing mark path");
    return {
      ready: new Promise<Animation>((resolve, reject) =>
        path.addEventListener(
          "transitionrun",
          () => {
            const animation = path
              .getAnimations()
              .find(
                (animation) =>
                  animation instanceof CSSTransition &&
                  animation.transitionProperty === "stroke-dashoffset",
              );
            if (!animation) {
              reject(new Error("Missing stroke transition"));
              return;
            }
            animation.pause();
            resolve(animation);
          },
          { once: true },
        ),
      ),
    };
  });
  await mark.page().keyboard.press(key);
  const animation = await pending.evaluateHandle((state) => state.ready);
  await pending.dispose();
  await animation.evaluate((animation, fraction) => {
    const end = animation.effect?.getComputedTiming().endTime;
    if (typeof end !== "number") throw new Error("Missing stroke duration");
    animation.currentTime = end * fraction;
  }, fraction);
  return animation;
}

async function resizeStroke(mark: Locator, pose: string) {
  const path = mark.locator("path").first();
  const previous = await path.getAttribute("d");
  await mark.evaluate((root) => {
    if (!(root instanceof HTMLElement)) throw new Error("Expected an HTML mark");
    root.style.width = `${root.offsetWidth + 40}px`;
  });
  await expect(path).not.toHaveAttribute("d", previous ?? "");
  await expect(path).toHaveCSS("stroke-dashoffset", pose);
}

async function expectShape(mark: Locator, word: string) {
  const points = await mark.evaluate((root) => {
    if (!(root instanceof HTMLElement)) throw new Error("Expected an HTML mark");
    return Array.from(root.querySelectorAll("path")).flatMap((path) =>
      Array.from({ length: 32 }, (_, index) => {
        const point = path.getPointAtLength((path.getTotalLength() * index) / 32);
        return { x: point.x / root.offsetWidth, y: point.y / root.offsetHeight };
      }),
    );
  });
  expect(points.length).toBeGreaterThan(0);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.9);
  if (word === "Underline" || word === "Strike") {
    expect(Math.max(...ys) - Math.min(...ys)).toBeLessThan(0.1);
    expect(points.every(({ y }) => Math.abs(y - (word === "Underline" ? 0.95 : 0.5)) < 0.05)).toBe(
      true,
    );
  } else if (word === "Cross") {
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(0.9);
    expect(points.every(({ x, y }) => Math.min(Math.abs(x - y), Math.abs(x + y - 1)) < 0.05)).toBe(
      true,
    );
  } else {
    expect(Math.min(...xs)).toBeLessThan(0);
    expect(Math.max(...xs)).toBeGreaterThan(1);
    expect(Math.min(...ys)).toBeLessThan(0);
    expect(Math.max(...ys)).toBeGreaterThan(1);
    if (word === "Bracket") expect(points.every(({ x }) => x < 0.05 || x > 0.95)).toBe(true);
    else {
      const left = Math.min(...xs),
        right = Math.max(...xs),
        top = Math.min(...ys),
        bottom = Math.max(...ys);
      const normalized = points.map(({ x, y }) => ({
        x: (x - left) / (right - left),
        y: (y - top) / (bottom - top),
      }));
      if (word === "Circle")
        expect(
          normalized.every(({ x, y }) => Math.abs((2 * x - 1) ** 2 + (2 * y - 1) ** 2 - 1) < 0.2),
        ).toBe(true);
      else expect(normalized.every(({ x, y }) => Math.min(x, 1 - x, y, 1 - y) < 0.05)).toBe(true);
    }
  }
}

test("The underline paints nothing before its click and a continuous stroke afterward.", async ({
  page,
}) => {
  await page.goto(`/#/${no}`);
  const mark = page.locator("[data-deck-active]").getByText("Underline", { exact: true });
  await expect(mark).toBeVisible();
  await settled(page);
  expect((await underlineColumns(mark)).some(Boolean)).toBe(false);
  await page.keyboard.press("ArrowRight");
  await settled(page);
  expect((await underlineColumns(mark)).slice(2, -2).every(Boolean)).toBe(true);
});

test("Each mark draws on its click, un-draws backward, and keeps its text visible.", async ({
  page,
}) => {
  await page.goto(`/#/${no}`);
  await settled(page);
  const slide = page.locator("[data-deck-active]");
  for (const [index, word] of words.entries()) {
    const mark = slide.getByText(word, { exact: true });
    await expect(mark).toBeVisible();
    const paths = mark.locator("path");
    await expect.poll(() => paths.count()).toBeGreaterThan(0);
    await expectShape(mark, word);
    await expect(mark.locator("svg")).toHaveAttribute("aria-hidden", "true");
    for (const path of await paths.all()) {
      await expect(path).toHaveAttribute("d", /^M/);
      await expect(path).toHaveAttribute("pathLength", "1");
      await expect(path).toHaveAttribute("fill", "none");
      await expect(path).toHaveAttribute(
        "stroke",
        index === 5 ? "var(--gallery-accent)" : "currentColor",
      );
    }
    await expectOffset(mark, "1px");
    const drawing = await record(mark.locator("path").first(), (element) =>
      Number.parseFloat(getComputedStyle(element).strokeDashoffset),
    );
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(new RegExp(`clicks=${index + 1}$`));
    expectMonotone(await drawing.log(), 1, 0);
    await expectOffset(mark, "0px");
    await page.keyboard.press("ArrowLeft");
    await settled(page);
    await expectOffset(mark, "1px");
    await expect(mark).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await settled(page);
  }
});

test("A circle keeps its drawing pose through resizing and reversal under CPU load.", async ({
  page,
  context,
}) => {
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  await page.goto(`/#/${no}?clicks=1`);
  await settled(page);
  const circle = page.locator("[data-deck-active]").getByText("Circle", { exact: true });
  await expect(circle).toBeVisible();
  const path = circle.locator("path").first();
  const drawing = await pauseStroke(circle, "ArrowRight", 0.4);
  const pose = await path.evaluate((path) => getComputedStyle(path).strokeDashoffset);
  expect(Number.parseFloat(pose)).toBeGreaterThan(0);
  expect(Number.parseFloat(pose)).toBeLessThan(1);
  await resizeStroke(circle, pose);
  const erasing = await pauseStroke(circle, "ArrowLeft", 0);
  await expect(path).toHaveCSS("stroke-dashoffset", pose);
  await resizeStroke(circle, pose);
  const redrawing = await pauseStroke(circle, "ArrowRight", 0);
  await expect(path).toHaveCSS("stroke-dashoffset", pose);
  await page.keyboard.press("ArrowRight");
  await redrawing.evaluate((animation) => animation.finish());
  await Promise.all([drawing.dispose(), erasing.dispose(), redrawing.dispose()]);
  await expect(page).toHaveURL(new RegExp(`#/${no}\\?clicks=3$`));
  await settled(page);
  await expectOffset(circle, "0px");
  await expect(circle).toBeVisible();
});

test("Presenter and preview snap to their clicks, and equal boxes keep paths across contexts.", async ({
  page,
}) => {
  await page.goto(`/#/${no}?clicks=2`);
  await settled(page);
  const live = page.locator("[data-deck-active]");
  await expect(live.getByText("Circle", { exact: true })).toBeVisible();
  await expect.poll(async () => (await pathData(live)).length).toBeGreaterThan(0);
  const data = await pathData(live);
  const sizes = await live.locator("[data-step-state]").evaluateAll((marks) =>
    marks.map((mark) => {
      if (!(mark instanceof HTMLElement)) throw new Error("Expected an HTML mark");
      return { width: mark.offsetWidth, height: mark.offsetHeight };
    }),
  );
  const opened = page.waitForEvent("popup");
  await page.keyboard.press("p");
  const presenter = await opened;
  const current = presenter.getByRole("region", { name: "Current slide" });
  const preview = presenter.getByRole("region", { name: "Next", exact: true });
  await expect(current.getByText("Circle", { exact: true })).toBeVisible();
  await expect(preview.getByText("Box", { exact: true })).toBeVisible();
  await expectOffset(current.getByText("Circle", { exact: true }), "0px");
  await expectOffset(current.getByText("Box", { exact: true }), "1px");
  await expectOffset(preview.getByText("Box", { exact: true }), "0px");
  for (const root of [current, preview]) {
    await setMarkSizes(root, sizes);
    for (const path of await root.locator("[data-step-state] path").all())
      await expect(path).toHaveCSS("transition-duration", "0s");
    await expect.poll(() => pathData(root)).toEqual(data);
  }
  await presenter.keyboard.press("o");
  const overview = presenter.locator(`[data-deck-context="overview"][data-deck-slide="${no}"]`);
  await expect(overview.getByText("Bracket", { exact: true })).toBeVisible();
  await setMarkSizes(overview, sizes);
  await expectOffset(overview, "0px");
  await expect.poll(() => pathData(overview)).toEqual(data);
  await presenter.close();
  await page.goto("/?print=final#/print");
  const print = page.locator(`[data-deck-context="print"][data-deck-slide="${no}"]`);
  await expect(print.getByText("Bracket", { exact: true })).toBeVisible();
  await setMarkSizes(print, sizes);
  await expectOffset(print, "0px");
  await expect.poll(() => pathData(print)).toEqual(data);
});

test("A drawn box surrounds its word after a 16:9 to 4:3 resize, including instant motion.", async ({
  page,
}) => {
  await page.goto(`/?motion=instant#/${no}?clicks=3`);
  await settled(page);
  const box = page.locator("[data-deck-active]").getByText("Box", { exact: true });
  await expect(box).toBeVisible();
  for (const viewport of [
    { width: 1920, height: 1080 },
    { width: 1200, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await settled(page);
    await expectOffset(box, "0px");
    await expect(box.locator("path")).toHaveCSS("transition-duration", "0s");
    await expectShape(box, "Box");
  }
});
