import { globSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseSync, Visitor } from "oxc-parser";
import { expect, it } from "vitest";

const VIEWPORT = /\b\d+(\.\d+)?v[wh]\b/;
const ALLOW = [
  /--od-f[wh]:/,
  /rgba\(var\(--od-glow-(primary|secondary)-rgb\)/,
  /transform: translateY\(-?1\.4vh\);/,
  /var\(--s[wh], 1v[wh]\)/,
  /^\s*--od-bleed-x: calc\(\(100vw/,
];

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
  expect(viewportUnits("width: var(--sw, 1vw);", "fixture.css")).toEqual([]);
});

it("uses frame units across the kit", () => {
  const root = fileURLToPath(new URL("../packages/kit/src/", import.meta.url));
  const files = [
    ...globSync("**/*.tsx", { cwd: root }),
    ...globSync("styles/*.css", { cwd: root }),
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
