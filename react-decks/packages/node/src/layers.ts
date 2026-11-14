import { glob } from "tinyglobby";

export async function layersModule(dir: string): Promise<string> {
  const files = (await glob("layers/**/*", { cwd: dir, dot: true })).sort();
  for (const file of files)
    if (file !== "layers/above.tsx" && file !== "layers/below.tsx")
      throw new Error(`${file}: expected layers/above.tsx or layers/below.tsx`);
  return `${files.map((file) => `import ${file === "layers/above.tsx" ? "above" : "below"} from ${JSON.stringify(`/${file}`)};`).join("\n")}
export const layers = {${files.map((file) => (file === "layers/above.tsx" ? "above" : "below")).join(",")}};`;
}
