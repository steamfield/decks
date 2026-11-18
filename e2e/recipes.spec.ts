import { expect, type Locator, test } from "@playwright/test";
import { settled } from "./fixtures/deck-driver";
import { deckServer } from "./fixtures/deck-server";
import { record } from "./fixtures/motion-recorder";

const timeline = ["Pilot opened.", "West joined.", "Rules went live.", "Manual sorting ended."];
const process = ["Read the request.", "Pick a route.", "Confirm the owner."];
const codeTitle = "Urgent requests take the priority route.";
const code = [
  'const queue = "general";',
  'const queue = request.urgent ? "priority" : "general";',
  'const queue = request.urgent ? "priority" : "general"; dispatch(queue, request);',
];

async function expectReveals(slide: Locator, items: string[], click: number) {
  for (const [index, item] of items.entries()) {
    const text = slide.getByText(item, { exact: true });
    if (index < click) await expect(text).toBeVisible();
    else await expect(text).toBeHidden();
  }
}

const recipes = [
  {
    title: "The median wait exceeds half an hour.",
    clicks: 1,
    async pose(slide: Locator, click: number) {
      await expect(slide.getByText("Demo data · Median wait before routing")).toBeVisible();
      const minutes = slide.getByText("minutes", { exact: true });
      if (click) {
        await expect(minutes).toBeVisible();
        await expect(slide.getByText("42", { exact: true }).last()).toBeVisible();
      } else await expect(minutes).toBeHidden();
    },
  },
  {
    title: "West handles the most requests.",
    clicks: 2,
    async pose(slide: Locator, click: number) {
      const west = slide.getByLabel("West: 84", { exact: true });
      const north = slide.getByLabel("North: 60", { exact: true });
      const east = slide.getByLabel("East: 36", { exact: true });
      await expect(north).toBeVisible();
      await expect(east).toBeVisible();
      if (click === 0) {
        await expect(west).toBeHidden();
        await expect(slide.getByText("West", { exact: true })).toBeHidden();
        return;
      }
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
          const fill = (bar: Locator) =>
            bar.locator("path, rect").evaluate((element) => getComputedStyle(element).fill);
          const [leader, runnerUp, third] = await Promise.all([
            fill(west),
            fill(north),
            fill(east),
          ]);
          return { contextMatches: runnerUp === third, leaderMatches: leader === runnerUp };
        })
        .toEqual({ contextMatches: true, leaderMatches: click === 1 });
    },
  },
  {
    title: "Routing rules give each request an owner.",
    clicks: 1,
    async pose(slide: Locator, click: number) {
      await expect(slide.getByRole("heading", { name: "Before" })).toBeVisible();
      await expectReveals(slide, ["The rules assign an owner at intake."], click);
    },
  },
  {
    title: "The pilot ended manual sorting.",
    clicks: 4,
    pose: (slide: Locator, click: number) => expectReveals(slide, timeline, click),
  },
  {
    title: "Dispatchers need to see who owns the next request.",
    clicks: 1,
    async pose(slide: Locator, click: number) {
      const emphasis = slide.getByText("who goes next", { exact: true });
      await expect(emphasis).toBeVisible();
      await expect(emphasis).toHaveCSS("background-size", click ? "100% 100%" : "0% 100%");
    },
  },
  {
    title: "Dispatch confirms the owner before handoff.",
    clicks: 3,
    pose: (slide: Locator, click: number) => expectReveals(slide, process, click),
  },
  {
    title: "Every request passes through a routing desk.",
    clicks: 3,
    async pose(slide: Locator, click: number) {
      const diagram = slide.getByRole("region", { name: "Routing diagram" });
      const map = diagram.getByRole("img", { name: "Request flow from intake to dispatch" });
      const label = ["", "Intake", "Rules", "Dispatch"][click];
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
        .toEqual({ centered: true, zoom: click ? 1.35 : 1 });
    },
  },
  {
    title: codeTitle,
    clicks: 2,
    async pose(slide: Locator, click: number) {
      await expect(slide.getByRole("figure")).toHaveText(`route.ts ${code[click]}`, {
        useInnerText: true,
      });
    },
  },
];

test("each recipe slide forward to its last click, back to 0 and reload at the last click give the same end state", async ({
  browser,
  page,
}) => {
  const server = await deckServer(browser, "examples/recipes");
  try {
    await page.goto(new URL("#/1", server.url).href);
    const slide = page.locator("[data-deck-active]");
    for (const [index, recipe] of recipes.entries()) {
      await test.step(recipe.title, async () => {
        const url = (click: number) => {
          const hash = `#/${index + 1}${click ? `?clicks=${click}` : ""}`;
          return new URL(hash, server.url).href;
        };
        const position = async (click: number) => {
          await expect(page).toHaveURL(url(click));
          await expect(
            slide.getByRole("heading", { name: recipe.title, exact: true }),
          ).toBeVisible();
          await settled(page);
          await recipe.pose(slide, click);
        };

        await position(0);
        for (let click = 1; click <= recipe.clicks; click++) {
          const movement =
            recipe.title === codeTitle && click === 1
              ? await record(slide.getByRole("figure"), (figure) => {
                  const token = Array.from(figure.querySelectorAll("pre span")).find(
                    (element) => element.textContent === '"general"',
                  );
                  return token?.getBoundingClientRect().x ?? Number.NaN;
                })
              : undefined;
          await page.keyboard.press("ArrowRight");
          await position(click);
          if (movement) {
            const samples = (await movement.log()).filter(Number.isFinite);
            const start = samples[0];
            const end = samples.at(-1);
            if (start === undefined || end === undefined) throw new Error("Missing general token");
            expect(end).toBeGreaterThan(start);
            expect(
              Math.min(...samples),
              "the general token starts in place",
            ).toBeGreaterThanOrEqual(start - 1);
            expect(
              Math.max(...samples),
              "the general token lands without overshoot",
            ).toBeLessThanOrEqual(end + 1);
          }
        }
        for (let click = 0; click < recipe.clicks; click++) {
          await page.keyboard.press("ArrowLeft");
        }
        await position(0);

        await page.goto(url(recipe.clicks));
        await page.reload();
        await position(recipe.clicks);

        if (index < recipes.length - 1) await page.keyboard.press("ArrowDown");
      });
    }
  } finally {
    await server.close();
  }
});
