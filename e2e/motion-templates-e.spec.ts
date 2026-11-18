import { expect } from "@playwright/test";
import { PNG } from "pngjs";
import { startSettling } from "./fixtures/deck-driver";
import { kitFixture } from "./fixtures/kit.fixture";
import { test } from "./fixtures/motion.fixture";
import { position, settled, slideNo } from "./fixtures/motion-gallery";

const examples = [
  ["icon-array", "One in four seats is reserved for apprentices."],
  ["team-grid", "Apprentice mentor"],
  ["venn-overlap", "Pilot"],
] as const;
for (const [name, label] of examples) {
  test(`${name} goes forward, back, through two quick clicks and reloads at its last click`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const read = () => {
        const slide = document.querySelector("[data-deck-active]");
        const parts = Array.from(slide?.querySelectorAll("*") ?? []).filter(
          (el) => !el.closest("[data-deck-layer]"),
        );
        if (
          !parts.some((el) => el.matches("h2")) ||
          parts.some((el) => el instanceof HTMLImageElement && !el.naturalWidth)
        )
          return;
        return JSON.stringify(
          parts.map((el) => {
            const { x, y, width, height } = el.getBoundingClientRect();
            const { visibility, opacity, fill } = getComputedStyle(el);
            const bounds = [x, y, width, height].map(Math.round);
            return [el.textContent, visibility, opacity, fill, ...bounds];
          }),
        );
      };
      const frames = new Set<string>();
      Reflect.set(window, "templatePose", { read, frames });
      function sample() {
        const pose = read();
        if (pose) frames.add(pose);
        requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    const no = slideNo(`mt-${name}`);
    const text = page.locator("[data-deck-active]").getByText(label, { exact: true });
    await page.goto(`/#/${no}`);
    await position(page, no);
    await expect(text).toBeAttached();
    await expect(text).toBeHidden();
    await page.keyboard.press("ArrowRight");
    await settled(page, no, 1);
    await expect(text).toBeVisible();
    await page.keyboard.press("ArrowLeft");
    await settled(page, no, 0);
    await expect(text).toBeHidden();
    for (const key of ["ArrowRight", "ArrowLeft", "ArrowRight"]) await page.keyboard.press(key);
    await position(page, no, 1);
    await settled(page, no, 1);
    await expect(text).toBeVisible();
    const live = await page.evaluate(() => Reflect.get(window, "templatePose").read());
    await page.reload();
    await position(page, no, 1);
    await settled(page, no, 1);
    expect(
      await page.evaluate(() => Array.from(Reflect.get(window, "templatePose").frames)),
    ).toEqual([live]);
  });
}

for (const labels of [
  ["Design", "Training"],
  ["Design", "Fieldwork", "Training"],
]) {
  test(`venn-overlap draws ${labels.length} circles with each label in its own region and the overlap label in the shared region`, async ({
    page,
    deckServer,
    motionClock,
  }) => {
    const fixture = await kitFixture(deckServer, {
      "slides/01-venn.mdx": `---
clicks: 1
---

import { MotionTemplate } from "@steamfield/decks/kit";

<MotionTemplate template="venn-overlap" at={1} sets={${JSON.stringify(labels)}} overlap="Pilot" accent="rose" />`,
    });
    try {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto(fixture.url);
      const slide = page.locator("[data-deck-active]");
      const circles = slide.locator("circle");
      await expect(circles).toHaveCount(labels.length);
      await expect(circles.first()).toHaveCSS("stroke", "rgb(251, 113, 133)");
      const bounds = () =>
        circles.evaluateAll((nodes) =>
          nodes.map((node) => {
            const box = node.getBoundingClientRect();
            return { x: box.x + box.width / 2, y: box.y + box.height / 2, r: box.width / 2 };
          }),
        );
      await motionClock.pauseAt();
      await page.keyboard.press("ArrowRight");
      await motionClock.step(100);
      const apart = await bounds();
      for (const [index, circle] of apart.entries()) {
        expect(circle.x - circle.r).toBeGreaterThanOrEqual(0);
        expect(circle.x + circle.r).toBeLessThanOrEqual(1024);
        for (const other of apart.slice(index + 1)) {
          expect(Math.hypot(circle.x - other.x, circle.y - other.y)).toBeGreaterThan(
            circle.r + other.r,
          );
        }
      }
      await expect(slide.getByText("Pilot")).toBeHidden();
      await motionClock.step(1100);
      const boxes = await bounds();
      for (const [index, label] of [...labels, "Pilot"].entries()) {
        const corners = await slide.getByText(label, { exact: true }).evaluate((el) => {
          const range = document.createRange();
          range.selectNodeContents(el);
          const { left, right, top, bottom } = range.getBoundingClientRect();
          return [
            { x: left, y: top },
            { x: right, y: top },
            { x: left, y: bottom },
            { x: right, y: bottom },
          ];
        });
        for (const [i, disc] of boxes.entries())
          for (const p of corners)
            expect(Math.hypot(p.x - disc.x, p.y - disc.y) < disc.r).toBe(
              index === i || label === "Pilot",
            );
      }
    } finally {
      await fixture.close();
    }
  });
}

