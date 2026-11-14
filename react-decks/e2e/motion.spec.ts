import { expect, type Page } from "@playwright/test";
import { test } from "./motion.fixture";

const gallery = [
  ["Motion", 0],
  ["Step / fade", 2],
  ["Step / rise", 2],
  ["Step / drop", 2],
  ["Step / scale", 2],
  ["Step / blur", 2],
  ["Step / wipe", 2],
  ["Steps", 4],
  ["Stagger", 2],
  ["TextReveal / word", 1],
  ["TextReveal / char", 1],
  ["Highlight", 2],
  ["CountUp", 1],
  ["Draw", 2],
  ["useTimeline", 3],
  ["useTween", 1],
  ["Keep moving.", 0],
  ["Change the scale.", 0],
  ["Make a clean cut.", 0],
  ["Follow one idea.", 0],
  ["Give it more room.", 0],
  ["Move within the frame.", 1],
  ["A little motion can stay.", 0],
  ["Types make the boundary readable.", 1],
  ["Follow the state through the store.", 2],
] as const;

async function position(page: Page, no: number, click = 0) {
  const slide = gallery[no - 1];
  if (!slide) throw new Error(`Unknown gallery slide ${no}`);
  await expect(page.getByRole("heading", { name: slide[0], exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`#/${no}${click ? `\\?clicks=${click}` : ""}$`));
}

async function settled(page: Page, no: number, click: number) {
  await page.evaluate(() => window.__deck?.settled());
  if (no === 13)
    await expect(page.locator('[data-deck-active] [aria-hidden="true"]')).toHaveText(
      click ? "1,200" : "0",
    );
  if (no === 15)
    await expect(
      page.getByRole("img", { name: "Three beats move and recolor two shapes" }).locator("g"),
    ).toHaveAttribute("transform", `translate(${140 + click * 320} 260)`);
  if (no === 16)
    await expect(
      page
        .getByRole("img", { name: "A circle grows from radius 48 to 180" })
        .locator("circle")
        .last(),
    ).toHaveAttribute("r", click ? "180" : "48");
}

async function poses(page: Page) {
  const steps = page.locator("[data-deck-active] [data-step-state]");
  const morphs = page
    .locator("[data-deck-active]")
    .getByText(/^(ONE IDEA|ONE CLICK)$/)
    .locator("..");
  return steps.or(morphs).evaluateAll((elements) =>
    elements.map((element) => {
      const style = getComputedStyle(element);
      const box = element.getBoundingClientRect();
      return {
        opacity: style.opacity,
        transform: style.transform,
        filter: style.filter,
        clip: style.clipPath,
        visibility: style.visibility,
        background: element.tagName === "MARK" ? style.backgroundSize : null,
        box: element.hasAttribute("data-step-state")
          ? null
          : { x: box.x, y: box.y, width: box.width, height: box.height },
        stroke:
          element.tagName === "g"
            ? Array.from(element.children, (child) => getComputedStyle(child).strokeDashoffset)
            : null,
      };
    }),
  );
}

test("Each preset starts hidden and settles into its natural pose.", async ({ page }) => {
  for (let no = 2; no <= 7; no++) {
    await page.goto(`/#/${no}`);
    await position(page, no);
    const step = page.locator("[data-deck-active] [data-step-state]");
    if (no === 7) await expect(step).toHaveCSS("clip-path", "inset(0px 100% 0px 0px)");
    else await expect(step).toHaveCSS("opacity", "0");
    await page.keyboard.press("ArrowRight");
    await position(page, no, 1);
    await settled(page, no, 1);
    await expect(step).toHaveCSS("opacity", "1");
    await expect(step).toHaveCSS("transform", "none");
    await expect(step).toHaveCSS("filter", "none");
    await expect(step).toHaveCSS("clip-path", no === 7 ? "inset(0px)" : "none");
    await expect(step).toHaveCSS("visibility", "visible");
  }
});

test("Every gallery click reverses to exactly the poses before it.", async ({ page }) => {
  test.setTimeout(90_000);
  for (let no = 1; no <= gallery.length; no++) {
    const total = gallery[no - 1]?.[1] ?? 0;
    await page.goto(`/#/${no}`);
    for (let click = 0; click < Math.max(total, no < gallery.length ? 1 : 0); click++) {
      await position(page, no, click);
      await settled(page, no, click);
      const before = await poses(page);
      await page.keyboard.press("ArrowRight");
      const target = total ? no : no + 1;
      await position(page, target, total ? click + 1 : 0);
      await settled(page, target, total ? click + 1 : 0);
      await page.keyboard.press("ArrowLeft");
      await position(page, no, click);
      await settled(page, no, click);
      await expect.poll(() => poses(page)).toEqual(before);
      if (click + 1 < total) await page.keyboard.press("ArrowRight");
    }
  }
});

test("Direct instant loads at the last click match settled live arrival on every slide.", async ({
  page,
  context,
}) => {
  test.setTimeout(90_000);
  const instant = await context.newPage();
  await instant.addInitScript(() => {
    const firstFrame = () => {
      if (document.querySelector("[data-deck-active] h1"))
        Reflect.set(
          window,
          "motionFirstMode",
          document.documentElement.getAttribute("data-deck-motion"),
        );
      else requestAnimationFrame(firstFrame);
    };
    requestAnimationFrame(firstFrame);
  });
  await page.goto("/#/1");
  for (let no = 1; no <= gallery.length; no++) {
    const total = gallery[no - 1]?.[1] ?? 0;
    await position(page, no);
    await settled(page, no, 0);
    for (let click = 1; click <= total; click++) {
      await page.keyboard.press("ArrowRight");
      await position(page, no, click);
      await settled(page, no, click);
    }
    const live = await poses(page);
    await instant.goto(`/?motion=instant#/${no}${total ? `?clicks=${total}` : ""}`);
    await position(instant, no, total);
    await expect
      .poll(() => instant.evaluate(() => Reflect.get(window, "motionFirstMode")))
      .toBe("instant");
    await settled(instant, no, total);
    expect(await poses(instant)).toEqual(live);
    await expect(instant.locator("html")).toHaveCSS("--deck-dur-base", "0ms");
    if (no < gallery.length) await page.keyboard.press("ArrowRight");
  }
  await instant.close();
});

test("Stagger enters in order with different opacities partway through entry.", async ({
  page,
}) => {
  await page.goto("/#/9");
  await position(page, 9);
  await page.keyboard.press("ArrowRight");
  const items = page.locator("[data-deck-active] [data-step-state] > [data-step-state]");
  await expect
    .poll(() =>
      items.evaluateAll((elements) => {
        const values = elements.map((element) => Number(getComputedStyle(element).opacity));
        return (
          values.length === 4 &&
          values[0] !== values[3] &&
          values.every((value, i) => i === 0 || value <= (values[i - 1] ?? 0))
        );
      }),
    )
    .toBe(true);
});

test("CountUp shows zero, intermediate values, its final number, and an immediate reset.", async ({
  page,
}) => {
  await page.goto("/#/13");
  await position(page, 13);
  const number = page.locator('[data-deck-active] [aria-hidden="true"]');
  await expect(number).toHaveText("0");
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(async () => Number((await number.textContent())?.replaceAll(",", "")))
    .toBeGreaterThan(0);
  expect(Number((await number.textContent())?.replaceAll(",", ""))).toBeLessThan(1200);
  await expect(number).toHaveText("1,200");
  await page.keyboard.press("ArrowLeft");
  await expect(number).toHaveText("0");
});

test("Highlight keeps its text visible before and after the marker sweep.", async ({ page }) => {
  await page.goto("/#/12");
  await position(page, 12);
  const mark = page.getByText("the important part", { exact: true });
  for (let click = 0; click <= 2; click++) {
    await settled(page, 12, click);
    await expect(mark).toHaveCSS("opacity", "1");
    await expect(mark).toHaveCSS("visibility", "visible");
    await expect(mark).toHaveCSS("background-size", click === 1 ? "100% 100%" : "0% 100%");
    if (click < 2) await page.keyboard.press("ArrowRight");
  }
});

test("An SVG Step with a normalized path fades while Draw animates its stroke.", async ({
  page,
}) => {
  await page.goto("/#/14");
  await position(page, 14);
  const svg = page.getByRole("img", { name: "A rising curve" });
  const shape = svg.locator("rect");
  const step = shape.locator("..");
  const path = svg.locator("path");
  await expect(step).toHaveCSS("opacity", "0");
  await expect(shape).toHaveCSS("stroke-dasharray", "none");
  await expect(path).toHaveCSS("stroke-dashoffset", "1px");
  await page.keyboard.press("ArrowRight");
  await position(page, 14, 1);
  await settled(page, 14, 1);
  await expect(step).toHaveCSS("opacity", "1");
  await expect(path).toHaveCSS("stroke-dashoffset", "0px");
  await page.keyboard.press("ArrowRight");
  await position(page, 14, 2);
  await settled(page, 14, 2);
  await expect(step).toHaveCSS("opacity", "0");
  await expect(shape).toHaveCSS("stroke-dasharray", "none");
});

test("A rapid second timeline click continues from the visible pose and ends at beat two.", async ({
  page,
}) => {
  await page.goto("/#/15");
  await position(page, 15);
  const svg = page.getByRole("img", { name: "Three beats move and recolor two shapes" });
  const samples = svg.evaluate(async (element) => {
    const group = element.querySelector("g");
    if (!group) throw new Error("Missing timeline shapes");
    const frames: number[] = [];
    const read = () => Number(group.getAttribute("transform")?.match(/translate\(([-\d.]+)/)?.[1]);
    const started = performance.now();
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
    );
    while (read() === 140) await new Promise<void>((done) => requestAnimationFrame(() => done()));
    const before = read();
    const gap = performance.now() - started;
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
    );
    const retargeted = read();
    frames.push(before, retargeted);
    while (read() < 780) {
      await new Promise<void>((done) =>
        requestAnimationFrame(() => {
          frames.push(read());
          done();
        }),
      );
    }
    return { before, retargeted, gap, frames };
  });
  const { before, retargeted, gap, frames } = await samples;
  expect(before).toBeGreaterThan(140);
  expect(gap).toBeLessThan(100);
  expect(retargeted).toBe(before);
  expect(frames.at(-1)).toBe(780);
  expect(frames.every((value, index) => value >= (frames[index - 1] ?? 140))).toBe(true);
  await position(page, 15, 2);
});

