import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { defineCommand } from "citty";
import { launchBrowser, openBuiltDeck } from "../browser";
import { DeckError } from "../errors";
import { resolveDeck } from "../registry";
import { build } from "../server";

export const exportDeck = defineCommand({
  meta: { name: "decks export", description: "Export a deck to PDF through the print view" },
  args: {
    deck: { type: "positional", required: true, description: "Deck alias or directory" },
    out: { type: "string", description: "PDF path" },
    final: {
      type: "boolean",
      default: false,
      description: "One page per slide at its final click",
    },
  },
  setup({ rawArgs }) {
    try {
      const { positionals } = parseArgs({
        args: rawArgs,
        options: { out: { type: "string" }, final: { type: "boolean" } },
        allowPositionals: true,
        allowNegative: true,
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
    const { deck, defaults } = await resolveDeck(args.deck);
    const out = resolve(
      args.out ??
        join(dirname(defaults.outDir.replaceAll("{name}", deck.name)), `${deck.name}.pdf`),
    );
    const browser = await launchBrowser();
    let outDir: string | undefined;
    try {
      outDir = await mkdtemp(join(tmpdir(), "decks-export-"));
      await build(deck, { outDir, base: "./" });
      const capture = await openBuiltDeck(
        browser,
        outDir,
        "./",
        `${args.final ? "?print=final" : ""}#/print`,
      );
      try {
        await mkdir(dirname(out), { recursive: true });
        await capture.page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
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