test("the accent prop changes the accent colour to that hue's step 3 on the icons and initials", async ({
  page,
  deckServer,
}) => {
  const shares = [0, 37, 100];
  const fixture = await kitFixture(
    deckServer,
    Object.fromEntries(
      shares.map((filled, i) => [
        `slides/0${i + 1}-people.mdx`,
        `import { MotionTemplate } from "@steamfield/decks/kit";

<MotionTemplate template="icon-array" total={100} filled={${filled}} label="Reviewers" accent="rose" />
<MotionTemplate template="team-grid" people={[{name:"Ada Reed",role:"Design"},{name:"Sam Wu",role:"Field"}]} accent="rose" />`,
      ]),
    ),
  );
  try {
    for (const [i, filled] of shares.entries()) {
      await page.goto(`${fixture.url}?motion=instant#/${i + 1}`);
      const slide = page.locator("[data-deck-active]");
      const grid = slide.getByRole("img", { name: `${filled} of 100 highlighted` });
      const { width, height, data } = PNG.sync.read(await grid.screenshot());
      // Trim the letterbox to the painted people, then read the colour in each of the 100 cells.
      const ink: { x: number; y: number; highlight: boolean }[] = [];
      let left = width,
        right = 0,
        top = height,
        bottom = 0;
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4;
          const rgb = data.readUIntBE(offset, 3);
          if (rgb !== 0xfb7185 && rgb !== 0x52525b) continue;
          ink.push({ x, y, highlight: rgb === 0xfb7185 });
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      const cells = Array.from({ length: 100 }, () => new Set<boolean>());
      for (const pixel of ink) {
        const column = Math.floor((10 * (pixel.x - left)) / (right - left + 1));
        const row = Math.floor((10 * (pixel.y - top)) / (bottom - top + 1));
        cells[row * 10 + column]?.add(pixel.highlight);
      }
      expect(cells.map((cell) => [...cell])).toEqual(
        Array.from({ length: 100 }, (_, j) => [j < filled]),
      );
      await expect(slide.getByText("SW", { exact: true })).toHaveCSS("color", "rgb(251, 113, 133)");
    }
  } finally {
    await fixture.close();
  }
});

test("team-grid holds the cards and capture until every portrait has loaded or failed", async ({
  page,
  deckServer,
  motionClock,
}) => {
  const fixture = await kitFixture(deckServer, {
    "public/ready.svg": '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"/>',
    "slides/01-team.mdx": `---
clicks: 1
---

import { MotionTemplate } from "@steamfield/decks/kit";

<h1>Workshop</h1>
<MotionTemplate template="team-grid" at={1} people={[{name:"Ada Reed", role:"Lead",src:"/ready.svg"},{name:"Sam Wu",role:"Design",src:"/missing.svg"}]} />`,
  });
  const warnings: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "warning" && msg.text().includes("/missing.svg")) warnings.push(msg.text());
  });
  const release = Promise.withResolvers<void>();
  await page.route("**/missing.svg", async (route) => {
    await release.promise;
    await route.fulfill({ contentType: "image/svg+xml", body: "invalid image" });
  });
  try {
    await page.goto(fixture.url, { waitUntil: "domcontentloaded" });
    const name = page.getByText("Ada Reed", { exact: true });
    await expect(name).toBeAttached();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/clicks=1$/);
    await expect(name).toBeHidden();
    await motionClock.pauseAt();
    const capture = await startSettling(page);
    try {
      await motionClock.step(100);
      expect(await capture.evaluate((state) => state.done)).toBe(false);
      release.resolve();
      await expect(page.getByText("SW", { exact: true })).toBeAttached();
      const first = page.getByRole("listitem", { includeHidden: true }).first();
      const top = () => first.evaluate((el) => el.getBoundingClientRect().top);
      const startY = await top();
      await motionClock.step(80);
      const midY = await top();
      await motionClock.step(1000);
      expect(midY).toBeLessThan(startY);
      expect(await top()).toBeLessThan(midY);
      await capture.evaluate((state) => state.promise);
    } finally {
      await capture.dispose();
    }
    await expect(name).toBeVisible();
    await expect(page.getByAltText("Ada Reed")).toBeVisible();
    await expect(page.getByRole("img", { name: "Ada Reed" })).toHaveCount(0);
    await expect(page.getByText("Sam Wu", { exact: true })).toBeVisible();
    await expect(page.getByAltText("Sam Wu")).toHaveCount(0);
    await expect(page.getByText("SW", { exact: true })).toBeVisible();
    expect(warnings).toEqual(["team-grid: could not load /missing.svg"]);
  } finally {
    release.resolve();
    await fixture.close();
  }
});

test("three rapid forward presses bring the pre-mounted Venn to the same intersection as a reload", async ({
  page,
}) => {
  const venn = slideNo("mt-venn-overlap");
  await page.goto(`/#/${slideNo("mt-team-grid")}`);
  await expect(page.getByRole("heading", { name: "Team grid" })).toBeVisible();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await position(page, venn, 1);
  await settled(page, venn, 1);
  const shared = page.locator("[data-deck-active]").getByRole("heading", { name: "Pilot" });
  const arrived = await shared.boundingBox();
  await page.reload();
  await position(page, venn, 1);
  await settled(page, venn, 1);
  expect(await shared.boundingBox()).toEqual(arrived);
});

for (const mode of ["presenter", "instant"]) {
  for (const [name, label] of examples) {
    test(`${mode} advances ${name} without a tick`, async ({ page, motionClock }) => {
      const no = slideNo(`mt-${name}`);
      await page.goto(mode === "presenter" ? `/#/presenter/${no}` : `/?motion=instant#/${no}`);
      const slide = page.locator(
        mode === "presenter" ? '[data-deck-context="presenter"]' : "[data-deck-active]",
      );
      const text = slide.getByText(label, { exact: true });
      await expect(text).toBeAttached();
      await settled(page, no, 0);
      await expect(text).toBeHidden();
      await motionClock.pauseAt();
      await page.keyboard.press("ArrowRight");
      await expect(text).toBeVisible();
    });
  }
}
