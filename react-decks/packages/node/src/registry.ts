import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, isAbsolute, resolve } from "node:path";
import { z } from "zod";
import { loadDeck } from "./config";
import { DeckError, validationError } from "./errors";

const registrySchema = z.record(z.string(), z.unknown());
const entrySchema = z.object({ dir: z.string() });
const defaultsSchema = z.object({
  outDir: z.string().default("dist/{name}"),
  base: z.string().default("./"),
  decksDir: z.string().default("decks"),
});

export async function resolveDeck(value: string) {
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
