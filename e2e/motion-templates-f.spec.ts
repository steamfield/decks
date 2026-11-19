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

/** Each fixture's reader, which reads its pose as a viewer would, and its pose at each click. */
const fixtures: { name: string; read: (page: Page) => Promise<unknown>; poses: unknown[] }[] = [
  {
    name: "word-swap",
    // The plate's readable letters, and which plates are filled with the accent.
    read: (page) =>
      active(page)
        .getByRole("heading", { name: "We ship quarterly weekly daily" })
        .evaluate((heading, accent) => {
          const spans = Array.from(heading.querySelectorAll("span"));
          const seen = Reflect.get(window, "seen") as Seen;
          return {
            plate: spans
              .filter((el) => !el.children.length && el.textContent?.length === 1)
              .filter((el) => seen(el) === 1)
              .map((el) => el.textContent)
              .join(""),
            accented: spans
              .filter((el) => !el.textContent)
              .map((el) => getComputedStyle(el).backgroundColor === accent),
          };
        }, accent),
    poses: ["", "quarterly", "weekly", "daily"].map((plate) => ({
      plate,
      accented: [false, false, true],
    })),
  },
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
        .getByRole("heading", { level: 2, includeHidden: true })
        .evaluate((heading) =>
          (Reflect.get(window, "seen") as Seen)(heading) ? heading.textContent : "",
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
