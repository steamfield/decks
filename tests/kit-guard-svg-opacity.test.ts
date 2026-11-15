import { globSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseSync, Visitor } from "oxc-parser";
import { expect, it } from "vitest";

function opacityAttributes(source: string, file = "fixture.tsx"): number[] {
  const parsed = parseSync(file, source);
  expect(parsed.errors, file).toEqual([]);
  const found: number[] = [];
  new Visitor({
    JSXOpeningElement(node) {
      // Lowercase names are intrinsic elements: every SVG tag, not a hand-picked few.
      if (node.name.type !== "JSXIdentifier" || !/^[a-z]/.test(node.name.name)) return;
      for (const attr of node.attributes) {
        if (
          attr.type === "JSXAttribute" &&
          attr.name.type === "JSXIdentifier" &&
          ["opacity", "fillOpacity"].includes(attr.name.name) &&
          attr.value?.type === "JSXExpressionContainer"
        )
          found.push(attr.start);
      }
    },
  }).visit(parsed.program);
  return found;
}

it("requires animated SVG opacity in inline styles, preserving static attributes", () => {
  expect(
    opacityAttributes("const ui = <g opacity={progress}><path fillOpacity={progress} /></g>;"),
  ).toHaveLength(2);
  expect(
    opacityAttributes('const ui = <g style={{ opacity: progress }}><rect opacity="1" /></g>;'),
  ).toEqual([]);
  expect(opacityAttributes("const ui = <circle opacity={node.opacity} />;")).toHaveLength(1);
  expect(opacityAttributes("const ui = <Mark opacity={progress} />;")).toEqual([]);
});

it("keeps animated SVG opacity isolated from attribute selectors throughout the kit", () => {
  const root = fileURLToPath(new URL("../packages/kit/src/", import.meta.url));
  const files = globSync("**/*.tsx", { cwd: root }).filter(
    (file) => !/\.(test|test-support)\.tsx$/.test(file),
  );
  expect(files.length).toBeGreaterThan(0);
  expect(
    files.flatMap((file) => {
      const source = readFileSync(`${root}/${file}`, "utf8");
      return opacityAttributes(source, file).map(
        (at) => `${file}:${source.slice(0, at).split("\n").length}`,
      );
    }),
  ).toEqual([]);
});
