import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { defineCommand } from "citty";
import { launchBrowser, openBuiltDeck } from "../../dev/browser";
import { DeckError } from "../../dev/errors";
import { build } from "../../dev/server";
import { scanSlides } from "../../mdx/slides";
import { resolveDeck } from "../registry";

export const shot = defineCommand({
  meta: { name: "decks shot", description: "Screenshot one frame of a deck" },
  args: {
    deck: { type: "positional", required: true, description: "Deck alias or directory" },
    slide: { type: "positional", required: true, description: "Slide number" },
    clicks: { type: "positional", required: false, description: "Click step (default 0)" },
    out: { type: "string", description: "PNG path" },
    width: { type: "string", default: "1920", description: "PNG width" },
    height: { type: "string", default: "1080", description: "PNG height" },
  },
  setup({ rawArgs }) {
    try {
      const { positionals } = parseArgs({
        args: rawArgs,
        options: { out: { type: "string" }, width: { type: "string" }, height: { type: "string" } },
        allowPositionals: true,
      });
      if (positionals.length > 3)
        throw new DeckError(
          `Unexpected argument "${positionals[3]}". Pass a deck, slide and optional click.`,
        );
    } catch (cause) {
      if (cause instanceof DeckError) throw cause;
      throw new DeckError(
        cause instanceof Error ? cause.message : String(cause),
        undefined,
        undefined,
        { cause },
      );
    }
  },
  async run({ args }) {
    const { deck } = await resolveDeck(args.deck);
    const slides = await scanSlides(deck);
    const slide = wholeNumber(args.slide, "slide", 1);
    const clicks = wholeNumber(args.clicks ?? "0", "clicks", 0);
    const width = wholeNumber(args.width, "width", 1);
    const height = wholeNumber(args.height, "height", 1);
    const meta = slides[slide - 1];
    if (!meta) throw new DeckError(`Unknown slide ${slide}. Use 1 through ${slides.length}.`);
    if (clicks > meta.meta.clicks)
      throw new DeckError(`Slide ${slide} has ${meta.meta.clicks} clicks, got ${clicks}.`);
    const out = resolve(args.out ?? `slide-${slide}-c${clicks}.png`);
    const browser = await launchBrowser();
    let outDir: string | undefined;
    try {
      outDir = await mkdtemp(join(tmpdir(), "decks-shot-"));
      await build(deck, { outDir, base: "./", ogImage: false });
      const capture = await openBuiltDeck(
        browser,
        outDir,
        "./",
        `?motion=instant#/${slide}?clicks=${clicks}`,
        { width, height },
      );
      try {
        await mkdir(dirname(out), { recursive: true });
        await capture.page.screenshot({ path: out, type: "png" });
        console.log(out);
      } finally {
        await capture.close();
      }
    } finally {
      await browser.close();
      if (outDir) await rm(outDir, { recursive: true, force: true });
    }
  },
});

function wholeNumber(value: string, name: string, min: number): number {
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < min)
    throw new DeckError(`Invalid ${name} "${value}". Use a whole number ${min} or greater.`);
  return number;
}
