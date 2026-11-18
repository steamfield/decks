import { test as base, expect, type Locator, type Page } from "@playwright/test";
import { settled } from "./fixtures/deck-driver";
import { deckServer } from "./fixtures/deck-server";
import { record } from "./fixtures/motion-recorder";
import { paintAt } from "./fixtures/paint";

const test = base.extend<object, { recipesURL: string }>({
  recipesURL: [
    async ({ browser }, use) => {
      const server = await deckServer(browser, "examples/recipes");
      try {
        await use(server.url);
      } finally {
        await server.close();
      }
    },
    { scope: "worker" },
  ],
});

type Pose = (slide: Locator, page: Page) => Promise<void>;

const timeline = ["Pilot opened.", "West joined.", "Rules went live.", "Manual sorting ended."];
const steps = ["Read the request.", "Pick a route.", "Confirm the owner."];
const code = [
  'const queue = "general";',
  'const queue = request.urgent ? "priority" : "general";',
  'const queue = request.urgent ? "priority" : "general"; dispatch(queue, request);',
];

/** The first `shown` items are visible and the rest are hidden. */
function reveals(items: string[], shown: number): Pose {
  return async (slide) => {
    for (const item of items.slice(0, shown))
      await expect(slide.getByText(item, { exact: true })).toBeVisible();
    for (const item of items.slice(shown))
      await expect(slide.getByText(item, { exact: true })).toBeHidden();
  };
}

/** The fill painted at the centre of each bar; the bar labels sit outside the bars. */
async function barColours(page: Page, bars: Locator[]) {
  const boxes = await Promise.all(bars.map((bar) => bar.boundingBox()));
  return paintAt(
    page,
    boxes.map((box) => {
      if (!box) throw new Error("Missing bar bounds");
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    }),
  );
}

const bar = (slide: Locator, name: string) => slide.getByLabel(name, { exact: true });

/** West, North and East stack in that order, and West's fill stands out or matches the others. */
async function ranking(slide: Locator, page: Page, leaderStandsOut: boolean) {
  const west = bar(slide, "West: 84");
  const north = bar(slide, "North: 60");
  const east = bar(slide, "East: 36");
  await expect(west).toBeVisible();
  const top = (bar: Locator) => bar.evaluate((element) => element.getBoundingClientRect().top);
  await expect
    .poll(async () => {
      const [westY, northY, eastY] = await Promise.all([top(west), top(north), top(east)]);
      return westY < northY && northY < eastY;
    })
    .toBe(true);
  await expect
    .poll(async () => {
      const [leader, runnerUp, third] = await barColours(page, [west, north, east]);
      return { leaderStandsOut: leader !== runnerUp, othersMatch: runnerUp === third };
    })
    .toEqual({ leaderStandsOut, othersMatch: true });
}

/**
 * Whether the highlight paints behind "who goes next": the colour at the top left of its first
 * line against the gap just before it, both from one screenshot.
 */
async function highlighted(slide: Locator) {
  const emphasis = slide.getByText("who goes next", { exact: true });
  await expect(emphasis).toBeVisible();
  const line = await emphasis.evaluate((element) => {
    const first = element.getClientRects()[0];
    if (!first) throw new Error("The emphasis has no line box");
    return { x: first.x, y: first.y };
  });
  const [inside, before] = await paintAt(slide.page(), [
    { x: line.x + 2, y: line.y + 2 },
    { x: line.x - 3, y: line.y + 2 },
  ]);
  return inside !== before;
}

async function routingFocus(slide: Locator, label: string | undefined, zoom: number) {
  const diagram = slide.getByRole("region", { name: "Routing diagram" });
  const map = diagram.getByRole("img", { name: "Request flow from intake to dispatch" });
  const focus = label ? map.getByText(label, { exact: true }) : map;
  await expect(focus).toBeVisible();
  await expect
    .poll(async () => {
      const [frame, landmark, image] = await Promise.all([
        diagram.boundingBox(),
        focus.boundingBox(),
        map.boundingBox(),
      ]);
      if (!frame || !landmark || !image) throw new Error("Missing routing diagram bounds");
      return {
        centered:
          Math.abs(frame.x + frame.width / 2 - (landmark.x + landmark.width / 2)) < 1 &&
          Math.abs(frame.y + frame.height / 2 - (landmark.y + landmark.height / 2)) < 4,
        zoom: Math.round((image.width / frame.width) * 100) / 100,
      };
    })
    .toEqual({ centered: true, zoom });
}

const codeShows =
  (click: number): Pose =>
  (slide) =>
    expect(slide.getByRole("figure")).toHaveText(`route.ts ${code[click]}`, {
      useInnerText: true,
    });

