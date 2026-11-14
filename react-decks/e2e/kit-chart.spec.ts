import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { dev, loadDeck } from "@react-decks/node";
import { settled } from "./fixtures/kit.fixture";

test("An OpenChart fills its counter-scaled host on a cold 1280x720 load", async ({ page }) => {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/kit-chart-"));
  try {
    await mkdir(join(dir, "node_modules/@react-decks"), { recursive: true });
    for (const name of ["node", "runtime", "motion", "kit"])
      await symlink(
        resolve(`packages/${name}`),
        join(dir, `node_modules/@react-decks/${name}`),
        "dir",
      );
    for (const sub of ["slides", "components", "styles"]) await mkdir(join(dir, sub));
    await writeFile(join(dir, "package.json"), '{"private":true,"type":"module"}');
    await writeFile(join(dir, "deck.config.ts"), 'export default { title: "Chart geometry" };');
    await writeFile(
      join(dir, "setup.ts"),
      'import { installTheme, resolveTheme } from "@react-decks/kit"; installTheme(resolveTheme());',
    );
    await writeFile(join(dir, "styles/index.css"), '@import "@react-decks/kit/styles.css";');
    await writeFile(join(dir, "slides/01-chart.mdx"), "<ChartProbe />");
    await writeFile(
      join(dir, "components/ChartProbe.tsx"),
      `
import { OpenChart, scaleChartTheme, slideChartTheme, useFrameScale } from "@react-decks/kit";
export function ChartProbe() {
 const scale = useFrameScale();
 return <section aria-label="Chart host" style={{ position: "absolute", inset: 100 }}><OpenChart spec={{
  mark: "bar", data: [{name:"A",value:3},{name:"B",value:6}],
  encoding: {x:{field:"name",type:"nominal"},y:{field:"value",type:"quantitative"}},
  theme: scaleChartTheme(slideChartTheme, scale), animation: false
 }} /></section>;
}`,
    );
    const server = await dev(await loadDeck(dir), { port: 0 });
    try {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto(server.url);
      const host = page.getByRole("region", { name: "Chart host" });
      await expect(host.locator("svg").first()).toBeVisible();
      await settled(page);
      for (const viewport of [
        { width: 1280, height: 720 },
        { width: 1600, height: 900 },
      ]) {
        await page.setViewportSize(viewport);
        await expect
          .poll(async () => {
            const outer = await host.boundingBox();
            const svg = await host.locator("svg").first().boundingBox();
            if (!outer || !svg) return Infinity;
            return Math.max(Math.abs(outer.width - svg.width), Math.abs(outer.height - svg.height));
          })
          .toBeLessThanOrEqual(1);
      }
    } finally {
      await server.close();
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
