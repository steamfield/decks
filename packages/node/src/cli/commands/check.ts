import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { basename, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { defineCommand } from "citty";
import { glob } from "tinyglobby";
import { loadDeck } from "../../dev/config";
import { DeckError } from "../../dev/errors";
import { renderNotes } from "../../mdx/notes";
import { readSource } from "../../mdx/read-source";
import { scanSlidesWithCounts } from "../../mdx/slides";
import { readRegistry } from "../registry";
import { lintDecks } from "./lint";

export const check = defineCommand({
  meta: {
    name: "decks check",
    description: "Check the deck registry, configs, slide names and error-level prose",
  },
  args: {},
  async run({ rawArgs }) {
    try {
      parseArgs({ args: rawArgs, options: {} });
    } catch (cause) {
      if (
        cause instanceof Error &&
        "code" in cause &&
        typeof cause.code === "string" &&
        cause.code.startsWith("ERR_PARSE_ARGS")
      )
        throw new DeckError(cause.message, undefined, undefined, { cause });
      throw cause;
    }
    const { defaults, decks } = await readRegistry();
    const problems: string[] = [];
    const registered = new Set(decks.map(({ dir }) => resolve(dir)));
    if (existsSync(defaults.decksDir)) {
      for (const entry of await readdir(defaults.decksDir, { withFileTypes: true })) {
        const dir = join(defaults.decksDir, entry.name);
        if (
          entry.isDirectory() &&
          existsSync(join(dir, "deck.config.ts")) &&
          !registered.has(resolve(dir))
        )
          problems.push(`unregistered: ${dir} (${join(dir, "deck.config.ts")})`);
      }
    }
    const present = [];
    for (const deck of decks) {
      for (const other of decks) {
        if (deck.alias !== other.alias && deck.alias === basename(other.dir))
          problems.push(
            `alias collision: ${deck.alias} (${deck.dir}) matches ${other.alias} -> ${other.dir}`,
          );
      }
      if (!existsSync(join(deck.dir, "deck.config.ts"))) {
        problems.push(
          `missing: ${deck.alias} -> ${deck.dir} (${join(deck.dir, "deck.config.ts")})`,
        );
        continue;
      }
      try {
        const loaded = await loadDeck(deck.dir, deck.alias);
        // Only a deck whose config loads can be linted; a broken one is already reported.
        present.push(deck);
        const { slides } = await scanSlidesWithCounts(loaded, new Map());
        // Cues marked with [click] belong to one click each; once the slide gains or loses a
        // click they drift onto the wrong step, which the presenter only finds on stage. A hidden
        // slide is not presented, so it is checked once it is restored.
        for (const { meta } of slides) {
          const { file, clicks } = meta;
          const path = join(deck.dir, file);
          const segments = await renderNotes(
            await readSource(path),
            path,
            loaded.config.mdx?.remarkPlugins,
          );
          const cues = segments?.at(-1)?.click ?? 0;
          if (cues > 0 && cues !== clicks)
            problems.push(
              `${deck.alias}: notes: ${path} has [click] cues for ${cues} click(s), but the slide has ${clicks}`,
            );
        }
      } catch (cause) {
        if (!(cause instanceof DeckError)) throw cause;
        if (
          cause.message.startsWith("no slides/*.mdx files in ") ||
          cause.message.startsWith("every slide in ")
        )
          problems.push(`no slides: ${deck.alias}`);
        else problems.push(...cause.message.split("\n").map((line) => `${deck.alias}: ${line}`));
      }
      const files = (await glob("slides/*.mdx", { cwd: deck.dir })).sort();
      const prefixes = files.map((file) => basename(file).match(/^(\d{2})-/)?.[1]);
      for (const [index, file] of files.entries()) {
        const prefix = prefixes[index];
        if (
          !/^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.mdx$/.test(basename(file)) ||
          (prefix !== undefined && prefixes.filter((value) => value === prefix).length > 1)
        )
          problems.push(`${deck.alias}: slide name: ${join(deck.dir, file)}`);
      }
    }
    const { errors } = await lintDecks(present, { errorsOnly: true });
    if (errors)
      problems.push(`${errors} error-level prose hit(s); run \`decks lint\` for all hits.`);
    for (const problem of problems) console.error(problem);
    if (problems.length) process.exitCode = 1;
    else console.log("All decks check out.");
  },
});
