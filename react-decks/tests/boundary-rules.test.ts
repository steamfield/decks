import { describe, expect, it } from "vitest";
import {
  checkDependencies,
  checkSource,
  lintSource,
  typecheckSource,
} from "./boundaries.test-support";

describe("boundary checker rules", () => {
  it.each<[string, string, string, string, string[]]>([
    ["workspace direction", "runtime", "@react-decks/core", "@react-decks/kit", []],
    ["bare workspace names", "runtime", "@react-decks/core", "@react-decks/core/src/index", []],
    ["Node built-ins", "node", "node:fs", "react", []],
    ["browser imports", "runtime", "react-dom/client", "node:fs", []],
    ["core dependencies", "core", "./navigation", "some-tool", ["some-tool"]],
    ["declared dependencies", "runtime", "some-tool", "other-tool", ["some-tool"]],
    ["relative boundaries", "runtime", "./hooks", "../../kit/src/index", []],
    ["stable APIs", "node", "typescript", "typescript/unstable/ast", ["typescript"]],
    ["declared type packages", "runtime", "mdx/types", "missing/types", ["@types/mdx"]],
  ])(
    "%s permits one dependency and rejects another",
    (_rule, owner, allowed, forbidden, declared) => {
      const file = `packages/${owner}/src/probe.ts`;
      expect(checkSource(owner, file, `import "${allowed}";`, declared)).toEqual([]);
      const errors = checkSource(owner, file, `// first line\nimport "${forbidden}";`, declared);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toContain(`${file}:2: ${forbidden}:`);
    },
  );

  it("allows literal imports and rejects computed dynamic imports", () => {
    const file = "packages/core/src/probe.ts";
    expect(checkSource("core", file, 'import("./navigation");')).toEqual([]);
    expect(checkSource("core", file, 'import("rea" + "ct");')).toEqual([
      `${file}:1: import(): import specifier must be a string literal for boundary checking`,
    ]);
  });

  it("allows TypeScript sources and rejects other extensions", () => {
    expect(checkSource("core", "packages/core/src/probe.ts", "export {};")).toEqual([]);
    expect(checkSource("core", "packages/core/src/probe.js", "export {};")).toEqual([
      "packages/core/src/probe.js:1: source files must be .ts or .tsx",
    ]);
  });

  it("accepts valid syntax and reports a parser error with its file and line", () => {
    const file = "packages/core/src/probe.ts";
    expect(checkSource("core", file, 'const text = "import react";')).toEqual([]);
    expect(checkSource("core", file, "// first line\nconst x = ;")).toEqual([
      `${file}:2: parse: Unexpected token`,
    ]);
  });

  it("allows JSX in the browser and rejects its implicit React import in node", () => {
    const source = "export const view = <div />;";
    expect(checkSource("runtime", "packages/runtime/src/view.tsx", source)).toEqual([]);
    expect(checkSource("node", "packages/node/src/view.tsx", source)).toEqual([
      "packages/node/src/view.tsx:1: react/jsx-runtime: implicit React import is forbidden",
    ]);
  });

  it("allows test tooling only in tests and keeps forbidden directions forbidden", () => {
    const file = "packages/runtime/src/view";
    expect(checkSource("runtime", `${file}.test-support.ts`, 'import "vitest";')).toEqual([]);
    expect(checkSource("runtime", `${file}.ts`, 'import "vitest";')).toHaveLength(1);
    expect(checkSource("runtime", `${file}.test.ts`, 'import "@react-decks/kit";')).toHaveLength(1);
  });

  it("allows a valid dependency manifest and rejects forbidden dependencies and peers", () => {
    expect(checkDependencies("runtime", { dependencies: { "@react-decks/core": "*" } })).toEqual(
      [],
    );
    for (const field of ["dependencies", "peerDependencies"]) {
      expect(checkDependencies("runtime", { [field]: { "@react-decks/kit": "*" } })).toEqual([
        "packages/runtime/package.json: @react-decks/kit: workspace dependency is forbidden",
      ]);
    }
  });

  it("Biome permits a bare workspace dependency and rejects a forbidden direction", () => {
    for (const [specifier, status] of [
      ["@react-decks/core", 0],
      ["@react-decks/kit", 1],
    ] as const) {
      const result = lintSource("packages/runtime/src/probe.ts", `import "${specifier}";`);
      expect(result.status, result.output).toBe(status);
    }
  });

  it("Biome permits declared npm dependencies and rejects undeclared ones", () => {
    for (const declared of [true, false]) {
      const result = lintSource(
        "packages/runtime/src/probe.ts",
        'import "some-tool";',
        declared ? { "some-tool": "1.0.0" } : {},
        "correctness/noUndeclaredDependencies",
      );
      expect(result.status, result.output).toBe(declared ? 0 : 1);
    }
  });

  it("Biome permits core timers and rejects browser globals", () => {
    for (const [source, status] of [
      ["const timer = setTimeout(() => {}, 0); clearTimeout(timer);", 0],
      ['new BroadcastChannel("slides");', 1],
    ] as const) {
      const result = lintSource(
        "packages/core/src/probe.ts",
        source,
        {},
        "style/noRestrictedGlobals",
      );
      expect(result.status, result.output).toBe(status);
    }
  });

  it("the core type checker permits timers and rejects DOM globals", () => {
    for (const [source, status] of [
      ["const timer = setTimeout(() => {}, 0); clearTimeout(timer);", 0],
      ['globalThis["document"].title;', 1],
    ] as const) {
      const result = typecheckSource("core", "probe.ts", source);
      if (status === 0) expect(result.status, result.output).toBe(0);
      else {
        expect(result.status, result.output).not.toBe(0);
        expect(result.output).toContain("document");
      }
    }
  });
});
