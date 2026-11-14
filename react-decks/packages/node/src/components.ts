import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parseSync } from "oxc-parser";
import { glob } from "tinyglobby";
import { stepNames } from "./clicks";
import { DeckError } from "./errors";
import { PUBLIC_SPECIFIERS } from "./specifiers";

export async function componentsModule(dir: string) {
  const files = (await glob("components/*.tsx", { cwd: dir })).sort();
  const components = new Map<string, { file: string; value: string }>();
  const motionNames = new Map(Array.from(stepNames, (name) => [name, name]));
  for (const [index, file] of files.entries()) {
    const source = await readFile(join(dir, file), "utf8");
    const parsed = parseSync(file, source);
    const error = parsed.errors[0];
    if (error) {
      const label = error.labels[0];
      const lines = label
        ? source.slice(0, label.start).split(/\r\n|[\n\r\u2028\u2029]/)
        : undefined;
      throw new DeckError(
        `${error.message}${/[.!?]$/.test(error.message) ? "" : "."} Check the component syntax.`,
        join(dir, file),
        lines ? { line: lines.length, column: (lines.at(-1)?.length ?? 0) + 1 } : undefined,
      );
    }
    for (const declaration of parsed.module.staticExports) {
      for (const entry of declaration.entries) {
        if (entry.isType) continue;
        if (entry.exportName.kind === "None")
          throw new DeckError(
            `runtime wildcard re-export is not supported; export names explicitly.`,
            join(dir, file),
          );
        const exported = entry.exportName.kind === "Default" ? "default" : entry.exportName.name;
        if (exported === null) continue;
        const name = exported === "default" ? basename(file, ".tsx") : exported;
        const owner = components.get(name);
        if (owner && owner.file !== file)
          throw new DeckError(
            `Duplicate component ${name} in ${owner.file} and ${file}. Export each component name from only one file.`,
            join(dir, file),
          );
        components.set(name, { file, value: `c${index}[${JSON.stringify(exported)}]` });
        motionNames.delete(name);
        const imported = entry.importName.name;
        if (
          (entry.moduleRequest?.value === "@react-decks/motion" ||
            entry.moduleRequest?.value === PUBLIC_SPECIFIERS.motion) &&
          imported &&
          stepNames.has(imported)
        )
          motionNames.set(name, imported);
      }
    }
  }
  return {
    names: new Set(components.keys()),
    motionNames,
    code: `${files.map((file, index) => `import * as c${index} from ${JSON.stringify(`/${file}`)};`).join("\n")}
export const components = {${Array.from(components, ([name, { value }]) => `[${JSON.stringify(name)}]: ${value}`).join(",")}};`,
  };
}
