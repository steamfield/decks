import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import { settled as settleDeck } from "./fixtures/deck-driver";
import { test } from "./fixtures/motion.fixture";
import { gallery, position, settled, slideNo } from "./fixtures/motion-gallery";

const figureOf = (page: Page) =>
  page.locator("[data-deck-active]").getByRole("figure", { includeHidden: true });

// Each template and its caption, which shows once the template has entered.
const examples = [
  ["title-reveal", "A field guide to the spring flood"],
  ["lower-third", "River survey lead"],
  ["stat-burst", "Water samples tested"],
  ["stat-compare", "Time to process a sample"],
  ["metric-grid", "Field sites"],
] as const;

for (const [name, witness] of examples) {
  test(`${name} enters on its click, hides going back, and reloads at the click with no replay`, async ({
    page,
    deck,
  }) => {
    const no = slideNo(`mt-${name}`);
    await page.addInitScript((witness) => {
      const poses = new Set<string>();
      Reflect.set(window, "templatePoses", poses);
      function read() {
        const slide = document.querySelector("[data-deck-active]");
        if (slide?.textContent?.includes(witness)) {
          // The pose is every element of the slide outside its layers, so no single part is named.
          const parts = Array.from(slide.querySelectorAll("*"))
            .filter((part) => !part.closest("[data-deck-layer]"))
            .map((part) => {
              const { opacity, visibility, transform, strokeDasharray, strokeDashoffset } =
                getComputedStyle(part);
              return [opacity, visibility, transform, strokeDasharray, strokeDashoffset];
            });
          // The text carries the counters, so a replayed count-up changes the pose too.
          const pose = JSON.stringify([slide.textContent, parts]);
          poses.add(pose);
          Reflect.set(window, "latestPose", pose);
        }
        requestAnimationFrame(read);
      }
      requestAnimationFrame(read);
    }, witness);
    await deck.goto(no);
    const text = figureOf(page).getByText(witness, { exact: true });
    await expect(figureOf(page)).toBeHidden();
    await deck.press("ArrowRight");
    await settled(page, no, 1);
    await expect(text).toBeVisible();
    await deck.press("ArrowLeft");
    await settled(page, no, 0);
    await expect(figureOf(page)).toBeHidden();
    await deck.press("ArrowRight");
    await deck.press("ArrowRight");
    await position(page, no + 1);
    await deck.press("ArrowLeft");
    await position(page, no, 1);
    await settled(page, no, 1);
    await expect(text).toBeVisible();

    const finalPose = await page.evaluate(() => Reflect.get(window, "latestPose"));
    await page.reload();
    await position(page, no, 1);
    await settled(page, no, 1);
    await expect(text).toBeVisible();
    expect(await page.evaluate(() => Array.from(Reflect.get(window, "templatePoses")))).toEqual([
      finalPose,
    ]);
  });
}

// The rule, bar and ring are decorative parts hidden from assistive technology, found by tag.
const width = (art: Locator) => art.evaluate((node) => node.getBoundingClientRect().width);
const dash = (art: Locator) => art.evaluate((node) => getComputedStyle(node).strokeDashoffset);
const draws = [
  ["title-reveal", (figure: Locator) => width(figure.locator("div[aria-hidden=true]")), 400],
  ["lower-third", (figure: Locator) => width(figure.locator("div[aria-hidden=true]")), 200],
  ["stat-burst", (figure: Locator) => dash(figure.locator("circle")), 200],
  ["stat-compare", (figure: Locator) => dash(figure.locator("polyline").first()), 200],
] as const;

for (const [name, drawn, early] of draws) {
  test(`${name} draws its accent through the entrance and is idle after 1.2 s`, async ({
    page,
    deck,
    motionClock,
  }) => {
    const no = slideNo(`mt-${name}`);
    await deck.goto(no);
    await motionClock.pauseAt();
    await deck.press("ArrowRight");
    await position(page, no, 1);
    const start = await drawn(figureOf(page));
    await motionClock.step(early);
    const moving = await drawn(figureOf(page));
    expect(moving).not.toBe(start);
    await motionClock.step(1200 - early);
    expect(await drawn(figureOf(page))).not.toBe(moving);
    expect(await page.evaluate(() => window.__deck?.busy())).toEqual([]);
  });
}

test("title-reveal masks each word without clipping any glyph", async ({ page, deck }) => {
  await deck.goto(slideNo("mt-title-reveal"), 1);
  const heading = figureOf(page).getByRole("heading", { name: "The river changed course." });
  const masks = await Promise.all(
    ["The", "river", "changed", "course."].map((word) =>
      heading.getByText(word, { exact: true }).evaluate((element) => {
        // SplitText wraps each word in a mask; walk up from the word to it.
        let node: Element | null = element;
        while (node && getComputedStyle(node).overflowY !== "clip") node = node.parentElement;
        return {
          masked: node !== null,
          clipped: !!node && node.scrollHeight > node.clientHeight + 1,
        };
      }),
    ),
  );
  expect(masks).toEqual(Array.from({ length: 4 }, () => ({ masked: true, clipped: false })));
});

test("lower-third sits in the bottom third of the canvas", async ({ page, deck }) => {
  await deck.goto(slideNo("mt-lower-third"), 1);
  const box = await figureOf(page).boundingBox();
  expect(box?.y).toBeGreaterThanOrEqual(720);
  expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(1080);
});

