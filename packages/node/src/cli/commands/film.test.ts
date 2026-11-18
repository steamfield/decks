import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PNG } from "pngjs";
import { expect, it, onTestFinished } from "vitest";
import { cli, fixture, skipBrowserTests } from "../../dev/server.test-support";
import { frameTimes } from "./film";

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

it("rejects an unknown slide naming the valid range", () =>
  rejection(["2"], "Unknown slide 2. Use 1 through 1."));
it("rejects a click above the slide's clicks naming both numbers", () =>
  rejection(["1", "3"], "Slide 1 has 2 clicks, got 3."));
it("rejects slide 1 click 0 saying nothing precedes it", () =>
  rejection(["1"], "nothing precedes slide 1 click 0; film a later step"));
it.each(["1", "25", "-1"])("rejects --frames %s, outside 2 to 24", (value) =>
  rejection(
    ["1", "1", "--frames", value],
    `Invalid --frames "${value}". Use a whole number from 2 to 24.`,
  ),
);

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

it.each([
  [600, 6, [0, 120, 240, 360, 480, 600]],
  [917, 4, [0, 306, 611, 917]],
  [0, 3, [0, 0, 0]],
  [1000, 2, [0, 1000]],
])("spaces %i ms over %i frames from 0 to the span", (span, count, expected) => {
  expect(frameTimes(span, count)).toEqual(expected);
});
