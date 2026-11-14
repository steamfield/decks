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
  base: z.string().default("./"),
});

async function resolveDeck(value: string) {
  const registryPath = resolve("decks.json");
  let defaults: z.infer<typeof defaultsSchema>;
  let entry: z.infer<typeof entrySchema> | undefined;
  try {
    const registry = existsSync(registryPath)
      ? registrySchema.parse(JSON.parse(await readFile(registryPath, "utf8")))
      : {};
    defaults = defaultsSchema.parse(registry._config ?? {});
    const registered =
      !value.startsWith("_") && Object.hasOwn(registry, value) ? registry[value] : undefined;
    entry = registered === undefined ? undefined : entrySchema.parse(registered);
  } catch (cause) {
    const problem =
      cause instanceof z.ZodError
        ? cause.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
        : cause instanceof Error
          ? cause.message
          : String(cause);
    // Citty prints Error causes verbatim, including Zod's raw validation dump.
    throw new Error(`${registryPath}: malformed decks.json: ${problem}`);
  }
  if (entry !== undefined) {
    return { deck: await loadDeck(entry.dir, value), defaults };
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
        if (args.port !== undefined && (!/^\d+$/.test(args.port) || Number(args.port) > 65535))
          throw new Error(`Invalid --port "${args.port}"`);
        const port = args.port === undefined ? undefined : Number(args.port);
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
