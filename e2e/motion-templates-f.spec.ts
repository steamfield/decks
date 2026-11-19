import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/motion.fixture";
import { position, settled, slideNo } from "./fixtures/motion-gallery";

// The default theme's cyan step 3 (the accent) and its muted text (the neutral).
const accent = "rgb(34, 211, 238)";
const neutral = "rgb(161, 161, 170)";

type Seen = (element: Element) => number;

test.beforeEach(async ({ page }) => {
  // How much of an element a viewer sees: its and its ancestors' opacity, 0 when any is hidden.
  await page.addInitScript(() => {
    Reflect.set(window, "seen", (element: Element) => {
      let value = 1;
      for (let part: Element | null = element; part; part = part.parentElement) {
        const style = getComputedStyle(part);
        if (style.visibility === "hidden") return 0;
        value *= Number(style.opacity);
      }
      return Math.round(value * 100) / 100;
    });
  });
});

const active = (page: Page) => page.locator("[data-deck-active]");

/** The word-swap heading's name, its plate's readable letters, and which plates are accented. */
const readWordSwap = (page: Page) =>
  active(page)
    .getByRole("heading", { level: 2 })
    .evaluate((heading, accent) => {
      const spans = Array.from(heading.querySelectorAll("span"));
      const seen = Reflect.get(window, "seen") as Seen;
      return {
        name: heading.getAttribute("aria-label"),
        plate: spans
          .filter((el) => !el.children.length && el.textContent?.length === 1)
          .filter((el) => seen(el) === 1)
          .map((el) => el.textContent)
          .join(""),
        accented: spans
          .filter((el) => !el.textContent)
          .map((el) => getComputedStyle(el).backgroundColor === accent),
      };
    }, accent);
const wordSwapPoses = ["quarterly", "weekly", "daily"].map((plate) => ({
  name: `We ship ${plate}`,
  plate,
  accented: [false, false, true],
}));

/** Each fixture's reader, which reads its pose as a viewer would, and its pose at each click. */
const fixtures: { name: string; read: (page: Page) => Promise<unknown>; poses: unknown[] }[] = [
  { name: "word-swap", read: readWordSwap, poses: wordSwapPoses },
  {
    name: "bar-board",
    // Each row's name, how visible its value is, how far forward it sits, and its bar's colour.
    read: (page) =>
      active(page)
        .getByRole("listitem", { includeHidden: true })
        .evaluateAll((rows) =>
          rows.map((row) => {
            const bar = row.lastElementChild?.firstElementChild;
            const value = row.lastElementChild?.lastElementChild;
            return [
              row.getAttribute("aria-label"),
              value ? (Reflect.get(window, "seen") as Seen)(value) : null,
              getComputedStyle(row).opacity,
              bar ? getComputedStyle(bar).backgroundColor : null,
            ];
          }),
        ),
    poses: [
      [
        ["North pier: 42", 0, "1", neutral],
        ["East ramp: 30", 0, "1", neutral],
        ["South dock: 17", 0, "1", neutral],
      ],
      [
        ["North pier: 42", 1, "1", neutral],
        ["East ramp: 30", 1, "1", neutral],
        ["South dock: 17", 1, "1", neutral],
      ],
      [
        ["North pier: 42", 1, "1", accent],
        ["East ramp: 30", 0.4, "0.4", neutral],
        ["South dock: 17", 0.4, "0.4", neutral],
      ],
    ],
  },
  {
    name: "command-line",
    // The typed characters a viewer can read; a space draws nothing.
    read: (page) =>
      active(page)
        .getByText("bun add @steamfield/decks", { exact: true })
        .evaluate((code) =>
          Array.from(code.children)
            .filter((char) => (Reflect.get(window, "seen") as Seen)(char) === 1)
            .map((char) => char.textContent)
            .join(""),
        ),
    poses: ["", "bunadd@steamfield/decks"],
  },
  {
    name: "scramble-text",
    // The word's text and how much of it a viewer sees.
    read: (page) =>
      active(page)
        .getByLabel("Departure")
        .evaluate((word) => [word.textContent, (Reflect.get(window, "seen") as Seen)(word)]),
    poses: [
      ["Departure", 0],
      ["Departure", 1],
    ],
  },
  {
    name: "donut-build",
    // The centre's total, the legend labels a viewer sees, and the colour of each drawn arc.
    read: async (page) => {
      const centre = await active(page)
        .getByRole("figure", { includeHidden: true })
        .getByRole("paragraph", { includeHidden: true })
        .evaluate((total) =>
          (Reflect.get(window, "seen") as Seen)(total) ? total.textContent : "",
        );
      const labels = await active(page)
        .getByRole("listitem", { includeHidden: true })
        .evaluateAll((rows) =>
          rows
            .filter((row) => (Reflect.get(window, "seen") as Seen)(row) === 1)
            .map((row) => row.firstElementChild?.textContent),
        );
      // The arcs are decorative parts of a hidden drawing; their tag is their only identity.
      const arcs = await active(page)
        .locator("circle")
        .evaluateAll(
          (circles, drawn) =>
            circles.slice(1, 1 + drawn).map((circle) => getComputedStyle(circle).stroke),
          labels.length,
        );
      return { centre, labels, arcs };
    },
    poses: [
      { centre: "", labels: [], arcs: [] },
      { centre: "58%", labels: ["Mobile"], arcs: [accent] },
      { centre: "88%", labels: ["Mobile", "Desktop"], arcs: [neutral, accent] },
      { centre: "100%", labels: ["Mobile", "Desktop", "Tablet"], arcs: [neutral, neutral, accent] },
    ],
  },
];

