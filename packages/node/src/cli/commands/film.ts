import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { defineCommand } from "citty";
import { launchBrowser, openBuiltPage } from "../../dev/browser";
import { contactSheet } from "../../dev/contact-sheet";
import { DeckError } from "../../dev/errors";
import { captureStep, installFilmClock } from "../../dev/film-capture";
import { build } from "../../dev/server";
import { scanSlides } from "../../mdx/slides";
import { resolveDeck } from "../registry";

export const film = defineCommand({
  meta: { name: "decks film", description: "Capture the motion of one click as a contact sheet" },
  args: {
    deck: { type: "positional", required: true, description: "Deck alias or directory" },
    slide: { type: "positional", required: true, description: "Destination slide" },
    click: { type: "positional", description: "Destination click (default 0)", required: false },
    frames: { type: "string", default: "6", description: "Frames on the sheet (2–24)" },
    out: { type: "string", default: "film.png", description: "Output PNG path" },
    width: { type: "string", default: "1280", description: "Frame and sheet width" },
    height: { type: "string", default: "720", description: "Frame height" },
  },
  setup({ rawArgs }) {
    const frameOption = rawArgs.indexOf("--frames");
    const frameValue = rawArgs[frameOption + 1];
    if (frameOption >= 0 && frameValue && /^-\d/.test(frameValue)) throw invalidFrames(frameValue);
    let positionals: string[];
    try {
      ({ positionals } = parseArgs({
        args: rawArgs,
        options: {
          frames: { type: "string" },
          out: { type: "string" },
          width: { type: "string" },
          height: { type: "string" },
        },
        allowPositionals: true,
      }));
    } catch (cause) {
      throw new DeckError(
        cause instanceof Error ? cause.message : String(cause),
        undefined,
        undefined,
        { cause },
      );
    }
    if (positionals.length > 3)
      throw new DeckError(
        `Unexpected argument "${positionals[3]}". Pass a deck, slide and optional click.`,
      );
  },
  async run({ args }) {
    const { deck } = await resolveDeck(args.deck);
    const slides = await scanSlides(deck);
    const slide = wholeNumber(args.slide, "slide", 1);
    const click = wholeNumber(args.click ?? "0", "click", 0);
    const width = wholeNumber(args.width, "width", 1);
    const height = wholeNumber(args.height, "height", 1);
    const count = Number(args.frames);
    if (!/^\d+$/.test(args.frames) || count < 2 || count > 24) throw invalidFrames(args.frames);
    const target = slides[slide - 1];
    if (!target) throw new DeckError(`Unknown slide ${slide}. Use 1 through ${slides.length}.`);
    if (click > target.meta.clicks)
      throw new DeckError(`Slide ${slide} has ${target.meta.clicks} clicks, got ${click}.`);
    if (slide === 1 && click === 0)
      throw new DeckError("nothing precedes slide 1 click 0; film a later step");
    const previous = click ? slide : slide - 1;
    const previousClick = click ? click - 1 : slides[previous - 1]?.meta.clicks;
    const path = `#/${previous}?clicks=${previousClick}`;
    const out = resolve(args.out);
    const browser = await launchBrowser();
    let outDir: string | undefined;
    try {
      outDir = await mkdtemp(join(tmpdir(), "decks-film-"));
      await build(deck, { outDir, base: "./", ogImage: false });
      const pass = async (dir: string, times?: number[]) => {
        const capture = await openBuiltPage(
          browser,
          dir,
          "./",
          path,
          { width, height },
          installFilmClock,
        );
        try {
          const result = await captureStep(capture.page, slide, click, times);
          if (capture.errors.length)
            throw new DeckError(`Cannot film ${deck.dir}: ${capture.errors.join("; ")}`);
          return result;
        } finally {
          await capture.page.close();
          await capture.close();
        }
      };
      const { span } = await pass(outDir);
      const times = Array.from({ length: count }, (_, i) => Math.round((i * span) / (count - 1)));
      const { frames } = await pass(outDir, times);
      const sheetPage = await browser.newPage({
        viewport: { width, height },
        deviceScaleFactor: 1,
      });
      const png = await contactSheet(sheetPage, frames, times);
      await mkdir(dirname(out), { recursive: true });
      await writeFile(out, png);
      console.log(out);
    } finally {
      await browser.close();
      if (outDir) await rm(outDir, { recursive: true, force: true });
    }
  },
});

function invalidFrames(value: string) {
  return new DeckError(`Invalid --frames "${value}". Use a whole number from 2 to 24.`);
}

function wholeNumber(value: string, name: string, min: number) {
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < min)
    throw new DeckError(`Invalid ${name} "${value}". Use a whole number ${min} or greater.`);
  return number;
}
