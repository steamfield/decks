import { globSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseSync, Visitor } from "oxc-parser";
import { expect, it } from "vitest";

const VIEWPORT = /\b\d+(\.\d+)?v[wh]\b/;
// The only viewport unit the kit uses: the story transition nudges a slide by a fraction of the
// viewport height. Anchored to the whole declaration so other values on the line are still checked.
const ALLOW = [/^\s*transform: translateY\(-?1\.4vh\);\s*$/];

function viewportUnits(source: string, file = "fixture.tsx"): string[] {
  const found: string[] = [];
  const scan = (value: string) => {
    for (const line of value.split("\n"))
      if (VIEWPORT.test(line) && !ALLOW.some((rule) => rule.test(line))) found.push(line.trim());
  };
  if (file.endsWith(".css")) scan(source.replace(/\/\*[\s\S]*?\*\//g, ""));
  else {
    const parsed = parseSync(file, source);
    expect(parsed.errors, file).toEqual([]);
    new Visitor({
      Literal(node) {
        if (typeof node.value === "string") scan(node.value);
      },
      TemplateElement(node) {
        scan(node.value.raw);
      },
    }).visit(parsed.program);
  }
  return found;
}

it("rejects viewport sizes in TSX and CSS while allowing frame and root drift rules", () => {
  expect(viewportUnits('const ui = <div style={{ width: "64vw" }} />;')).toEqual(["64vw"]);
  expect(viewportUnits(".x { height: 14vh; }", "fixture.css")).toHaveLength(1);
  expect(viewportUnits("const size = `calc(1vw + $" + "{n}vh)`;")).toHaveLength(1);
  expect(viewportUnits('const size = "calc(64 * var(--sw))"; // 64vw')).toEqual([]);
  expect(viewportUnits("transform: translateY(-1.4vh);", "fixture.css")).toEqual([]);
  expect(viewportUnits("transform: translateY(-1.4vh); width: 64vw;", "fixture.css")).toHaveLength(1);
  expect(viewportUnits("width: var(--sw, 1vw);", "fixture.css")).toHaveLength(1);
});

it("uses frame units across the kit", () => {
  const root = fileURLToPath(new URL("../packages/kit/src/", import.meta.url));
  const files = [
    ...globSync("**/*.tsx", { cwd: root }),
    ...globSync("**/*.css", { cwd: root }),
  ].filter((file) => !/\.(test|test-support)\.tsx$/.test(file));
  expect(files.length).toBeGreaterThan(0);
  expect(
    files.flatMap((file) =>
      viewportUnits(readFileSync(`${root}/${file}`, "utf8"), file).map(
        (line) => `${file}: ${line}`,
      ),
    ),
  ).toEqual([]);
});
