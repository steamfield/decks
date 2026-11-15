import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { isBuiltin } from "node:module";
import { join, resolve } from "node:path";
import { parseSync, Visitor } from "oxc-parser";
import { expect, inject, it, onTestFinished } from "vitest";

async function undeclaredImports(packageDir: string) {
  const metadata = JSON.parse(await readFile(join(packageDir, "package.json"), "utf8"));
  const declared = new Set([
    ...Object.keys(metadata.dependencies),
    ...Object.keys(metadata.peerDependencies),
  ]);
  const dist = join(packageDir, "dist");
  const files = (await readdir(dist, { recursive: true })).filter((file) => file.endsWith(".js"));
  expect(files.length).toBeGreaterThan(0);
  const undeclared: string[] = [];
  for (const file of files) {
    const source = await readFile(join(dist, file), "utf8");
    const parsed = parseSync(file, source);
    expect(parsed.errors, file).toEqual([]);
    const imports = [
      ...parsed.module.staticImports.map(({ moduleRequest }) => moduleRequest.value),
      ...parsed.module.staticExports.flatMap(({ entries }) =>
        entries.flatMap(({ moduleRequest }) => (moduleRequest ? [moduleRequest.value] : [])),
      ),
    ];
    new Visitor({
      ImportExpression(node) {
        if (node.source.type === "Literal" && typeof node.source.value === "string")
          imports.push(node.source.value);
      },
    }).visit(parsed.program);
    for (const specifier of imports) {
      if (specifier.startsWith(".") || specifier.startsWith("/") || isBuiltin(specifier)) continue;
      const name = specifier
        .split("/")
        .slice(0, specifier.startsWith("@") ? 2 : 1)
        .join("/");
      if (!declared.has(name))
        undeclared.push(`${file} imports undeclared dependency ${specifier}`);
    }
  }
  return undeclared;
}

it("declares every external package imported by the shipped JavaScript", async () => {
  expect(await undeclaredImports(inject("builtPackage"))).toEqual([]);
});

async function fixture(files: Record<string, string>) {
  await mkdir(resolve(".tmp"), { recursive: true });
  const dir = await mkdtemp(resolve(".tmp/dependencies-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  await writeFile(join(dir, "package.json"), '{"dependencies":{},"peerDependencies":{}}');
  await mkdir(join(dir, "dist/nested"), { recursive: true });
  for (const [file, source] of Object.entries(files))
    await writeFile(join(dir, "dist", file), source);
  return dir;
}

it("checks nested JavaScript while ignoring other shipped files", async () => {
  const dir = await fixture({
    "index.js": "export {};",
    "nested/component.js": 'export { chart } from "missing-chart";',
    "nested/styles.css": "body { color: red; }",
    "nested/component.d.ts": 'import type { Chart } from "types-only";',
  });
  expect(await undeclaredImports(dir)).toEqual([
    "nested/component.js imports undeclared dependency missing-chart",
  ]);
});

it("skips computed dynamic imports and checks string literals with either quote style", async () => {
  const dir = await fixture({
    "index.js": `const path = "./local.js"; import(path); import(\`./\${path}.js\`); import("missing-double"); import('missing-single');`,
  });
  expect(await undeclaredImports(dir)).toEqual([
    "index.js imports undeclared dependency missing-double",
    "index.js imports undeclared dependency missing-single",
  ]);
});
