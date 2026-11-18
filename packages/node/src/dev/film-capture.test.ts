import { join } from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it, onTestFinished } from "vitest";
import { launchBrowser, openBuiltPage } from "./browser";
import { loadDeck } from "./config";
import { captureStep, installFilmClock } from "./film-capture";
import { build } from "./server";
import { fixture, skipBrowserTests } from "./server.test-support";

// One real build, then measure and sample in separate Chromium pages.
const timeout = 60_000;

async function filmStep(content: string, files: Record<string, string> = {}) {
  const { dir } = await fixture(onTestFinished, {
    "slides/01-first.mdx": `---\nclicks: 1\n---\n${content}`,
    "styles/index.css":
      ".field { position: absolute; inset: 0; background: black } .ink { position: absolute; inset: 0; background: white }",
    ...files,
  });
  const out = join(dir, "built");
  await build(await loadDeck(dir), { outDir: out, ogImage: false });
  const browser = await launchBrowser();
  onTestFinished(() => browser.close());
  async function pass(times?: number[], offset = 0) {
    const capture = await openBuiltPage(
      browser,
      out,
      "./",
      "#/1",
      { width: 320, height: 180 },
      installFilmClock,
    );
    try {
      await capture.page.clock.runFor(offset);
      return await captureStep(capture.page, 1, 1, times);
    } finally {
      await capture.page.close();
      await capture.close();
    }
  }
  const { span } = await pass();
  const { frames } = await pass([0, Math.round(span / 2), span]);
  return { span, frames, pass };
}

function filmBeat() {
  return filmStep('<div className="field"><Beat /></div>', {
    "components/Beat.tsx": `import { useRef } from "react";
import { useTimeline } from "@react-decks/motion";
export function Beat() {
  const ink = useRef(null);
  useTimeline((tl, beat) => { beat(0); tl.fromTo(ink.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "none" }); beat(1); });
  return <div className="ink" ref={ink} />;
}`,
  });
}

function pixel(frame: Buffer) {
  const { data, width, height } = PNG.sync.read(frame);
  return data[(width * (height / 2) + width / 2) * 4];
}

function expectReveal(frames: Buffer[]) {
  const samples = frames.map(pixel);
  expect(samples).toHaveLength(3);
  expect(samples[0]).toBe(0);
  expect(samples[2]).toBe(255);
  expect(samples[1]).toBeGreaterThan(0);
  expect(samples[1]).toBeLessThan(255);
}

describe.skipIf(skipBrowserTests)("controlled step capture", () => {
  it("films a CSS step reveal on a click with the same three-way difference", {
    timeout,
  }, async () => {
    const { frames } = await filmStep(
      '<div className="field"><Step at={1}><div className="ink" /></Step></div>',
    );
    expectReveal(frames);
  });

  it("films a gsap useTimeline beat with the same three-way difference", { timeout }, async () => {
    const { frames } = await filmBeat();
    expectReveal(frames);
  });

  it("replays a timeline at the same pixels across different page startup times", {
    timeout,
  }, async () => {
    const { span, pass } = await filmBeat();
    const times = [0, 123, 247, span];
    const a = await pass(times, 3);
    const b = await pass(times, 12);
    expect(b.frames).toEqual(a.frames);
  });

  it("a step with no motion gives a span of 0 and identical frames, and succeeds", {
    timeout,
  }, async () => {
    const { span, frames } = await filmStep("<Panel />", {
      "components/Panel.tsx": `import {useSlide} from "@react-decks/runtime";
export function Panel() {return <div className={useSlide().clicks ? "ink" : "field"} />}`,
    });
    expect(frames.map(pixel)).toEqual([255, 255, 255]);
    expect(span).toBe(0);
    expect(frames).toHaveLength(3);
    expect(frames[1]).toEqual(frames[0]);
    expect(frames[2]).toEqual(frames[0]);
  });
});

function webAnimation(onClick: string, setup = "", background = "black") {
  return filmStep("<Scene />", {
    "components/Scene.tsx": `import { useRef, useLayoutEffect } from "react";
import { gsap } from "@react-decks/motion";
import { useSlide, registerSettleProbe } from "@react-decks/runtime";
export function Scene() {
  const { clicks } = useSlide();
  const ref = useRef(null);
  const saved = useRef(null);
  useLayoutEffect(() => { const ink = ref.current; ${setup} }, []);
  useLayoutEffect(() => {
    if (!clicks) return;
    const ink = ref.current;
    const reveal = (duration, id) => ink.animate([{opacity: 0}, {opacity: 1}], {duration, id, fill: "forwards"});
    ${onClick}
  }, [clicks]);
  return <div className="field" style={{background: clicks ? "${background}" : "black"}}><div ref={ref} className="ink" style={{opacity: 0}} /></div>;
}`,
  });
}

describe.skipIf(skipBrowserTests)("authored Web Animations", () => {
  it("includes a reveal that starts on the second animation frame", { timeout }, async () => {
    const { frames } = await webAnimation(
      "requestAnimationFrame(() => requestAnimationFrame(() => reveal(300)));",
    );
    expectReveal(frames);
  });

  it("keeps animation birth on the same tick when a sample falls before it", {
    timeout,
  }, async () => {
    const { span, pass } = await webAnimation(`const remove = registerSettleProbe(() => true);
    setTimeout(() => { reveal(300); remove(); }, 70);`);
    const normal = await pass([0, 140, span]);
    const extra = await pass([0, 71, 140, span]);
    expect(extra.frames[2]).toEqual(normal.frames[1]);
    expect(extra.span).toBe(normal.span);
  });

  it("counts motion started by an animation's finished promise against the same ten seconds", {
    timeout,
  }, async () => {
    await expect(
      webAnimation("reveal(6000).finished.then(() => reveal(6000, 'tail'));"),
    ).rejects.toThrow("slide 1 click 1 did not settle within 10 s of motion; still busy: tail");
  });

  it("includes the gsap tween released by a finished browser animation in its span", {
    timeout,
  }, async () => {
    const { span, pass } = await webAnimation(
      "reveal(300).finished.then(() => gsap.to(ink, {x: 100, duration: 0.6}));",
    );
    expect(span).toBe(917);
    expect((await pass(undefined, 320)).span).toBe(span);
  });

  it("resumes a diagram from its authored pause and films only the remaining duration", {
    timeout,
  }, async () => {
    const { frames, span } = await webAnimation(
      "saved.current.play();",
      `
      saved.current = ink.animate([{opacity: 0}, {opacity: 1}], {duration: 600, fill: "forwards"});
      saved.current.pause();
      saved.current.currentTime = 120;
    `,
    );
    expect(span).toBe(480);
    expect(frames.map(pixel)[0]).toBe(51);
    expect(frames.map(pixel)[2]).toBe(255);
  });

  it("shows the click's immediate paint at zero while its reveal begins", { timeout }, async () => {
    const { frames } = await webAnimation("reveal(300);", "", "rgb(75, 75, 75)");
    expect(frames.map(pixel)[0]).toBe(75);
  });

  it("reports different measurement and capture spans before labelling a sheet", {
    timeout,
  }, async () => {
    const { pass } = await webAnimation("reveal(300);");
    await expect(pass([0, 150, 450])).rejects.toThrow(
      "slide 1 click 1 measured 450 ms in the first pass and 300 ms in the second pass.",
    );
  });
});
