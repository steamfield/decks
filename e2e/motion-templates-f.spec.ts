import { expect, type Page } from "@playwright/test";
import { test } from "./fixtures/motion.fixture";
import { position, settled, slideNo } from "./fixtures/motion-gallery";

// The default theme's cyan step 3 (the accent) and its muted text (the neutral).
const accent = "rgb(34, 211, 238)";
const neutral = "rgb(161, 161, 170)";
// Its primary text, its canvas, and the amber and rose step 3 the palette plates take.
const text = "rgb(247, 248, 248)";
const canvas = "rgb(9, 9, 11)";
const amber = "rgb(251, 191, 36)";
const rose = "rgb(251, 113, 133)";

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

/**
 * The word-swap heading's name, its plate's readable letters and their colours, and every
 * plate's fill colour (a fill is the plate's only box without text).
 */
const readWordSwap = (page: Page) =>
  active(page)
    .getByRole("heading", { level: 2 })
    .evaluate((heading) => {
      const spans = Array.from(heading.querySelectorAll("span"));
      const seen = Reflect.get(window, "seen") as Seen;
      const letters = spans
        .filter((el) => !el.children.length && el.textContent?.length === 1)
        .filter((el) => seen(el) === 1);
      return {
        name: heading.getAttribute("aria-label"),
        plate: letters.map((el) => el.textContent).join(""),
        ink: Array.from(new Set(letters.map((el) => getComputedStyle(el).color))),
        fills: spans
          .filter((el) => !el.textContent)
          .map((el) => getComputedStyle(el).backgroundColor),
      };
    });
const wordSwapPoses = ["quarterly", "weekly", "daily"].map((plate) => ({
  name: `We ship ${plate}`,
  plate,
  ink: [canvas],
  fills: [amber, rose, accent],
}));

/** Each fixture's reader, which reads its pose as a viewer would, and its pose at each click. */
const fixtures: { name: string; read: (page: Page) => Promise<unknown>; poses: unknown[] }[] = [
  { name: "word-swap", read: readWordSwap, poses: wordSwapPoses },
  {
    name: "bar-board",
    // The board's left edge colour, and each row's name, how visible its value is, how far forward
    // it sits, its bar's colour and its value's colour.
    read: (page) =>
      active(page)
        .getByRole("listitem", { includeHidden: true })
        .evaluateAll((rows) => {
          const board = rows[0]?.parentElement?.parentElement;
          return {
            edge: board ? getComputedStyle(board).borderLeftColor : null,
            rows: rows.map((row) => {
              const bar = row.lastElementChild?.firstElementChild;
              const value = row.lastElementChild?.lastElementChild;
              return [
                row.getAttribute("aria-label"),
                value ? (Reflect.get(window, "seen") as Seen)(value) : null,
                getComputedStyle(row).opacity,
                bar ? getComputedStyle(bar).backgroundColor : null,
                value ? getComputedStyle(value).color : null,
              ];
            }),
          };
        }),
    poses: [
      {
        edge: accent,
        rows: [
          ["North pier: 42", 0, "1", neutral, text],
          ["East ramp: 30", 0, "1", neutral, text],
          ["South dock: 17", 0, "1", neutral, text],
        ],
      },
      {
        edge: accent,
        rows: [
          ["North pier: 42", 1, "1", neutral, text],
          ["East ramp: 30", 1, "1", neutral, text],
          ["South dock: 17", 1, "1", neutral, text],
        ],
      },
      {
        edge: accent,
        rows: [
          ["North pier: 42", 1, "1", accent, accent],
          ["East ramp: 30", 0.4, "0.4", neutral, text],
          ["South dock: 17", 0.4, "0.4", neutral, text],
        ],
      },
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
