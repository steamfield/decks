import { readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { defineCommand, showUsage } from "citty";
import { glob } from "tinyglobby";
import { loadDeck } from "../config";
import { DeckError } from "../errors";
import { readRegistry, resolveDeck } from "../registry";
import { loadPatterns, patternsFile } from "./prose-patterns";
import type { ProseHit } from "./prose-scan";

export const lint = defineCommand({
  meta: { name: "decks lint", description: "Lint deck prose for AI rhetoric" },
  args: {
    decks: {
      type: "positional",
      required: false,
      description: "Deck aliases (default: every registered deck)",
    },
    stdin: { type: "boolean", default: false, description: "Lint MDX read from stdin" },
  },
  async run({ rawArgs }) {
    if (rawArgs.includes("--help") || rawArgs.includes("-h")) return showUsage(lint);
    let parsed: ReturnType<typeof parseArgs>;
    try {
      parsed = parseArgs({
        args: rawArgs,
        options: { stdin: { type: "boolean" } },
        allowPositionals: true,
      });
    } catch (cause) {
      throw new DeckError(cause instanceof Error ? cause.message : String(cause));
    }
    let hits: ProseHit[];
    const { scanSource, formatHit } = await import("./prose-scan");
    let patterns: ReturnType<typeof loadPatterns>;
    try {
      patterns = loadPatterns();
    } catch (cause) {
      console.error(
        `error: patterns file missing, unreadable or invalid: ${patternsFile} (${cause instanceof Error ? cause.message : String(cause)})`,
      );
      process.exitCode = 2;
      return;
    }
    if (parsed.values.stdin) {
      if (parsed.positionals.length) throw new DeckError("--stdin takes no targets.");
      let source = "";
      process.stdin.setEncoding("utf8");
      for await (const chunk of process.stdin) source += chunk;
      hits = scanSource("stdin.mdx", source, patterns, { errorsOnly: false }).map((hit) => ({
        ...hit,
        file: "stdin",
      }));
    } else {
      const aliases = parsed.positionals.length
        ? parsed.positionals
        : (await readRegistry()).decks.map((deck) => deck.alias);
      const decks = await Promise.all(
        aliases.map(async (alias) => {
          const { deck } = await resolveDeck(alias);
          return { alias, dir: deck.dir };
        }),
      );
      if (!decks.length) throw new DeckError("No decks found to lint.");
      hits = (await lintDecks(decks, { errorsOnly: false })).hits;
    }
    for (const hit of hits) console.log(formatHit(hit));
    if (hits.some((hit) => hit.severity === "error")) process.exitCode = 1;
  },
});

export interface LintResult {
  errors: number;
  warnings: number;
  hits: ProseHit[];
}

export async function lintDecks(
  decks: { alias: string; dir: string }[],
  options: { errorsOnly: boolean },
): Promise<LintResult> {
  const patterns = loadPatterns();
  const { scanSource } = await import("./prose-scan");
  const files = new Map<string, Awaited<ReturnType<typeof loadDeck>>>();
  for (const deck of decks) {
    const resolved = await loadDeck(deck.dir, deck.alias);
    for (const file of await glob(
      ["slides/**/*.mdx", "components/**/*.{ts,tsx}", "layers/**/*.{ts,tsx}"],
      { cwd: deck.dir, absolute: true, ignore: ["**/node_modules/**"] },
    ))
      files.set(file, resolved);
  }
  const hits: ProseHit[] = [];
  for (const [file, deck] of [...files].sort(([left], [right]) => left.localeCompare(right))) {
    const source = await readFile(file, "utf8");
    hits.push(
      ...scanSource(relative(process.cwd(), resolve(file)), source, patterns, {
        ...options,
        remarkPlugins: deck.config.mdx?.remarkPlugins,
      }),
    );
  }
  return {
    errors: hits.filter((hit) => hit.severity === "error").length,
    warnings: hits.filter((hit) => hit.severity === "warn").length,
    hits,
  };
}
