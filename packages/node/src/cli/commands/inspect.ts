import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { parseArgs } from "node:util";
import { formatHash } from "@react-decks/core";
import { defineCommand } from "citty";
import { launchBrowser, openBuiltPage, waitForCapture } from "../../dev/browser";
import { DeckError } from "../../dev/errors";
import { layoutFindings } from "../../dev/layout-findings";
import { build } from "../../dev/server";
import { scanSlides } from "../../mdx/slides";
import { resolveDeck } from "../registry";

const maxFindingsPerSlide = 10;

export const inspect = defineCommand({
  meta: {
    name: "decks inspect",
    description: "Report content that overflows the canvas or its own box",
  },
  args: {
    deck: { type: "positional", required: true, description: "Deck alias or directory" },
    width: { type: "string", default: "1920", description: "Viewport width" },
    height: { type: "string", default: "1080", description: "Viewport height" },
  },
  setup({ rawArgs }) {
    try {
      const { positionals } = parseArgs({
        args: rawArgs,
        options: { width: { type: "string" }, height: { type: "string" } },
        allowPositionals: true,
      });
      if (positionals.length > 1)
        throw new DeckError(
          `Unexpected argument "${positionals[1]}". Pass one deck alias or directory.`,
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
    const width = viewportSize(args.width, "width");
    const height = viewportSize(args.height, "height");
    const slides = await scanSlides(deck);
    const outDir = await mkdtemp(join(tmpdir(), "decks-inspect-"));
    let findingsCount = 0;
    let slidesWithFindings = 0;
    try {
      await build(deck, { outDir, base: "./", ogImage: false });
      const browser = await launchBrowser();
      try {
        for (const { meta } of slides) {
          const label = `slide ${meta.no} (${basename(meta.file)})`;
          const hash = formatHash({ view: "play", slide: meta.no, click: meta.clicks });
          let capture: Awaited<ReturnType<typeof openBuiltPage>> | undefined;
          try {
            capture = await openBuiltPage(browser, outDir, "./", `?motion=instant${hash}`, {
              width,
              height,
            });
            await waitForCapture(capture.page);
            const findings = await layoutFindings(capture.page, meta.no, hash);
            if (capture.errors.length > 0) throw new DeckError(capture.errors.join("; "));
            if (findings.length > 0) slidesWithFindings++;
            findingsCount += findings.length;
            for (const { kind, pixels, side, selector, excerpt } of findings.slice(
              0,
              maxFindingsPerSlide,
            ))
              console.log(
                `${label}: ${kind} by ${Math.round(pixels)}px ${side}: ${selector} ${JSON.stringify(excerpt)}`,
              );
            const omitted = findings.length - maxFindingsPerSlide;
            if (omitted > 0) console.log(`... and ${omitted} more on slide ${meta.no}`);
          } catch (cause) {
            const message =
              capture?.errors.join("; ") ||
              (cause instanceof Error ? cause.message : String(cause));
            const prefix = `Cannot capture ${outDir}: `;
            const detail = message.startsWith(prefix) ? message.slice(prefix.length) : message;
            throw new DeckError(`Cannot capture ${label}: ${detail}`, undefined, undefined, {
              cause,
            });
          } finally {
            if (capture) {
              try {
                await capture.page.close();
              } finally {
                await capture.close();
              }
            }
          }
        }
      } finally {
        await browser.close();
      }
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }

    if (findingsCount === 0) {
      console.log(
        `no layout findings in ${slides.length} ${slides.length === 1 ? "slide" : "slides"}`,
      );
    } else {
      console.log(
        `${findingsCount} ${findingsCount === 1 ? "finding" : "findings"} in ${slidesWithFindings} ${slidesWithFindings === 1 ? "slide" : "slides"}`,
      );
      process.exitCode = 1;
    }
  },
});

function viewportSize(value: string, name: string): number {
  const number = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(number) || number < 1)
    throw new DeckError(`Invalid ${name} "${value}". Use a whole number 1 or greater.`);
  return number;
}