for (const { name, read, poses } of fixtures) {
  test(`${name} shows each click's pose stepping forward and back`, async ({ page }) => {
    const no = slideNo(`mt-${name}`);
    const last = poses.length - 1;
    const at = async (click: number) => {
      await position(page, no, click);
      await settled(page, no, click);
      await expect.poll(() => read(page)).toEqual(poses[click]);
    };
    await page.goto(`/#/${no}`);
    await at(0);
    for (let click = 1; click <= last; click++) {
      await page.keyboard.press("ArrowRight");
      await at(click);
    }
    for (let click = last - 1; click >= 0; click--) {
      await page.keyboard.press("ArrowLeft");
      await at(click);
    }
  });
}

test("word-swap shows only its last phrase after leaving from the last click and coming back", async ({
  page,
}) => {
  const no = slideNo("mt-word-swap");
  const last = wordSwapPoses.length - 1;
  await page.goto(`/#/${no}?clicks=${last}`);
  await position(page, no, last);
  await settled(page, no, last);
  await page.keyboard.press("ArrowRight");
  await position(page, no + 1);
  await page.keyboard.press("ArrowLeft");
  await position(page, no, last);
  await settled(page, no, last);
  await expect.poll(() => readWordSwap(page)).toEqual(wordSwapPoses[last]);
});

/** Writes one slide per template into the editable deck, after installing the kit theme. */
async function writeSlides(dir: string, ...templates: string[]) {
  await writeFile(
    join(dir, "setup.ts"),
    'import {installTheme,resolveTheme} from "@steamfield/decks/kit"; installTheme(resolveTheme());',
  );
  const header = 'import {MotionTemplate} from "@steamfield/decks/kit";\n\n<h1>Fixture</h1>\n';
  for (const [index, template] of templates.entries())
    await writeFile(
      join(dir, `slides/0${index + 1}-${index ? "steps" : "cover"}.mdx`),
      header + template,
    );
}

test("bar-board keeps its longest value on the board when the top bar fills its track", async ({
  page,
  editableDeck,
}) => {
  // The top value sits on a tick, so its bar is the whole track; the affixes are the longest
  // allowed.
  const rows = [
    { label: "North pier", value: 1250000 },
    { label: "East ramp", value: 600000 },
  ];
  await writeSlides(
    editableDeck.dir,
    `<MotionTemplate template="bar-board" rows={${JSON.stringify(rows)}} source="Demo data" prefix="approx. " suffix=" ships/d" />`,
  );
  await page.goto(`${editableDeck.url}?motion=instant#/1`);
  const figure = active(page).getByRole("figure");
  const value = figure
    .getByRole("listitem", { name: /^North pier/ })
    .getByText("approx. 1,250,000 ships/d", { exact: true });
  await expect(value).toBeVisible();
  const [box, board] = [await value.boundingBox(), await figure.boundingBox()];
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
    (board?.x ?? 0) + (board?.width ?? 0),
  );
});

test("donut-build draws a segment smaller than the gap between segments", async ({
  page,
  editableDeck,
}) => {
  const segments = [
    { label: "Ferries", value: 995 },
    { label: "Kayaks", value: 5 },
  ];
  await writeSlides(
    editableDeck.dir,
    `<MotionTemplate template="donut-build" segments={${JSON.stringify(segments)}} />`,
  );
  await page.goto(`${editableDeck.url}?motion=instant#/1?clicks=1`);
  await expect(active(page).getByText("Kayaks", { exact: true })).toBeVisible();
  // The arcs are decorative parts of a hidden drawing; their tag is their only identity. Each
  // arc's drawn length is the first entry of its dash pattern.
  const drawn = await active(page)
    .locator("circle")
    .evaluateAll((circles) =>
      circles.slice(1).map((arc) => Number.parseFloat(getComputedStyle(arc).strokeDasharray)),
    );
  expect(drawn).toHaveLength(2);
  for (const length of drawn) expect(length).toBeGreaterThan(0);
});

test("title-reveal draws its accent rule under a subtitle and none without one", async ({
  page,
  editableDeck,
}) => {
  const title = 'title="The river changed course."';
  await writeSlides(
    editableDeck.dir,
    `<MotionTemplate template="title-reveal" ${title} subtitle="A field guide" />`,
    `<MotionTemplate template="title-reveal" ${title} />`,
  );
  // The rule is a decorative block hidden from assistive technology, found by its tag.
  const rule = (no: number) =>
    page.locator(`[data-deck-active][data-deck-slide="${no}"] figure div[aria-hidden=true]`);
  await page.goto(`${editableDeck.url}?motion=instant#/1`);
  await expect(active(page).getByText("A field guide", { exact: true })).toBeVisible();
  const heading = await active(page).getByRole("heading", { level: 2 }).boundingBox();
  const drawn = await rule(1).boundingBox();
  expect(drawn?.width).toBeGreaterThan(0);
  expect(drawn?.y).toBeGreaterThanOrEqual((heading?.y ?? 0) + (heading?.height ?? 0));
  await page.goto(`${editableDeck.url}?motion=instant#/2`);
  await expect(active(page).getByRole("heading", { level: 2 })).toBeVisible();
  await expect(rule(2)).toHaveCount(0);
});
