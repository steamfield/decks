import { constants, existsSync } from "node:fs";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { parseArgs } from "node:util";
import { defineCommand } from "citty";
import { glob } from "tinyglobby";
import { DeckError, displayPath } from "../errors";
import { readRegistry } from "../registry";

export const newDeck = defineCommand({
  meta: { name: "decks new", description: "Scaffold a deck and register it in decks.json" },
  args: {
    alias: { type: "positional", required: true, description: "Alias to register" },
    dir: {
      type: "positional",
      required: false,
      description: "Directory name under decksDir (default: the alias)",
    },
    story: { type: "boolean", default: false, description: "Scaffold a story deck" },
    author: { type: "string", description: "Author name" },
    url: { type: "string", description: "Brand URL for the cover" },
  },
  async run({ args, rawArgs }) {
    try {
      const { positionals } = parseArgs({
        args: rawArgs,
        allowPositionals: true,
        allowNegative: true,
        options: {
          story: { type: "boolean" },
          author: { type: "string" },
          url: { type: "string" },
        },
      });
      if (positionals.length > 2)
        throw new DeckError(
          `Unexpected argument "${positionals[2]}". Pass an alias and optional directory.`,
        );
      const alias = args.alias;
      const dir = args.dir ?? alias;
      if (alias.startsWith("_"))
        throw new DeckError(
          `Alias "${alias}" starts with "_", which is reserved. Choose another alias.`,
        );
      if (!dir || dir === "." || dir === ".." || /[/\\]/.test(dir))
        throw new DeckError(`Deck directory "${dir}" must be a bare name without slashes.`);
      const registry = await readRegistry();
      if (registry.decks.some((deck) => deck.alias === alias))
        throw new DeckError(`Alias "${alias}" is already registered.`);
      const deckDir = join(registry.defaults.decksDir, dir);
      if (existsSync(deckDir))
        throw new DeckError(`${deckDir} already exists. Choose another directory.`);
      await access(
        existsSync(registry.path) ? registry.path : dirname(registry.path),
        constants.W_OK,
      );

      // Keep project metadata that readRegistry does not expose, after it validates the input.
      const contents: Record<string, unknown> = existsSync(registry.path)
        ? JSON.parse(await readFile(registry.path, "utf8"))
        : { _config: registry.defaults };
      const template = new URL(
        `${import.meta.url.endsWith(".ts") ? "../../" : "./"}templates/${args.story ? "story" : "conventional"}/`,
        import.meta.url,
      );
      const title = dir.replace(/[-_]/g, " ");
      const variables: Record<string, string> = {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        author: args.author ?? "Your Name",
        alias,
      };
      const files = await glob("**/*", { cwd: template, dot: true });
      for (const file of files.sort()) {
        let text = await readFile(new URL(file, template), "utf8");
        text = text.replace(/\{\{(title|author|alias)\}\}/g, (_match, key: string) =>
          JSON.stringify(variables[key]).slice(1, -1),
        );
        if (file === "setup.ts" && args.url !== undefined)
          text = text.replace(
            "installTheme(resolveTheme());",
            'import theme from "./theme.json";\n\ninstallTheme(resolveTheme(theme));',
          );
        const target = join(deckDir, file);
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, text);
        console.log(`Wrote ${target}`);
      }
      if (args.url !== undefined) {
        await writeFile(
          join(deckDir, "theme.json"),
          `${JSON.stringify({ brand: { url: args.url } }, null, 2)}\n`,
        );
        console.log(`Wrote ${join(deckDir, "theme.json")}`);
      }
      contents[alias] = { dir: deckDir };
      await writeFile(registry.path, `${JSON.stringify(contents, null, 2)}\n`);
      const shellAlias = /^[a-zA-Z0-9_-]+$/.test(alias)
        ? alias
        : `'${alias.replaceAll("'", "'\\''")}'`;
      console.log(`Registered "${alias}" in decks.json.\nNext: decks dev ${shellAlias}`);
    } catch (cause) {
      if (!(cause instanceof Error) || !("code" in cause) || typeof cause.code !== "string")
        throw cause;
      if (cause.code.startsWith("ERR_PARSE_ARGS"))
        throw new DeckError(cause.message, undefined, undefined, { cause });
      const reasons: Record<string, string> = {
        EACCES: "permission denied",
        EPERM: "permission denied",
        ENOTDIR: "not a directory",
        ENOENT: "path does not exist",
        EROFS: "read-only filesystem",
        EEXIST: "already exists",
        ENOSPC: "no space left",
      };
      const reason = reasons[cause.code];
      if (!reason) throw cause;
      const path =
        "path" in cause && typeof cause.path === "string"
          ? displayPath(resolve(cause.path))
          : args.alias;
      throw new DeckError(
        `cannot scaffold ${path}: ${reason}. Check the destination and its permissions.`,
        undefined,
        undefined,
        { cause },
      );
    }
  },
});