test("Reloading timeline click two paints the click-two pose in its first frame.", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const frames: string[] = [];
    Reflect.set(window, "motionPaints", frames);
    const frame = () => {
      const group = document.querySelector("[data-deck-active] svg g");
      if (group) frames.push(group.getAttribute("transform") ?? "missing");
      if (!frames.length) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
  await page.goto("/#/15?clicks=2");
  await position(page, 15, 2);
  await page.reload();
  await position(page, 15, 2);
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, "motionPaints")))
    .toEqual(["translate(780 260)"]);
});

test("useTween updates its SVG attribute on each active frame and stops at the endpoint.", async ({
  page,
}) => {
  await page.goto("/#/16");
  await position(page, 16);
  const result = await page
    .getByRole("img", { name: "A circle grows from radius 48 to 180" })
    .evaluate(async (svg) => {
      const circle = svg.querySelector("circle:last-of-type");
      if (!circle) throw new Error("Missing tween circle");
      const read = () => Number(circle.getAttribute("r"));
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
      );
      window.dispatchEvent(
        new KeyboardEvent("keyup", { key: "ArrowRight", code: "ArrowRight", bubbles: true }),
      );
      const values: number[] = [];
      while (read() < 180) {
        await new Promise<void>((done) =>
          requestAnimationFrame(() => {
            values.push(read());
            done();
          }),
        );
      }
      const idle: number[] = [];
      for (let i = 0; i < 10; i++)
        await new Promise<void>((done) =>
          requestAnimationFrame(() => {
            idle.push(read());
            done();
          }),
        );
      return { values, idle };
    });
  const active = result.values.filter((value) => value > 48 && value < 180);
  expect(active.length).toBeGreaterThan(5);
  expect(active.every((value, index) => index === 0 || value > (active[index - 1] ?? 0))).toBe(
    true,
  );
  expect(result.idle).toEqual(Array(10).fill(180));
  console.info(
    `useTween: ${active.length} changing frames; ${result.idle.length} idle frames unchanged`,
  );
});

