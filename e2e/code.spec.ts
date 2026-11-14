import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect } from "@playwright/test";

import { lines, states, test } from "./fixtures/code.fixture";

test("A ts block uses theme variables for distinct keyword and string colors.", async ({
  page,
}) => {
  await page.goto("/#/24");
  const block = page.getByRole("figure");
  await expect(block).toContainText("session.ts");
  const keyword = block.getByText("type", { exact: true });
  const string = block.getByText('"speaker"', { exact: true }).first();
  await expect(keyword).toBeVisible();
  const colors = await Promise.all(
    [keyword, string].map((token) => token.evaluate((node) => getComputedStyle(node).color)),
  );
  expect(colors[0]).not.toBe(colors[1]);
  await block.evaluate((node) => {
    node.style.setProperty("--deck-code-keyword", "rgb(240, 180, 120)");
    node.style.setProperty("--deck-code-string", "rgb(120, 220, 180)");
  });
  await expect(keyword).toHaveCSS("color", "rgb(240, 180, 120)");
  await expect(string).toHaveCSS("color", "rgb(120, 220, 180)");
});

test("Three emphasis steps walk forward, reverse, and reload at their counted last click.", async ({
  page,
}) => {
  await page.goto("/#/25");
  for (const [click, active] of [
    [0, [2]],
    [1, [4, 5]],
    [2, [1, 2, 3, 4, 5, 6, 7, 8]],
  ] as const) {
    if (click) await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(new RegExp(`#/25${click ? `\\?clicks=${click}` : ""}$`));
    await states(page, [...active]);
  }
  await page.reload();
  await states(page, [1, 2, 3, 4, 5, 6, 7, 8]);
  await page.keyboard.press("ArrowLeft");
  await states(page, [4, 5]);
  await page.keyboard.press("ArrowLeft");
  await states(page, [2]);
  await expect(lines(page).first()).toHaveCSS("opacity", "0.35");
});

test("at=1 leaves lines unmarked at click zero and instant motion snaps to the step.", async ({
  page,
}) => {
  await page.goto("/?motion=instant#/24");
  await expect(lines(page)).toHaveCount(6);
  await expect(page.locator("[data-deck-active] [data-line-state]")).toHaveCount(0);
  await page.keyboard.press("ArrowRight");
  await states(page, [3, 4, 5, 6]);
  await expect(lines(page).first()).toHaveCSS("transition-duration", "0s");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("[data-deck-active] [data-line-state]")).toHaveCount(0);
});

test("lines=10 numbers the first physical line 10 without adding selectable text.", async ({
  page,
}) => {
  await page.goto("/#/24");
  const first = lines(page).first();
  await expect(first).toBeVisible();
  await expect(first).toHaveAttribute("data-line-number", "10");
  expect(await first.evaluate((node) => getComputedStyle(node, "::before").content)).toBe('"10"');
  expect(await first.evaluate((node) => getComputedStyle(node, "::before").userSelect)).toBe(
    "none",
  );
  await expect(first).toHaveAttribute("data-line", "1");
  expect(await first.textContent()).not.toContain("10");
});

test("maxHeight reveals a below-fold active line within the block at any canvas scale.", async ({
  page,
  freshDeck,
}) => {
  await appendFile(
    join(freshDeck.dir, "slides/01-code.mdx"),
    "\n\n<Step at={3}>Another beat</Step>",
  );
  const source = await readFile(join(freshDeck.dir, "slides/01-code.mdx"), "utf8");
  await writeFile(join(freshDeck.dir, "slides/02-code.mdx"), source.replace("{2|9}", "{9|2}"));
  await page.setViewportSize({ width: 960, height: 540 });
  await page.goto(`${freshDeck.url}#/1`);
  const pre = page.getByRole("figure").locator("pre");
  await expect(pre).toHaveAttribute("tabindex", "0");
  const before = await page.evaluate(() => [scrollX, scrollY]);
  await page.keyboard.press("ArrowRight");
  await states(page, [9]);
  await expect
    .poll(() =>
      pre.evaluate((node) => {
        const active = node.querySelector('[data-line-state="active"]');
        if (!active) return false;
        const line = active.getBoundingClientRect();
        const block = node.getBoundingClientRect();
        return line.top >= block.top && line.bottom <= block.bottom && node.scrollTop > 0;
      }),
    )
    .toBe(true);
  expect(await page.evaluate(() => [scrollX, scrollY])).toEqual(before);
  await pre.evaluate((node) => {
    node.scrollTop = 0;
  });
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/1\?clicks=2$/);
  await expect.poll(() => pre.evaluate((node) => node.scrollTop)).toBe(0);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await states(page, [2]);
  await expect.poll(() => pre.evaluate((node) => node.scrollTop)).toBeLessThan(80);
  await expect(page.locator('[data-deck-slide="2"] [data-line]')).toHaveCount(12);
  await page.keyboard.press("ArrowDown");
  await expect(page).toHaveURL(/#\/2$/);
  await states(page, [9]);
  await expect
    .poll(() =>
      page.locator("[data-deck-active] pre").evaluate((node) => {
        const active = node.querySelector('[data-line-state="active"]');
        if (!active) return false;
        const line = active.getBoundingClientRect();
        const block = node.getBoundingClientRect();
        return line.top >= block.top && line.bottom <= block.bottom && node.scrollTop > 0;
      }),
    )
    .toBe(true);
});