/** Each recipe's slide number, title and the pose it shows at each click, from 0 to the last. */
const recipes: [number, string, Pose[]][] = [
  [
    1,
    "The median wait exceeds half an hour.",
    [
      async (slide) => {
        await expect(slide.getByText("Demo data · Median wait before routing")).toBeVisible();
        await expect(slide.getByText("minutes", { exact: true })).toBeHidden();
      },
      async (slide) => {
        await expect(slide.getByText("Demo data · Median wait before routing")).toBeVisible();
        await expect(slide.getByText("minutes", { exact: true })).toBeVisible();
        await expect(slide.getByText("42", { exact: true }).last()).toBeVisible();
      },
    ],
  ],
  [
    2,
    "West handles the most requests.",
    [
      async (slide) => {
        await expect(bar(slide, "North: 60")).toBeVisible();
        await expect(bar(slide, "East: 36")).toBeVisible();
        await expect(bar(slide, "West: 84")).toBeHidden();
        await expect(slide.getByText("West", { exact: true })).toBeHidden();
      },
      (slide, page) => ranking(slide, page, false),
      (slide, page) => ranking(slide, page, true),
    ],
  ],
  [
    3,
    "Routing rules give each request an owner.",
    [0, 1].map((shown) => async (slide: Locator, page: Page) => {
      await expect(slide.getByRole("heading", { name: "Before" })).toBeVisible();
      await reveals(["The rules assign an owner at intake."], shown)(slide, page);
    }),
  ],
  [4, "The pilot ended manual sorting.", [0, 1, 2, 3, 4].map((shown) => reveals(timeline, shown))],
  [
    5,
    "Dispatchers need to see who owns the next request.",
    [
      (slide) => expect.poll(() => highlighted(slide)).toBe(false),
      (slide) => expect.poll(() => highlighted(slide)).toBe(true),
    ],
  ],
  [6, "Dispatch confirms the owner before handoff.", [0, 1, 2, 3].map((n) => reveals(steps, n))],
  [
    7,
    "Every request passes through a routing desk.",
    [
      (slide) => routingFocus(slide, undefined, 1),
      (slide) => routingFocus(slide, "Intake", 1.35),
      (slide) => routingFocus(slide, "Rules", 1.35),
      (slide) => routingFocus(slide, "Dispatch", 1.35),
    ],
  ],
  [8, "Urgent requests take the priority route.", [0, 1, 2].map(codeShows)],
];

for (const [no, title, poses] of recipes) {
  test(`"${title}" shows each click going forward, its start going back and its last click on reload`, async ({
    page,
    recipesURL,
  }) => {
    const last = poses.length - 1;
    const slide = page.locator("[data-deck-active]");
    const url = (click: number) =>
      new URL(`#/${no}${click ? `?clicks=${click}` : ""}`, recipesURL).href;
    const shows = async (click: number) => {
      await expect(page).toHaveURL(url(click));
      await expect(slide.getByRole("heading", { name: title, exact: true })).toBeVisible();
      await settled(page);
      await poses[click]?.(slide, page);
    };
    await page.goto(url(0));
    await shows(0);
    for (let click = 1; click <= last; click++) {
      await page.keyboard.press("ArrowRight");
      await shows(click);
    }
    for (let click = last; click > 0; click--) await page.keyboard.press("ArrowLeft");
    await shows(0);
    await page.goto(url(last));
    await page.reload();
    await shows(last);
  });
}

test("the code walkthrough glides the general token right without overshoot", async ({
  page,
  recipesURL,
}) => {
  await page.goto(new URL("#/8", recipesURL).href);
  const figure = page.locator("[data-deck-active]").getByRole("figure");
  await expect(figure).toHaveText(`route.ts ${code[0]}`, { useInnerText: true });
  await settled(page);
  // The reader runs in the page on every frame, so it finds the token by its text there.
  const movement = await record(figure, (element) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.textContent !== '"general"') continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      return range.getBoundingClientRect().x;
    }
    return Number.NaN;
  });
  await page.keyboard.press("ArrowRight");
  await expect(figure).toHaveText(`route.ts ${code[1]}`, { useInnerText: true });
  const samples = (await movement.log()).filter(Number.isFinite);
  const start = samples[0] ?? Number.NaN;
  const end = samples.at(-1) ?? Number.NaN;
  expect(end).toBeGreaterThan(start);
  expect(
    samples.some((x) => x > start + 1 && x < end - 1),
    "the token passes through an intermediate position",
  ).toBe(true);
  expect(Math.min(...samples), "the general token starts in place").toBeGreaterThanOrEqual(
    start - 1,
  );
  expect(Math.max(...samples), "the general token lands without overshoot").toBeLessThanOrEqual(
    end + 1,
  );
});
