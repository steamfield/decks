import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { parseSync } from "oxc-parser";
import { glob } from "tinyglobby";
import { stepNames } from "./clicks";
import { DeckError } from "./errors";

export async function componentsModule(dir: string) {
  const files = (await glob("components/*.tsx", { cwd: dir })).sort();
  const components = new Map<string, { file: string; value: string }>();
  const motionNames = new Map(Array.from(stepNames, (name) => [name, name]));
  for (const [index, file] of files.entries()) {
    const parsed = parseSync(file, await readFile(join(dir, file), "utf8"));
    if (parsed.errors.length)
      throw new DeckError(parsed.errors[0]?.message ?? "cannot parse component.", join(dir, file));
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
          entry.moduleRequest?.value === "@react-decks/motion" &&
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