test("The gallery walks every frame forward, reverses interruptions, and fits 4:3.", async ({
  page,
}) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/#/1");
  for (let no = 1; no <= gallery.length; no++) {
    const total = gallery[no - 1]?.[1] ?? 0;
    for (let click = 0; click <= total; click++) {
      await position(page, no, click);
      await settled(page, no, click);
      if (no !== gallery.length || click !== total) await page.keyboard.press("ArrowRight");
    }
  }
  for (const no of [9, 10, 11]) {
    await page.goto(`/#/${no}`);
    await position(page, no);
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() =>
      Array.from(
        document.querySelectorAll("[data-deck-active] [data-step-state] [data-step-state]"),
      ).some((piece) => {
        const opacity = Number(getComputedStyle(piece).opacity);
        return opacity > 0 && opacity < 1;
      }),
    );
    await page.keyboard.press("ArrowLeft");
    await position(page, no);
    await settled(page, no, 0);
    for (const pose of await poses(page)) expect(pose.visibility).toBe("hidden");
  }
  await page.setViewportSize({ width: 1024, height: 768 });
  for (const [no, click] of [
    [8, 4],
    [9, 1],
    [15, 3],
  ]) {
    await page.goto(`/#/${no}?clicks=${click}`);
    await position(page, no ?? 0, click);
    await settled(page, no ?? 0, click ?? 0);
    await expect(page.locator("#deck-frame")).toHaveCSS("--deck-scale", String(1024 / 1920));
    const boxes = await page.locator("[data-deck-active] > *").evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, right, bottom } = element.getBoundingClientRect();
        return { x, y, right, bottom };
      }),
    );
    for (const [index, box] of boxes.entries()) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(1024);
      expect(box.bottom).toBeLessThanOrEqual(768);
      const previous = boxes[index - 1];
      if (previous) expect(box.y).toBeGreaterThanOrEqual(previous.bottom);
    }
  }
  expect(errors).toEqual([]);
});
