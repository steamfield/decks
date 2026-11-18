import { constants } from "node:os";
import { type ParseArgsOptionsConfig, parseArgs, stripVTControlCharacters } from "node:util";
import { defineCommand, renderUsage, runCommand, showUsage } from "citty";
import pc from "picocolors";
import { authorError, bugNotice, DeckError } from "../dev/errors";
import { build, dev } from "../dev/server";
import { check } from "./commands/check";
import { exportDeck } from "./commands/export";
import { film } from "./commands/film";
import { hook } from "./commands/hook";
import { init } from "./commands/init";
import { inspect } from "./commands/inspect";
import { lint } from "./commands/lint";
import { newDeck } from "./commands/new";
import { shot } from "./commands/shot";
import { readRegistry, resolveDeck } from "./registry";

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
      remote: {
        type: "boolean",
        description: "Serve the remote presenter on the LAN",
      },
      "remote-port": { type: "string", description: "Port for the remote presenter" },
      "live-term": { type: "boolean", default: false, description: "Enable live terminal panes" },
    },
    async run({ args }) {
      const { deck } = await resolveDeck(args.deck);
      const parsePort = (name: string, value?: string) => {
        if (value === undefined) return;
        if (!/^\d+$/.test(value) || Number(value) > 65535)
          throw new DeckError(`Invalid --${name} "${value}". Use a whole number from 0 to 65535.`);
        return Number(value);
      };
      const port = parsePort("port", args.port);
      const remotePort = parsePort("remote-port", args["remote-port"]);
      const remote = (args.remote ?? remotePort !== undefined) ? { port: remotePort } : undefined;
      const server = await dev(deck, {
        port,
        open: args.open,
        liveTerm: args["live-term"],
        remote,
      });
      if (remote) {
        // Closing removes the built remote page, whose HTML carries the token, from the temp dir.
        const stop = async (signal: NodeJS.Signals) => {
          process.exitCode = 128 + constants.signals[signal];
          await server.close();
        };
        for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) process.once(signal, stop);
      } else console.log(pc.green(server.url));
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
const tools = { new: newDeck, check, lint, hook, export: exportDeck, shot, film, inspect, init };
const main = defineCommand({
  meta: { name: "decks", description: "Develop and build React slide decks" },
  subCommands: { ...commands, ...tools },
});

/**
 * Rewrites citty's argument errors ("Missing required positional argument: DECK") into a message
 * that says what to pass, with the registered decks when the deck is missing. Anything else is
 * returned unchanged.
 */
async function argumentError(command: string, cause: unknown): Promise<unknown> {
  if (!(cause instanceof Error) || cause.name !== "CLIError") return cause;
  const message = stripVTControlCharacters(cause.message);
  const missing = message
    .match(/^Missing required positional argument: (\w+)$/)?.[1]
    ?.toLowerCase();
  if (missing === undefined)
    return new DeckError(`${message.replace(/\.?$/, ".")} Run decks ${command} --help for usage.`);
  if (missing === "deck") {
    const { decks } = await readRegistry();
    const example = decks[0]
      ? `decks ${command} ${decks[0].alias}`
      : `decks ${command} <directory>`;
    return new DeckError(
      decks.length
        ? `which deck? Pass an alias from decks.json or a deck directory. Registered: ${decks.map((deck) => deck.alias).join(", ")}. For example: ${example}`
        : `which deck? Pass a deck directory (no decks are registered in decks.json; decks new <alias> creates one). For example: ${example}`,
    );
  }
  return new DeckError(`missing <${missing}>. Run decks ${command} --help for usage.`);
}

export async function runCli(rawArgs: string[] = process.argv.slice(2)): Promise<void> {
  const command = rawArgs[0];
  try {
    if (
      command !== "dev" &&
      rawArgs.slice(1).some((arg) => /^--(?:no-)?live-term(?:=|$)/.test(arg))
    )
      throw new DeckError("--live-term is only available on decks dev.");
    if (
      command !== "dev" &&
      rawArgs.slice(1).some((arg) => /^--(?:no-)?remote(?:-port)?(?:=|$)/.test(arg))
    )
      throw new DeckError("--remote is only available on decks dev.");
    if (command !== undefined && Object.hasOwn(tools, command)) {
      try {
        await runCommand(main, { rawArgs });
      } catch (cause) {
        throw await argumentError(command, cause);
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
          : {
              port: { type: "string" },
              open: { type: "boolean" },
              "live-term": { type: "boolean" },
              remote: { type: "boolean" },
              "remote-port": { type: "string" },
            };
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
                : `${option} needs a value. Pass ${option} ${option === "--port" || option === "--remote-port" ? "<n>, a whole number from 0 to 65535" : option === "--out" ? "<dir>" : "<path>"}.`,
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
        throw await argumentError(command, cause);
      }
    }
  } catch (cause) {
    const error = authorError(cause);
    const message =
      error?.message ?? `${cause instanceof Error ? cause.stack : String(cause)}\n${bugNotice}`;
    console.error(`decks${command ? ` ${command}` : ""}: ${message}`);
    process.exitCode = 1;
  }
}
