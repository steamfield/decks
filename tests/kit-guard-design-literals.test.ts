import { globSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseSync, Visitor } from "oxc-parser";
import { expect, it } from "vitest";

const HEX = /(?<![\w&#])(?<!url\(\s*['"]?)#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])/gi;
const WHOLE_HEX = /^#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})$/i;
const COLOR_PROP =
  /^(?:--[\w-]+|[\w-]*color|fill|stroke|background(?:-image)?|border(?:-[a-z]+)*|outline|box-shadow|text-shadow|column-rule|text-decoration|-webkit-text-stroke)$/i;

function allowed(source: string, at: number): boolean {
  const line = source.slice(
    source.lastIndexOf("\n", at - 1) + 1,
    source.indexOf("\n", at) < 0 ? undefined : source.indexOf("\n", at),
  );
  if (!line.includes("lint-allow")) return false;
  const ids = /lint-allow:\s*([\w-]+(?:\s*,\s*[\w-]+)*)/.exec(line);
  return !ids || (ids[1]?.split(/\s*,\s*/).includes("hex-color") ?? false);
}

function colors(source: string, file = "fixture.tsx"): number[] {
  const hits = new Set<number>();
  const add = (text: string, at: number) => {
    for (const match of text.matchAll(HEX))
      if (!allowed(source, at + match.index)) hits.add(at + match.index);
  };
  if (file.endsWith(".css")) {
    const css = source.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "));
    for (const declaration of css.matchAll(/([\w-]+)\s*:\s*([^;{}]*)/g)) {
      if (COLOR_PROP.test(declaration[1] ?? "")) {
        const value = declaration[2] ?? "";
        add(value, declaration.index + declaration[0].indexOf(value));
      }
    }
  } else {
    const parsed = parseSync(file, source);
    expect(parsed.errors, file).toEqual([]);
    const links: { start: number; end: number }[] = [];
    const paints: { start: number; end: number }[] = [];
    const inside = (at: number, spans: { start: number; end: number }[]) =>
      spans.some((span) => at >= span.start && at < span.end);
    new Visitor({
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || !node.value) return;
        if (node.name.name === "href") links.push(node.value);
        if (COLOR_PROP.test(node.name.name)) paints.push(node.value);
      },
      Literal(node) {
        if (
          typeof node.value === "string" &&
          !inside(node.start, links) &&
          (WHOLE_HEX.test(node.value) || inside(node.start, paints))
        )
          add(node.value, node.start + 1);
      },
      TemplateElement(node) {
        if (
          !inside(node.start, links) &&
          (WHOLE_HEX.test(node.value.raw) || inside(node.start, paints))
        )
          add(node.value.raw, node.start);
      },
      Property(node) {
        const key =
          node.key.type === "Identifier"
            ? node.key.name
            : node.key.type === "Literal"
              ? String(node.key.value)
              : "";
        if (COLOR_PROP.test(key)) paints.push(node.value);
      },
    }).visit(parsed.program);
  }
  return [...hits];
}

it("rejects hex colors in TSX and CSS and ignores ids, comments and explicit allowances", () => {
  expect(colors('const color = "#fff"; const ui = <rect fill="#123456" />;')).toHaveLength(2);
  expect(colors(".x { background: linear-gradient(#fff, #abc); }", "fixture.css")).toHaveLength(2);
  expect(colors('const ui = <a href="#abc"><path fill="url(#abc)" /></a>; // #fff')).toEqual([]);
  expect(colors('const a = "#abc"; // lint-allow: hex-color')).toEqual([]);
  expect(colors(".x { color: #fff; /* lint-allow */ }", "fixture.css")).toEqual([]);
  expect(colors('const a = "#abc"; // lint-allow: em-dash')).toHaveLength(1);
});

it("keeps every kit component and stylesheet reachable by the theme", () => {
  const root = fileURLToPath(new URL("../packages/kit/src/", import.meta.url));
  const files = [
    ...globSync("**/*.tsx", { cwd: root }),
    ...globSync("styles/*.css", { cwd: root }),
  ].filter((file) => !/\.(test|test-support)\.tsx$/.test(file));
  expect(files.some((file) => file.endsWith(".tsx"))).toBe(true);
  expect(files.some((file) => file.endsWith(".css"))).toBe(true);
  expect(
    files.flatMap((file) => {
      const source = readFileSync(`${root}/${file}`, "utf8");
      return colors(source, file).map((at) => `${file}:${source.slice(0, at).split("\n").length}`);
    }),
  ).toEqual([]);
});

it("rejects fallback paints and template-valued colors", () => {
  expect(colors('const ui = <path fill="url(#missing) #fff" />;')).toHaveLength(1);
  expect(colors("const style = { background: `linear-gradient(#fff, #000)` }; ")).toHaveLength(2);
});

it("allows fragment links inside JSX expressions", () => {
  expect(colors('const ui = <a href={"#abc"}>Link</a>;')).toEqual([]);
  expect(colors("const ui = <a href={`#abc`}>Link</a>;")).toEqual([]);
});
