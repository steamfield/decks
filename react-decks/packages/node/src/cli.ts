#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { defineCommand, runMain } from "citty";
import pc from "picocolors";
import { z } from "zod";
import { loadDeck } from "./config";
import { build, dev } from "./server";

const registrySchema = z.record(z.string(), z.unknown());
const entrySchema = z.object({ dir: z.string() });
const defaultsSchema = z.object({
  outDir: z.string().default("dist/{name}"),
  base: z.string().default("/"),
});

async function resolveDeck(value: string) {
  const registryPath = resolve("decks.json");
  const registry = existsSync(registryPath)
    ? registrySchema.parse(JSON.parse(await readFile(registryPath, "utf8")))
    : {};
  const defaults = defaultsSchema.parse(registry._config ?? {});
  const entry =
    !value.startsWith("_") && Object.hasOwn(registry, value) ? registry[value] : undefined;
  if (entry !== undefined) {
    return { deck: await loadDeck(entrySchema.parse(entry).dir, value), defaults };
  }
  if (!existsSync(value)) throw new Error(`Unknown deck "${value}"`);
  return { deck: await loadDeck(value, basename(resolve(value))), defaults };
}

const deckArg = {
  type: "positional",
  required: true,
  description: "Deck alias or directory",
} as const;
const main = defineCommand({
  meta: { name: "decks" },
  subCommands: {
    dev: defineCommand({
      args: { deck: deckArg, port: { type: "string" }, open: { type: "boolean", default: false } },
      async run({ args }) {
        const { deck } = await resolveDeck(args.deck);
        const port =
          args.port === undefined
            ? undefined
            : z.coerce.number().int().min(0).max(65535).parse(args.port);
        const server = await dev(deck, { port, open: args.open });
        console.log(pc.green(server.url));
      },
    }),
    build: defineCommand({
      args: { deck: deckArg, out: { type: "string" }, base: { type: "string" } },
      async run({ args }) {
        const { deck, defaults } = await resolveDeck(args.deck);
        await build(deck, {
          outDir: args.out ?? defaults.outDir.replaceAll("{name}", deck.name),
          base: args.base ?? defaults.base,
        });
      },
    }),
  },
});

await runMain(main);
