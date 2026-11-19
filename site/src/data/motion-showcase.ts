// File credits follow the named components Decks makes available in slide MDX.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { deckDir } from "./examples";

const read = (file: string) => readFileSync(file, "utf8").replace(/\r?\n$/, "");
const lines = (source: string) => source.split("\n").length;

export function loadMotionShowcase(example: string) {
  const dir = deckDir(example);
  const components = readdirSync(join(dir, "components"))
    .filter((file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"))
    .map((file) => {
      const source = read(join(dir, "components", file));
      return {
        file,
        lines: lines(source),
        names: Array.from(source.matchAll(/^export (?:function|const) ([A-Z]\w*)/gm), (m) => m[1]),
      };
    });

  const files = readdirSync(join(dir, "slides"))
    .filter((file) => file.endsWith(".mdx"))
    .sort();
  const slides = files.map((file) => {
    const source = read(join(dir, "slides", file));
    const tags = new Set(Array.from(source.matchAll(/<([A-Z]\w*)\b/g), (m) => m[1]));
    return {
      file: `slides/${file}`,
      lines: lines(source),
      source,
      components: components.flatMap(({ names, file, lines }) => {
        const used = names.filter((name) => tags.has(name));
        return used.length ? [{ names: used.join(", "), file, lines }] : [];
      }),
    };
  });
  const templates = readdirSync(join(process.cwd(), "../packages/kit/src/motion-templates")).filter(
    (file) =>
      file.endsWith(".tsx") && !file.endsWith(".test.tsx") && file !== "motion-template.tsx",
  );
  return {
    slides,
    longest: Math.max(...slides.map((slide) => slide.lines)),
    templates: templates.length,
  };
}

export type SlideSource = ReturnType<typeof loadMotionShowcase>["slides"][number];
