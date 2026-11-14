import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, isAbsolute, resolve } from "node:path";
import { type ParseArgsOptionsConfig, parseArgs } from "node:util";
import { defineCommand, renderUsage, runCommand, showUsage } from "citty";
import pc from "picocolors";
import { z } from "zod";
import { loadDeck } from "./config";
import { authorError, DeckError, validationError } from "./errors";
import { build, dev } from "./server";

const registrySchema = z.record(z.string(), z.unknown());
const entrySchema = z.object({ dir: z.string() });
const defaultsSchema = z.object({
  outDir: z.string().default("dist/{name}"),
  base: z.string().default("./"),
  decksDir: z.string().default("decks"),
});

async function resolveDeck(value: string) {
  const registryPath = resolve("decks.json");
  let defaults: z.infer<typeof defaultsSchema>;
  let entry: z.infer<typeof entrySchema> | undefined;
  let aliases: string[] = [];
  let validationInput: unknown;
  try {
    validationInput = existsSync(registryPath)
      ? JSON.parse(await readFile(registryPath, "utf8"))
      : {};
    const registry = registrySchema.parse(validationInput);
    aliases = Object.keys(registry).filter((key) => !key.startsWith("_"));
    validationInput = registry._config ?? {};
    defaults = defaultsSchema.parse(validationInput);
    const registered =
      !value.startsWith("_") && Object.hasOwn(registry, value) ? registry[value] : undefined;
    validationInput = registered;
    entry = registered === undefined ? undefined : entrySchema.parse(registered);
  } catch (cause) {
    if (cause instanceof z.ZodError)
      throw validationError(registryPath, cause.issues, validationInput);
    throw new DeckError(
      `malformed decks.json: ${cause instanceof Error ? cause.message : String(cause)}`,
      registryPath,
      undefined,
      { cause },
    );
  }
  if (entry !== undefined) {
    if (!existsSync(entry.dir))
      throw new DeckError(
        `decks.json entry ${JSON.stringify(value)} points at ${entry.dir.replace(/\/$/, "")}/, which does not exist.`,
      );
    return { deck: await loadDeck(entry.dir, value), defaults };
  }
  const directory =
    !isAbsolute(value) &&
    basename(value) === value &&
    !statSync(value, { throwIfNoEntry: false })?.isDirectory()
      ? resolve(defaults.decksDir, value)
      : value;
  if (!existsSync(directory))
    throw new DeckError(
      `${JSON.stringify(value)} is not a registered deck or a directory. Registered in decks.json: ${aliases.length ? aliases.join(", ") : "none"}.`,
    );
  return { deck: await loadDeck(directory, basename(resolve(directory))), defaults };
}

const deckArg = {
  type: "positional",
  required: true,
  description: "Deck alias or directory",
} as const;
const commands = {
  dev: defineCommand({
    meta: { name: "decks dev", description: "Serve a deck with live updates" },
    args: {
      deck: deckArg,
      port: { type: "string", description: "Port to listen on" },
      open: { type: "boolean", default: false, description: "Open the deck in a browser" },
    },
    async run({ args }) {
      const { deck } = await resolveDeck(args.deck);
      if (args.port !== undefined && (!/^\d+$/.test(args.port) || Number(args.port) > 65535))
        throw new DeckError(`Invalid --port "${args.port}". Use a whole number from 0 to 65535.`);
      const port = args.port === undefined ? undefined : Number(args.port);
      const server = await dev(deck, { port, open: args.open });
      console.log(pc.green(server.url));
    },
  }),
  build: defineCommand({
    meta: { name: "decks build", description: "Build a static deck site" },
    args: {
      deck: deckArg,
      out: { type: "string", description: "Output directory (emptied before building)" },
      base: { type: "string", description: "Base URL for the built site" },
    },
    async run({ args }) {
      const { deck, defaults } = await resolveDeck(args.deck);
      await build(deck, {
        outDir: args.out ?? defaults.outDir.replaceAll("{name}", deck.name),
        base: args.base ?? deck.config.vite?.base ?? defaults.base,
      });
    },
  }),
};
const main = defineCommand({
  meta: { name: "decks", description: "Develop and build React slide decks" },
  subCommands: commands,
});

export async function runCli(rawArgs: string[] = process.argv.slice(2)): Promise<void> {
  const command = rawArgs[0];
  try {
    if (command !== "dev" && command !== "build") {
      if (command === undefined) {
        console.error(await renderUsage(main));
        process.exitCode = 1;
      } else await showUsage(main);
      if (command && command !== "--help" && command !== "-h") {
        throw new DeckError(`unknown command ${JSON.stringify(command)}. Use dev or build.`);
      }
    } else if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
      if (command === "dev") await showUsage(commands.dev);
      else await showUsage(commands.build);
    } else {
      const options: ParseArgsOptionsConfig =
        command === "build"
          ? { out: { type: "string" }, base: { type: "string" } }
          : { port: { type: "string" }, open: { type: "boolean" } };
      try {
        const { positionals } = parseArgs({
          args: rawArgs.slice(1),
          options,
          allowPositionals: true,
          allowNegative: true,
        });
        if (positionals.length > 1)
          throw new DeckError(
            `unexpected argument ${JSON.stringify(positionals[1])}. Pass one deck alias or directory.`,
          );
      } catch (cause) {
        if (cause instanceof DeckError) throw cause;
        if (
          cause instanceof Error &&
          "code" in cause &&
          cause.code === "ERR_PARSE_ARGS_INVALID_OPTION_VALUE"
        ) {
          const option = cause.message.match(/Option '(--[^' ]+)/)?.[1];
          if (option)
            throw new DeckError(
              options[option.slice(2)]?.type === "boolean"
                ? `${option} does not take a value. Use ${option} or --no-${option.slice(2)}.`
                : `${option} needs a value. Pass ${option} ${option === "--port" ? "<n>, a whole number from 0 to 65535" : option === "--out" ? "<dir>" : "<path>"}.`,
            );
        }
        if (
          cause instanceof Error &&
          "code" in cause &&
          cause.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION"
        ) {
          const option = cause.message.match(/Unknown option '([^']+)'/)?.[1];
          throw new DeckError(
            `unknown option ${option}. Options: ${Object.keys(options)
              .map((key) => `--${key}`)
              .join(", ")}.`,
          );
        }
        throw new DeckError(
          cause instanceof Error ? cause.message : String(cause),
          undefined,
          undefined,
          { cause },
        );
      }
      try {
        await runCommand(main, { rawArgs });
      } catch (cause) {
        if (cause instanceof Error && cause.name === "CLIError") throw new DeckError(cause.message);
        throw cause;
      }
    }
  } catch (cause) {
    const error = authorError(cause);
    const message =
      error?.message ??
      `${cause instanceof Error ? cause.stack : String(cause)}\nThis is a bug in react-decks.`;
    console.error(`decks${command ? ` ${command}` : ""}: ${message}`);
    process.exitCode = 1;
  }
}
