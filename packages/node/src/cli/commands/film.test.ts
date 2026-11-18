import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PNG } from "pngjs";
import { expect, it, onTestFinished } from "vitest";
import { launchBrowser } from "../../dev/browser";
import { contactSheet } from "../../dev/contact-sheet";
import { cli, fixture, skipBrowserTests } from "../../dev/server.test-support";

// A loaded worker needs about 11 seconds per CLI build and two Chromium passes.
const timeout = 90_000;
async function run(dir: string, args: string[]) {
  const process = cli(dir, ["film", dir, ...args]);
  const [code] = await process.exit;
  return { code, ...process.output() };
}

async function fadeDeck() {
  return fixture(onTestFinished, {
    "slides/01-first.mdx":
      '---\nclicks: 1\ntransition: fade\n---\n<Step at={1}><div className="outgoing" /></Step>',
    "slides/02-hidden.mdx": "---\nhide: true\n---\n# Hidden",
    "slides/03-next.mdx": '<div className="incoming" />',
    "styles/index.css":
      ":root {--deck-dur-base:300ms;--deck-dur-slow:300ms} .outgoing, .incoming {position:absolute;inset:0} .outgoing {background:red} .incoming {background:blue}",
  });
}

async function sheet(dir: string) {
  const path = join(dir, "film.png");
  expect(await run(dir, ["2", "--frames", "3", "--width", "480", "--height", "270"])).toEqual({
    code: 0,
    stdout: `${path}\n`,
    stderr: "",
  });
  return readFile(path);
}

it.skipIf(skipBrowserTests)(
  "films a fade transition: first frame is the old slide, last the new one, a middle frame differs from both",
  { timeout },
  async () => {
    const { dir } = await fadeDeck();
    const png = PNG.sync.read(await sheet(dir));
    const samples = [80, 240, 400].map((x) => {
      const offset = (45 * png.width + x) * 4;
      return Array.from(png.data.subarray(offset, offset + 3));
    });
    expect(samples[0]).toEqual([255, 0, 0]);
    expect(samples[2]).toEqual([0, 0, 255]);
    expect(samples[1]?.[0]).toBeGreaterThan(0);
    expect(samples[1]?.[2]).toBeGreaterThan(0);
    const labels = await labelBand([0, 150, 300]);
    expect(png.data.subarray(480 * 90 * 4).equals(labels)).toBe(true);
  },
);

it.skipIf(skipBrowserTests)(
  "films the same step twice and gets identical sheets",
  { timeout },
  async () => {
    const { dir } = await fadeDeck();
    const first = await sheet(dir);
    expect((await sheet(dir)).equals(first)).toBe(true);
  },
);

async function rejection(args: string[], message: string) {
  const { dir } = await fixture(onTestFinished, {
    "slides/01-first.mdx": "---\nclicks: 2\n---\n# First",
  });
  expect(await run(dir, args)).toEqual({ code: 1, stdout: "", stderr: `decks film: ${message}\n` });
}

it("rejects an unknown slide naming the valid range", { timeout }, () =>
  rejection(["2"], "Unknown slide 2. Use 1 through 1."),
);
it("rejects a click above the slide's clicks naming both numbers", { timeout }, () =>
  rejection(["1", "3"], "Slide 1 has 2 clicks, got 3."),
);
it("rejects slide 1 click 0 saying nothing precedes it", { timeout }, () =>
  rejection(["1"], "nothing precedes slide 1 click 0; film a later step"),
);
it("rejects --frames below 2 or above 24", { timeout }, async () => {
  for (const value of ["1", "25", "-1"])
    await rejection(
      ["1", "1", "--frames", value],
      `Invalid --frames "${value}". Use a whole number from 2 to 24.`,
    );
});

it.skipIf(skipBrowserTests)(
  "fails with the busy report when motion runs past 10 s of virtual time",
  { timeout },
  async () => {
    const { dir } = await fixture(onTestFinished, {
      "slides/01-first.mdx": "---\nclicks: 1\n---\n<Busy />",
      "components/Busy.tsx": `import {useLayoutEffect} from "react";
import {useSlide, registerSettleProbe} from "@react-decks/runtime";
export function Busy() {
  const {clicks} = useSlide();
  useLayoutEffect(() => registerSettleProbe(() => clicks > 0), [clicks]);
  return <p>Loading</p>;
}`,
    });
    expect(await run(dir, ["1", "1"])).toEqual({
      code: 1,
      stdout: "",
      stderr:
        "decks film: slide 1 click 1 did not settle within 10 s of motion; still busy: settle probe\n",
    });
  },
);

it.skipIf(skipBrowserTests)(
  "fails with the page error, not a settle timeout, when a slide's load throws after mount",
  { timeout },
  async () => {
    // The load fails before it can finish, so its probe stays busy past the 10 s limit.
    const { dir } = await fixture(onTestFinished, {
      "slides/01-first.mdx": "# First",
      "slides/02-broken.mdx": "<Broken />",
      "components/Broken.tsx": `import {useEffect} from "react";
import {useSlide, registerSettleProbe} from "@react-decks/runtime";
export function Broken() {
  const {isActive} = useSlide();
  useEffect(() => {
    if (!isActive) return;
    const remove = registerSettleProbe(() => true, "broken load");
    queueMicrotask(() => { throw new Error("Broken after mount"); });
    return remove;
  }, [isActive]);
  return <p>Broken</p>;
}`,
    });
    expect(await run(dir, ["2"])).toEqual({
      code: 1,
      stdout: "",
      stderr: `decks film: Cannot film ${dir}: Broken after mount\n`,
    });
  },
);

async function labelBand(times: number[]) {
  const browser = await launchBrowser();
  onTestFinished(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 480, height: 270 } });
  const blank = PNG.sync.write(new PNG({ width: 480, height: 270 }));
  const reference = PNG.sync.read(
    await contactSheet(
      page,
      times.map(() => blank),
      times,
    ),
  );
  return reference.data.subarray(480 * 90 * 4);
}

it.skipIf(skipBrowserTests)(
  "films a cut from a slide with a focused input and labels every destination frame zero",
  { timeout },
  async () => {
    const { dir } = await fixture(onTestFinished, {
      "slides/01-first.mdx": '---\ntransition: cut\n---\n<input autoFocus aria-label="Answer" />',
      "slides/02-next.mdx": '<div style={{position:"absolute", inset:0, background:"blue"}} />',
    });
    const png = PNG.sync.read(await sheet(dir));
    for (const x of [80, 240, 400]) {
      const offset = (45 * png.width + x) * 4;
      expect(Array.from(png.data.subarray(offset, offset + 3))).toEqual([0, 0, 255]);
    }
    expect(png.data.subarray(480 * 90 * 4).equals(await labelBand([0, 0, 0]))).toBe(true);
  },
);
