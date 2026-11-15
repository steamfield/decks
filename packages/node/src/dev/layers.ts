import { join } from "node:path";
import { glob } from "tinyglobby";
import { DeckError } from "./errors";

const NAMES = ["above", "below", "credit"];

/** `credit` is the deck's `credit` option: false removes the corner credit from every slide. */
export async function layersModule(dir: string, credit: boolean): Promise<string> {
  const files = (await glob("layers/**/*.tsx", { cwd: dir })).sort();
  const names = files.map((file) => {
    const name = file.slice("layers/".length, -".tsx".length);
    if (!NAMES.includes(name))
      throw new DeckError(
        `expected layers/above.tsx, layers/below.tsx or layers/credit.tsx.`,
        join(dir, file),
      );
    return name;
  });
  const shown = credit ? names : names.filter((name) => name !== "credit");
  return `${shown.map((name) => `import ${name} from ${JSON.stringify(`/layers/${name}.tsx`)};`).join("\n")}
export const layers = {${[...shown, ...(credit ? [] : ["credit:false"])].join(",")}};`;
}