test("A deck Step replaces the provided component and contributes no clicks.", async ({
  page,
  freshDeck,
}) => {
  await mkdir(join(freshDeck.dir, "components"));
  await writeFile(
    join(freshDeck.dir, "components/Step.tsx"),
    "export function Step() { return <p>Deck owns this step</p>; }",
  );
  await writeFile(
    join(freshDeck.dir, "slides/01-code.mdx"),
    "# Local component.\n\n<Step at={2} />",
  );
  await page.goto(`${freshDeck.url}#/1`);
  await expect(page.getByText("Deck owns this step")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/1$/);
});

test("A horizontally scrolling block is keyboard reachable without maxHeight.", async ({
  page,
  freshDeck,
}) => {
  await writeFile(
    join(freshDeck.dir, "slides/01-code.mdx"),
    `\`\`\`ts\nconst longLine = "${"readable ".repeat(15)}";\n\`\`\``,
  );
  await page.setViewportSize({ width: 3840, height: 1080 });
  await page.goto(`${freshDeck.url}#/1`);
  const pre = page.getByRole("figure").locator("pre");
  await expect.poll(() => pre.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await expect(pre).not.toHaveAttribute("tabindex");
  await page.setViewportSize({ width: 1920, height: 1080 });
  await expect.poll(() => pre.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
  await expect(pre).toHaveAttribute("tabindex", "0");
  await page.setViewportSize({ width: 3840, height: 1080 });
  await expect.poll(() => pre.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  await expect(pre).not.toHaveAttribute("tabindex");
});

test("Print shows every code line beyond the authored maxHeight.", async ({ page, freshDeck }) => {
  await page.goto(`${freshDeck.url}#/print`);
  const pre = page.getByRole("figure").locator("pre");
  await expect(pre).toHaveCount(2);
  for (const frame of await pre.all()) {
    await expect(frame).toHaveCSS("max-height", "none");
    await expect
      .poll(() =>
        frame.evaluate(
          (node) => node.clientHeight === node.scrollHeight && node.clientHeight > 180,
        ),
      )
      .toBe(true);
    await expect(frame.locator('[data-line="12"]')).toBeVisible();
  }
});

test("A fresh deck provides and counts Step and code without a components directory.", async ({
  page,
  freshDeck,
}) => {
  await writeFile(
    join(freshDeck.dir, "slides/01-code.mdx"),
    `# Provided components.

<Step at={1}>Framework step</Step>
<Steps from={1}><div>Framework list</div></Steps>
<Stagger at={1}><div>Framework group</div></Stagger>
<TextReveal at={1}>Framework words</TextReveal>
<Highlight at={1}>Framework highlight</Highlight>
<CountUp at={1} to={42} />
<svg role="img" aria-label="Framework drawing"><Draw at={1}><path d="M0 0L10 10" /></Draw></svg>
<Morph name="provided"><span>Framework morph</span></Morph>

\`\`\`ts title="provided.ts"
const provided = true;
\`\`\``,
  );
  await page.goto(`${freshDeck.url}#/1`);
  const step = page.getByText("Framework step");
  await expect(step).toHaveAttribute("data-step-state", "before");
  await expect(lines(page)).toHaveCount(1);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/1\?clicks=1$/);
  await expect(step).toHaveAttribute("data-step-state", "current");
  for (const text of [
    "Framework list",
    "Framework group",
    "Framework highlight",
    "Framework morph",
  ])
    await expect(page.getByText(text, { exact: true })).toBeVisible();
  await expect(page.getByText("words", { exact: true })).toBeVisible();
  await expect(page.getByText("42", { exact: true })).toHaveCount(2);
  await expect(
    page.getByRole("img", { name: "Framework drawing" }).locator("path"),
  ).toHaveAttribute("pathLength", "1");
  await expect(page.getByRole("figure")).toContainText("provided.ts");
});

test("Code edits hot-update and new steps reload the manifest without losing the URL.", async ({
  page,
  freshDeck,
}) => {
  await page.goto(`${freshDeck.url}#/1?clicks=1`);
  await states(page, [9]);
  const file = join(freshDeck.dir, "slides/01-code.mdx");
  const source = await readFile(file, "utf8");
  await page.evaluate(() => Reflect.set(window, "codeDocument", "original"));
  await writeFile(file, source.replace('"line 1"', '"edited line"'));
  await expect(page.getByText('"edited line"', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => Reflect.get(window, "codeDocument"))).toBe("original");
  const reloaded = page.waitForEvent("load");
  await writeFile(file, source.replace("{2|9}", "{2|9|all}"));
  await reloaded;
  expect(await page.evaluate(() => Reflect.get(window, "codeDocument"))).toBeUndefined();
  await states(page, [9]);
  await expect(page).toHaveURL(/#\/1\?clicks=1$/);
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/#\/1\?clicks=2$/);
  await states(
    page,
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
});
