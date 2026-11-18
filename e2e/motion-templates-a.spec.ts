import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";
import { PNG } from "pngjs";
import { settled as settleDeck } from "./fixtures/deck-driver";
import { test } from "./fixtures/motion.fixture";
import { gallery, position, settled, slideNo } from "./fixtures/motion-gallery";

const examples = [
  ["title-reveal", "The river changed course."],
  ["lower-third", "River survey lead"],
  ["stat-burst", "1,248"],
  ["stat-compare", "-12 min"],
  ["metric-grid", "1,248"],
] as const;

for (const [name, witness] of examples) {
  test(`each slide forward, back, two quick clicks and reload at the last click: ${name}`, async ({
    page,
    deck,
    motionClock,
  }) => {
    const no = slideNo(`mt-${name}`);
    await page.addInitScript(() => {
      const poses = new Set<string>();
      Reflect.set(window, "templatePoses", poses);
      function read() {
        const graphic = document.querySelector("[data-deck-active] figure");
        if (graphic) {
          const parts = [graphic, ...graphic.querySelectorAll("*")].map((part) => {
            const { opacity, visibility, transform, strokeDasharray, strokeDashoffset } =
              getComputedStyle(part);
            return [opacity, visibility, transform, strokeDasharray, strokeDashoffset];
          });
          const pose = JSON.stringify([graphic.textContent, parts]);
          poses.add(pose);
          Reflect.set(window, "latestPose", pose);
        } else if (document.querySelector("[data-deck-active] h1")) {
          poses.add("missing figure");
        }
        requestAnimationFrame(read);
      }
      requestAnimationFrame(read);
    });
    await deck.goto(no);
    const figure = page.locator("[data-deck-active]").locator("figure");
    const text =
      name === "title-reveal"
        ? figure.getByRole("heading", { name: witness })
        : figure.getByText(witness, { exact: true });
    await expect(figure).toBeHidden();
    await motionClock.pauseAt();
    await deck.press("ArrowRight");
    const art =
      name === "title-reveal" || name === "lower-third"
        ? figure.locator("div[aria-hidden=true]")
        : figure.locator("svg").first();
    if (
      name === "title-reveal" ||
      name === "lower-third" ||
      name === "stat-burst" ||
      name === "stat-compare"
    ) {
      const drawn = () =>
        art.evaluate((node) => {
          const stroke = node.querySelector("circle, polyline");
          return stroke
            ? getComputedStyle(stroke).strokeDashoffset
            : node.getBoundingClientRect().width;
        });
      const start = await drawn();
      await motionClock.step(name === "title-reveal" ? 400 : 200);
      const moving = await drawn();
      expect(moving).not.toBe(start);
      await motionClock.step(name === "title-reveal" ? 800 : 1000);
      expect(await drawn()).not.toBe(moving);
    } else await motionClock.step(1200);
    expect(await page.evaluate(() => window.__deck?.busy())).toEqual([]);
    await page.clock.resume();
    await settled(page, no, 1);
    await expect(text).toBeVisible();
    await deck.press("ArrowLeft");
    await settled(page, no, 0);
    await expect(figure).toBeHidden();
    await deck.press("ArrowRight");
    await deck.press("ArrowRight");
    if (no < gallery.length) {
      const nextClicks = Math.min(1, gallery[no]?.meta.clicks ?? 0);
      if (nextClicks) {
        await deck.press("ArrowRight");
        await position(page, no + 1, 1);
        await deck.press("ArrowLeft");
      }
      await position(page, no + 1);
      await deck.press("ArrowLeft");
    }
    await position(page, no, 1);
    await settled(page, no, 1);
    await expect(text).toBeVisible();

    const finalPose = await page.evaluate(() => Reflect.get(window, "latestPose"));
    await page.reload();
    await position(page, no, 1);
    await settled(page, no, 1);
    await expect
      .poll(() => page.evaluate(() => Reflect.get(window, "templatePoses").size))
      .toBeGreaterThan(0);
    expect(await page.evaluate(() => Array.from(Reflect.get(window, "templatePoses")))).toEqual([
      finalPose,
    ]);
    await expect(text).toBeVisible();
    if (name === "title-reveal") {
      const heading = figure.getByRole("heading", { name: "The river changed course." });
      const masks = await heading.evaluate((h) =>
        [...h.querySelectorAll("span")]
          .filter((word) => getComputedStyle(word).overflowY === "clip")
          .map((word) => word.textContent),
      );
      expect(masks).toEqual(["The", "river", "changed", "course."]);
      const clipped = await heading.evaluate((h) =>
        [...h.querySelectorAll("span")]
          .filter(
            (word) =>
              getComputedStyle(word).overflowY !== "visible" &&
              word.scrollHeight > word.clientHeight + 1,
          )
          .map((word) => word.textContent),
      );
      expect(clipped).toEqual([]);
    }
    if (name === "lower-third") {
      const box = await figure.boundingBox();
      expect(box?.y).toBeGreaterThanOrEqual(720);
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(1080);
    }
    if (name === "metric-grid") {
      const labels = ["Field sites", "Water samples", "River surveyed"];
      const boxes = await Promise.all(
        labels.map((label) => figure.getByText(label, { exact: true }).boundingBox()),
      );
      expect(boxes.map((box) => box?.y)).toEqual(labels.map(() => boxes[0]?.y));
      expect(boxes[1]?.x).toBeGreaterThan(boxes[0]?.x ?? 0);
      expect(boxes[2]?.x).toBeGreaterThan(boxes[1]?.x ?? 0);
    }
  });
  test(`the accent prop changes the accent colour to that hue's step 3: ${name}`, async ({
    page,
    editableDeck,
  }) => {
    const slide = gallery[slideNo(`mt-${name}`) - 1];
    if (!slide) throw new Error(`Missing gallery slide mt-${name}`);
    const demo = await readFile(join("examples/motion", slide.meta.file), "utf8");
    const ramps = {
      cyan: ["#032022", "#064044", "#17aacc", "#8ceeff"],
      rose: ["#291225", "#54204c", "#e258a5", "#ffccee"],
    } as const;
    await writeFile(
      join(editableDeck.dir, "setup.ts"),
      `import {installTheme, resolveTheme} from "@steamfield/decks/kit"; installTheme(resolveTheme(${JSON.stringify({ ramps })}));\n`,
    );
    await writeFile(
      join(editableDeck.dir, "styles/index.css"),
      '@import "@steamfield/decks/kit/styles.css";\n',
    );
    const backdrop =
      name === "lower-third"
        ? '<div style={{position:"absolute",inset:0,background:"var(--od-canvas)"}} />'
        : "";
    const slideBody = `${demo.replace("at={1}", "at={0}")}\n<p className="od-body">Reference body</p>\n${backdrop}\n`;
    await writeFile(
      join(editableDeck.dir, "slides/01-cover.mdx"),
      slideBody.replace(' accent="rose"', ""),
    );
    await writeFile(join(editableDeck.dir, "slides/02-steps.mdx"), slideBody);
    for (const [no, accent] of [
      [1, "cyan"],
      [2, "rose"],
    ] as const) {
      await page.goto(`${editableDeck.url}?motion=instant#/${no}`);
      const figure = page
        .locator(`[data-deck-active][data-deck-slide="${no}"]`)
        .getByRole("figure");
      await expect(figure).toBeVisible();
      const caption = figure.locator("figcaption, p").first();
      const reference = page.locator("[data-deck-active]").getByText("Reference body");
      expect(
        await caption.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      ).toBeGreaterThanOrEqual(
        await reference.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
      );
      if (name === "lower-third") {
        expect(
          await caption.evaluate((el) => {
            const { x, y, width, height } = el.getBoundingClientRect();
            return el.contains(document.elementFromPoint(x + width / 2, y + height / 2));
          }),
        ).toBe(true);
      }
      const accents =
        name === "stat-compare"
          ? [figure.locator("svg"), figure.getByText("-12 min")]
          : name === "metric-grid"
            ? await figure.locator(":scope > div").all()
            : [figure.locator(name === "stat-burst" ? "svg" : "div[aria-hidden=true]")];
      const hue = Number.parseInt(ramps[accent][2].slice(1), 16);
      for (const element of accents) {
        const image = PNG.sync.read(await element.screenshot());
        expect(image.data.some((_, i) => i % 4 === 0 && image.data.readUIntBE(i, 3) === hue)).toBe(
          true,
        );
      }
    }
  });
}
test("wide totals keep the burst ring still and stay within all four tiles", async ({
  page,
  editableDeck,
}) => {
  await writeFile(
    join(editableDeck.dir, "setup.ts"),
    'import {installTheme,resolveTheme} from "@steamfield/decks/kit"; installTheme(resolveTheme());',
  );
  const header =
    '---\nclicks: 1\n---\n\nimport {MotionTemplate} from "@steamfield/decks/kit";\n\n<h1>River totals</h1>\n';
  const value = 12345678;
  await writeFile(
    join(editableDeck.dir, "slides/01-cover.mdx"),
    `${header}<MotionTemplate template="stat-burst" at={1} value={${value}} label="Samples" />`,
  );
  const metrics = ["North", "South", "East", "West"].map((label) => ({ label, value }));
  await writeFile(
    join(editableDeck.dir, "slides/02-steps.mdx"),
    header +
      `<MotionTemplate template="metric-grid" at={1} metrics={${JSON.stringify(metrics)}} />`,
  );
  await page.goto(`${editableDeck.url}#/1`);
  const ring = page.locator("[data-deck-active] figure svg");
  await expect(ring).toBeAttached();
  await settleDeck(page);
  const bounds = () => ring.evaluate((el) => el.getBoundingClientRect().toJSON());
  const before = await bounds();
  await page.keyboard.press("ArrowRight");
  await settleDeck(page);
  expect.soft(await bounds()).toEqual(before);
  await page.goto(`${editableDeck.url}?motion=instant#/2?clicks=1`);
  const numbers = page.locator("[data-deck-active]").getByRole("heading", { name: "12,345,678" });
  await expect(numbers).toHaveCount(4);
  for (const heading of await numbers.all()) {
    expect(await heading.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
});
