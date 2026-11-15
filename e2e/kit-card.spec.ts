import { expect, test } from "@playwright/test";
import { kitFixture, settled } from "./fixtures/kit.fixture";

test("A card overlaps outgoing copy and eases its top edge to the new height", async ({ page }) => {
  const server = await kitFixture({
    "slides/01-card.mdx": "---\nclicks: 1\n---\n<CardProbe />",
    "components/CardProbe.tsx": `
import { StoryStage, StoryCard, useScriptedDemo } from "@steamfield/decks/kit";
export { gsap, DUR } from "@steamfield/decks/kit";
export function CardProbe() {
 const { clicks } = useScriptedDemo();
 return <StoryStage card={<section aria-label="Story card" style={{ position: "absolute", left: "6%", bottom: "12%", width: "36%" }}><StoryCard style={{ position: "relative", left: 0, bottom: 0, width: "100%" }} lead={clicks ? "A taller card" : "A short card"} body={clicks ? "A much longer explanation that wraps across several lines inside the card. ".repeat(5) : "One line."} /></section>} />;
}`,
  });
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(server.url);
    await page.evaluate(() => {
      const file = "/slides/01-card.mdx";
      return import(file);
    });
    await expect(page.getByText("A short card")).toBeVisible();
    await settled(page);
    const card = page.getByRole("region", { name: "Story card" });
    const from = await card.evaluate(async (element) => {
      const file = "/components/CardProbe.tsx";
      const { gsap } = await import(file);
      gsap.globalTimeline.pause();
      const { top, bottom } = element.getBoundingClientRect();
      return { top, bottom };
    });
    await page.keyboard.press("ArrowRight");
    await expect(page.getByText("A taller card")).toBeAttached();
    await expect(page.getByText("A short card")).toBeVisible();
    const frames = await card.evaluate(async (element) => {
      const file = "/components/CardProbe.tsx";
      const { gsap, DUR } = await import(file);
      const start = gsap.globalTimeline.time();
      const samples = [];
      for (const progress of [0, 0.5, 1]) {
        gsap.globalTimeline.time(start + DUR.card * progress);
        await Promise.resolve();
        samples.push({
          top: element.getBoundingClientRect().top,
          bottom: element.getBoundingClientRect().bottom,
        });
      }
      gsap.globalTimeline.resume();
      return samples;
    });
    const to = frames.at(-1);
    if (!to) throw new Error("Missing height samples");
    expect(to.top).toBeLessThan(from.top);
    expect(frames.some((frame) => frame.top < from.top && frame.top > to.top)).toBe(true);
    expect(frames.every((frame) => Math.abs(frame.bottom - from.bottom) < 1)).toBe(true);
    await expect(page.getByText("A short card")).toHaveCount(0);
  } finally {
    await server.close();
  }
});
