import { join } from "node:path";
import { glob } from "tinyglobby";
import { DeckError } from "./errors";

export async function layersModule(dir: string): Promise<string> {
  const files = (await glob("layers/**/*.tsx", { cwd: dir })).sort();
  for (const file of files)
    if (file !== "layers/above.tsx" && file !== "layers/below.tsx")
      throw new DeckError(`expected layers/above.tsx or layers/below.tsx.`, join(dir, file));
  return `${files.map((file) => `import ${file === "layers/above.tsx" ? "above" : "below"} from ${JSON.stringify(`/${file}`)};`).join("\n")}
export const layers = {${files.map((file) => (file === "layers/above.tsx" ? "above" : "below")).join(",")}};`;
}
