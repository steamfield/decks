import { readdir, readFile } from "node:fs/promises";
import { isBuiltin } from "node:module";
import { join } from "node:path";
import { parseSync } from "oxc-parser";
import { expect, inject, it } from "vitest";

it("declares every external package imported by the shipped JavaScript", async () => {
  const packageDir = inject("builtPackage");
  const metadata = JSON.parse(await readFile(join(packageDir, "package.json"), "utf8"));
  const declared = new Set([
    ...Object.keys(metadata.dependencies),
    ...Object.keys(metadata.peerDependencies),
  ]);
  const dist = join(packageDir, "dist");
  const files = (await readdir(dist)).filter((file) => file.endsWith(".js"));
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const source = await readFile(join(dist, file), "utf8");
    const parsed = parseSync(file, source);
    expect(parsed.errors, file).toEqual([]);
    const imports = [
      ...parsed.module.staticImports.map(({ moduleRequest }) => moduleRequest.value),
      ...parsed.module.staticExports.flatMap(({ entries }) =>
        entries.flatMap(({ moduleRequest }) => (moduleRequest ? [moduleRequest.value] : [])),
      ),
      ...parsed.module.dynamicImports.map(({ moduleRequest }) =>
        JSON.parse(source.slice(moduleRequest.start, moduleRequest.end)),
      ),
    ];
    for (const specifier of imports) {
      if (specifier.startsWith(".") || specifier.startsWith("/") || isBuiltin(specifier)) continue;
      const name = specifier
        .split("/")
        .slice(0, specifier.startsWith("@") ? 2 : 1)
        .join("/");
      expect(declared.has(name), `${file} imports undeclared dependency ${specifier}`).toBe(true);
    }
  }
});