test("metric-grid lays its tiles out left to right on one row", async ({ page, deck }) => {
  await deck.goto(slideNo("mt-metric-grid"), 1);
  const labels = ["Field sites", "Water samples", "River surveyed"];
  const boxes = await Promise.all(
    labels.map((label) => figureOf(page).getByText(label, { exact: true }).boundingBox()),
  );
  expect(boxes.map((box) => box?.y)).toEqual(labels.map(() => boxes[0]?.y));
  expect(boxes[1]?.x).toBeGreaterThan(boxes[0]?.x ?? 0);
  expect(boxes[2]?.x).toBeGreaterThan(boxes[1]?.x ?? 0);
});

const ramps = {
  cyan: ["#032022", "#064044", "#17aacc", "#8ceeff"],
  rose: ["#291225", "#54204c", "#e258a5", "#ffccee"],
} as const;

/** Writes the template's gallery slide twice into the editable deck: default accent, then rose. */
async function accentDeck(dir: string, name: string, extra = "") {
  const slide = gallery[slideNo(`mt-${name}`) - 1];
  if (!slide) throw new Error(`Missing gallery slide mt-${name}`);
  const demo = await readFile(join("examples/motion", slide.meta.file), "utf8");
  await writeFile(
    join(dir, "setup.ts"),
    `import {installTheme, resolveTheme} from "@steamfield/decks/kit"; installTheme(resolveTheme(${JSON.stringify({ ramps })}));\n`,
  );
  await writeFile(join(dir, "styles/index.css"), '@import "@steamfield/decks/kit/styles.css";\n');
  const body = `${demo.replace("at={1}", "at={0}")}\n<p className="od-body">Reference body</p>\n${extra}\n`;
  await writeFile(join(dir, "slides/01-cover.mdx"), body.replace(' accent="rose"', ""));
  await writeFile(join(dir, "slides/02-steps.mdx"), body);
}

// A metric tile has no role of its own, so it is the block that holds its label.
const tile = (figure: Locator, label: string) =>
  figure.locator("div").filter({ has: figure.page().getByText(label, { exact: true }) });

// The parts each template paints in its accent; the rule, bar, ring and arrow are decorative.
const accents: [string, string, (figure: Locator) => Locator[]][] = [
  ["title-reveal", examples[0][1], (figure) => [figure.locator("div[aria-hidden=true]")]],
  ["lower-third", examples[1][1], (figure) => [figure.locator("div[aria-hidden=true]")]],
  ["stat-burst", examples[2][1], (figure) => [figure.locator("svg")]],
  ["stat-compare", examples[3][1], (f) => [f.locator("svg"), f.getByText("-12 min")]],
  [
    "metric-grid",
    examples[4][1],
    (f) => ["Field sites", "Water samples", "River surveyed"].map((label) => tile(f, label)),
  ],
];

for (const [name, caption, painted] of accents) {
  test(`${name} paints the accent's step 3 and captions no smaller than body text`, async ({
    page,
    editableDeck,
  }) => {
    await accentDeck(editableDeck.dir, name);
    for (const [no, accent] of [
      [1, "cyan"],
      [2, "rose"],
    ] as const) {
      await page.goto(`${editableDeck.url}?motion=instant#/${no}`);
      const slide = page.locator(`[data-deck-active][data-deck-slide="${no}"]`);
      const figure = slide.getByRole("figure");
      await expect(figure).toBeVisible();
      const size = (element: Locator) =>
        element.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(await size(figure.getByText(caption, { exact: true }))).toBeGreaterThanOrEqual(
        await size(slide.getByText("Reference body")),
      );
      const hue = Number.parseInt(ramps[accent][2].slice(1), 16);
      for (const element of painted(figure)) {
        const image = PNG.sync.read(await element.screenshot());
        expect(image.data.some((_, i) => i % 4 === 0 && image.data.readUIntBE(i, 3) === hue)).toBe(
          true,
        );
      }
    }
  });
}

test("the lower-third role line stays on top of a full-canvas backdrop", async ({
  page,
  editableDeck,
}) => {
  const backdrop = '<div style={{position:"absolute",inset:0,background:"var(--od-canvas)"}} />';
  await accentDeck(editableDeck.dir, "lower-third", backdrop);
  await page.goto(`${editableDeck.url}?motion=instant#/1`);
  const role = page.locator("[data-deck-active]").getByText("River survey lead", { exact: true });
  await expect(role).toBeVisible();
  expect(
    await role.evaluate((el) => {
      const { x, y, width, height } = el.getBoundingClientRect();
      return el.contains(document.elementFromPoint(x + width / 2, y + height / 2));
    }),
  ).toBe(true);
});

test("wide totals keep the burst ring still on every frame and stay within all four tiles", async ({
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
  // The ring is a decorative drawing hidden from assistive technology, found by its tag.
  const ring = figureOf(page).locator("svg");
  await expect(ring).toBeAttached();
  await settleDeck(page);
  const frames = await ring.evaluateHandle((svg) => {
    const log = new Set<string>();
    const sample = () => {
      log.add(JSON.stringify(svg.getBoundingClientRect()));
      frame = requestAnimationFrame(sample);
    };
    let frame = requestAnimationFrame(sample);
    return { log, stop: () => cancelAnimationFrame(frame) };
  });
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/1\?clicks=1$/);
  await expect(figureOf(page).getByText("Samples", { exact: true })).toBeVisible();
  await settleDeck(page);
  const bounds = await frames.evaluate(({ log, stop }) => {
    stop();
    return Array.from(log);
  });
  await frames.dispose();
  expect(bounds, "the ring's bounds on every frame of the count-up").toHaveLength(1);
  await page.goto(`${editableDeck.url}?motion=instant#/2?clicks=1`);
  const numbers = page.locator("[data-deck-active]").getByRole("heading", { name: "12,345,678" });
  await expect(numbers).toHaveCount(4);
  for (const heading of await numbers.all()) {
    expect(await heading.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  }
});
