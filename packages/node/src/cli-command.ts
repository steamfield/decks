import { type ParseArgsOptionsConfig, parseArgs } from "node:util";
import { defineCommand, renderUsage, runCommand, showUsage } from "citty";
import pc from "picocolors";
import { check } from "./commands/check";
import { exportDeck } from "./commands/export";
import { hook } from "./commands/hook";
import { init } from "./commands/init";
import { lint } from "./commands/lint";
import { newDeck } from "./commands/new";
import { shot } from "./commands/shot";
import { authorError, DeckError } from "./errors";
import { resolveDeck } from "./registry";
import { build, dev } from "./server";

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
const tools = { new: newDeck, check, lint, hook, export: exportDeck, shot, init };
const main = defineCommand({
  meta: { name: "decks", description: "Develop and build React slide decks" },
  subCommands: { ...commands, ...tools },
});

export async function runCli(rawArgs: string[] = process.argv.slice(2)): Promise<void> {
  const command = rawArgs[0];
  try {
    if (command !== undefined && Object.hasOwn(tools, command)) {
      try {
        await runCommand(main, { rawArgs });
      } catch (cause) {
        if (cause instanceof Error && cause.name === "CLIError") throw new DeckError(cause.message);
        throw cause;
      }
    } else if (command !== "dev" && command !== "build") {
      if (command === undefined) {
        console.error(await renderUsage(main));
        process.exitCode = 1;
      } else await showUsage(main);
      if (command && command !== "--help" && command !== "-h") {
        throw new DeckError(
          `unknown command ${JSON.stringify(command)}. Commands: ${Object.keys(main.subCommands ?? {}).join(", ")}.`,
        );
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
