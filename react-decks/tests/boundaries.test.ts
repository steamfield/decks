import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { builtinModules } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSync, Visitor } from "oxc-parser";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

type Rule = {
  workspace: string[];
  react: boolean;
  node: boolean;
  npm: "none" | "declared";
};

const RULES: Record<string, Rule> = {
  core: { workspace: [], react: false, node: false, npm: "none" },
  runtime: { workspace: ["core"], react: true, node: false, npm: "declared" },
  motion: { workspace: ["core", "runtime"], react: true, node: false, npm: "declared" },
  node: { workspace: ["core"], react: false, node: true, npm: "declared" },
  kit: { workspace: ["core", "runtime", "motion"], react: true, node: false, npm: "declared" },
};

type Manifest = {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

const BUILTINS = new Set(builtinModules.map((name) => name.replace(/^node:/, "")));
const TEST_TOOLING = [
  "vitest",
  "@testing-library/react",
  "@testing-library/user-event",
  "@testing-library/jest-dom",
];

function packageName(specifier: string): string {
  return specifier.startsWith("@")
    ? specifier.split("/").slice(0, 2).join("/")
    : (specifier.split("/")[0] ?? specifier);
}

function importViolation(
  owner: string,
  specifier: string,
  declared: string[],
  testFile = false,
): string | undefined {
  const rule = RULES[owner];
  if (!rule) return "unknown workspace package";
  const name = packageName(specifier);
  if (/(?:^|\/)unstable(?:\/|$)/.test(specifier)) return "unstable APIs are not allowed";
  if (specifier.startsWith("node:") || BUILTINS.has(specifier)) {
    return rule.node ? undefined : "Node built-ins are forbidden";
  }
  if (name.startsWith("@react-decks/")) {
    if (specifier !== name) return "use the bare workspace package name";
    return rule.workspace.includes(name.slice("@react-decks/".length))
      ? undefined
      : "workspace dependency is forbidden";
  }
  if (name === "react" || name === "react-dom") {
    return rule.react ? undefined : "React is forbidden";
  }
  // Test tooling is root-owned; tests still obey the forbidden dependency directions above.
  if (testFile && TEST_TOOLING.includes(name)) return undefined;
  // A declared @types/<name> package is what provides the types imported from <name>.
  if (rule.npm === "declared" && (declared.includes(name) || declared.includes(`@types/${name}`))) {
    return undefined;
  }
  return "external dependency is not allowed";
}

function checkDependencies(owner: string, manifest: Manifest): string[] {
  const declared = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies });
  return declared.flatMap((specifier) => {
    const reason = importViolation(owner, specifier, declared);
    return reason ? [`packages/${owner}/package.json: ${specifier}: ${reason}`] : [];
  });
}

/** Reads module requests using the same parser as Vite, including type-only imports. */
function checkSource(
  owner: string,
  file: string,
  source: string,
  declared: string[] = [],
): string[] {
  // The workspace is TypeScript only, so every source file is type-checked by the same configs.
  if (!/\.tsx?$/.test(file)) return [`${file}:1: source files must be .ts or .tsx`];
  const result = parseSync(file, source);
  const violations: string[] = [];
  const report = (offset: number, specifier: string, reason: string) => {
    const line = source.slice(0, offset).split(/\r\n|[\n\r\u2028\u2029]/).length;
    violations.push(`${file}:${line}: ${specifier}: ${reason}`);
  };
  for (const error of result.errors) {
    report(error.labels[0]?.start ?? 0, "parse", error.message);
  }
  const checkImport = (offset: number, specifier: string) => {
    if (specifier.startsWith(".")) {
      const target = resolve(ROOT, dirname(file), specifier);
      const within = relative(join(ROOT, "packages", owner), target);
      if (within === ".." || within.startsWith(`..${sep}`) || isAbsolute(within)) {
        report(offset, specifier, "relative import leaves its package");
      }
    } else {
      const reason = importViolation(
        owner,
        specifier,
        declared,
        /\.test(?:-support)?\.tsx?$/.test(file),
      );
      if (reason) report(offset, specifier, reason);
    }
  };
  for (const entry of result.module.staticImports) {
    checkImport(entry.start, entry.moduleRequest.value);
  }
  for (const statement of result.module.staticExports) {
    const requests = new Set(
      statement.entries.flatMap((entry) => entry.moduleRequest?.value ?? []),
    );
    for (const specifier of requests) checkImport(statement.start, specifier);
  }
  const dynamicSpecifiers = new Map<number, string>();
  // Module records omit empty re-exports, import types, and dynamic specifier AST nodes.
  new Visitor({
    ExportNamedDeclaration(node) {
      if (node.source && node.specifiers.length === 0) {
        checkImport(node.start, node.source.value);
      }
    },
    ImportExpression(node) {
      if (node.source.type === "Literal" && typeof node.source.value === "string") {
        dynamicSpecifiers.set(node.start, node.source.value);
      }
    },
    TSImportType(node) {
      checkImport(node.start, node.source.value);
    },
  }).visit(result.program);
  for (const entry of result.module.dynamicImports) {
    const specifier = dynamicSpecifiers.get(entry.start);
    if (specifier !== undefined) {
      checkImport(entry.start, specifier);
    } else {
      report(
        entry.start,
        "import()",
        "import specifier must be a string literal for boundary checking",
      );
    }
  }
  // JSX compiles to an implicit react/jsx-runtime import.
  if ((owner === "core" || owner === "node") && /\.[jt]sx$/.test(file)) {
    violations.push(`${file}:1: react/jsx-runtime: implicit React import is forbidden`);
  }
  return violations;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.(?:[jt]sx?|m[jt]s|cts)$/.test(entry.name)
        ? [file]
        : [];
  });
}

function packageDirectories(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function lintSource(
  file: string,
  source: string,
  dependencies: Record<string, string> = {},
  only = "style/noRestrictedImports",
) {
  const fixture = mkdtempSync(join(tmpdir(), "react-decks-biome-"));
  try {
    writeFileSync(join(fixture, "biome.json"), readFileSync(join(ROOT, "biome.json")));
    mkdirSync(dirname(join(fixture, file)), { recursive: true });
    writeFileSync(join(fixture, file), source);
    writeFileSync(
      join(fixture, "packages", file.split("/")[1] ?? "", "package.json"),
      JSON.stringify({ dependencies }),
    );
    const result = spawnSync(
      join(ROOT, "node_modules/.bin/biome"),
      ["lint", ...(only ? [`--only=${only}`] : []), file],
      { cwd: fixture, encoding: "utf8" },
    );
    if (result.error) throw result.error;
    return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

function typecheckSource(owner: string, file: string, source: string) {
  const fixture = mkdtempSync(join(tmpdir(), "react-decks-typecheck-"));
  try {
    const directory = join(fixture, "packages", owner);
    mkdirSync(join(directory, "src"), { recursive: true });
    symlinkSync(join(ROOT, "node_modules"), join(fixture, "node_modules"), "dir");
    for (const config of ["tsconfig.json", `packages/${owner}/tsconfig.json`]) {
      writeFileSync(join(fixture, config), readFileSync(join(ROOT, config)));
    }
    if (owner === "core") {
      writeFileSync(
        join(directory, "src/globals.d.ts"),
        readFileSync(join(ROOT, "packages/core/src/globals.d.ts")),
      );
    }
    // Keep a TS input so excluded JavaScript cannot produce a misleading "no inputs" failure.
    writeFileSync(join(directory, "src/included.ts"), "export {};");
    writeFileSync(join(directory, "src", file), source);
    const result = spawnSync(
      join(ROOT, "node_modules/.bin/tsc"),
      ["--noEmit", "-p", join(directory, "tsconfig.json")],
      { cwd: fixture, encoding: "utf8" },
    );
    if (result.error) throw result.error;
    return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

describe("workspace boundaries", () => {
  it("keeps every source file and package manifest within its dependency boundary", () => {
    const violations: string[] = [];
    expect(packageDirectories(join(ROOT, "packages")).sort()).toEqual(Object.keys(RULES).sort());
    for (const owner of Object.keys(RULES)) {
      const directory = join(ROOT, "packages", owner);
      const manifest: Manifest = JSON.parse(readFileSync(join(directory, "package.json"), "utf8"));
      violations.push(...checkDependencies(owner, manifest));
      for (const file of sourceFiles(join(directory, "src"))) {
        violations.push(
          ...checkSource(
            owner,
            relative(ROOT, file),
            readFileSync(file, "utf8"),
            Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies }),
          ),
        );
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});

describe("boundary checker", () => {
  it.each(['export {} from "react";', 'export type {} from "react";'])(
    "checks empty re-exports: %s",
    (source) => {
      expect(checkSource("core", "packages/core/src/index.ts", source)).toEqual([
        "packages/core/src/index.ts:1: react: React is forbidden",
      ]);
    },
  );

  it("rejects empty relative re-exports that cross package boundaries", () => {
    expect(
      checkSource(
        "runtime",
        "packages/runtime/src/index.ts",
        'export {} from "../../kit/src/index";',
      ),
    ).toEqual([
      "packages/runtime/src/index.ts:1: ../../kit/src/index: relative import leaves its package",
    ]);
  });

  it("typechecks globals in core and node sources", () => {
    for (const owner of ["core", "node"]) {
      const result = typecheckSource(owner, "probe.ts", 'globalThis["document"].title;');
      expect(result.status, result.output).not.toBe(0);
      expect(result.output).toContain("document");
    }
  });

  it("leaves core tests and test support to the root config", () => {
    for (const suffix of ["test", "test-support"]) {
      const result = typecheckSource("core", `probe.${suffix}.ts`, 'globalThis["document"].title;');
      expect(result.status, result.output).toBe(0);
    }
  });

  it("typechecks core timers and property and parameter names shared with browser globals", () => {
    const result = typecheckSource(
      "core",
      "probe.ts",
      "interface State { history: string[] } function read(location: State) { const timer = setTimeout(() => location.history, 0); clearTimeout(timer); }",
    );
    expect(result.status, result.output).toBe(0);
  });

  it.each([
    ['const re = /"/;\nimport "react";', 2],
    [
      String.raw`base.replace(/\/*$/, '');
import "react";`,
      2,
    ],
    [String.raw`/^\/\//; import('react');`, 1],
    [`const text = \`\${await import('react')}\`;`, 1],
    [`const text = \`outer \${\`inner \${await import('react')}\`}\`;`, 1],
    ['export * as x from "react";', 1],
    ['import type { ReactNode } from "react";', 1],
    ['export type { ReactNode } from "react";', 1],
  ])("finds the exact forbidden import in %s", (source, line) => {
    expect(checkSource("core", "packages/core/src/index.ts", source)).toEqual([
      `packages/core/src/index.ts:${line}: react: React is forbidden`,
    ]);
  });

  it("finds imports after apostrophes in JSX text", () => {
    expect(
      checkSource("kit", "packages/kit/src/view.tsx", '<p>Don\'t panic</p>;\nimport "node:fs";'),
    ).toEqual(["packages/kit/src/view.tsx:2: node:fs: Node built-ins are forbidden"]);
  });

  it("does not interpret JSX text as an import", () => {
    expect(checkSource("kit", "packages/kit/src/view.tsx", '<p>Data from "Census"</p>;')).toEqual(
      [],
    );
  });

  it("reports syntax errors with the file and line", () => {
    expect(checkSource("core", "packages/core/src/index.ts", "// first line\nconst x = ;")).toEqual(
      ["packages/core/src/index.ts:2: parse: Unexpected token"],
    );
  });

  it.each(["js", "jsx", "mjs", "mts", "cts"])("rejects a .%s source file", (extension) => {
    const file = `packages/kit/src/view.${extension}`;
    expect(checkSource("kit", file, "export {};")).toEqual([
      `${file}:1: source files must be .ts or .tsx`,
    ]);
  });

  it.each(["ts", "tsx"])("allows test tooling in .test-support.%s files", (extension) => {
    for (const owner of Object.keys(RULES)) {
      const file = `packages/${owner}/src/view.test-support.${extension}`;
      const implicit =
        extension === "tsx" && (owner === "core" || owner === "node")
          ? [`${file}:1: react/jsx-runtime: implicit React import is forbidden`]
          : [];
      expect(checkSource(owner, file, 'import "vitest";')).toEqual(implicit);
      const result = lintSource(file, 'import "vitest";', {}, "");
      expect(result.status, result.output).toBe(0);
      const restricted = lintSource(file, 'import "vitest";');
      expect(restricted.status, restricted.output).toBe(0);
      expect(checkSource(owner, file, 'import "@react-decks/kit";')).toEqual([
        `${file}:1: @react-decks/kit: workspace dependency is forbidden`,
        ...implicit,
      ]);
    }
  });

  it.each(["\n", "\r\n", "\r", "\u2028", "\u2029"])(
    "reports lines from parser offsets after Unicode text and %j",
    (newline) => {
      expect(
        checkSource(
          "core",
          "packages/core/src/index.ts",
          `const text = "𝄞";${newline}import('react');`,
        ),
      ).toEqual(["packages/core/src/index.ts:2: react: React is forbidden"]);
    },
  );

  it("reports a re-export statement once even when it exports several names", () => {
    expect(
      checkSource("core", "packages/core/src/index.ts", 'export { a, b } from "react";'),
    ).toEqual(["packages/core/src/index.ts:1: react: React is forbidden"]);
  });

  it.each([String.raw`import "re\u0061ct";`, String.raw`import('re\u0061ct');`])(
    "checks decoded string specifiers in %s",
    (source) => {
      expect(checkSource("core", "packages/core/src/index.ts", source)).toEqual([
        "packages/core/src/index.ts:1: react: React is forbidden",
      ]);
    },
  );

  it("permits property and parameter names that coincide with browser globals", () => {
    expect(
      checkSource(
        "core",
        "packages/core/src/index.ts",
        "interface State { history: string[] } function read(location: State) { return location.history; }",
      ),
    ).toEqual([]);
  });

  it("permits the two core timers", () => {
    expect(
      checkSource(
        "core",
        "packages/core/src/index.ts",
        "const timer = setTimeout(() => {}, 1); clearTimeout(timer);",
      ),
    ).toEqual([]);
  });

  it("lints the core BroadcastChannel restriction", () => {
    const result = lintSource(
      "packages/core/src/index.ts",
      "new BroadcastChannel('slides');",
      {},
      "style/noRestrictedGlobals",
    );
    expect(result.status, result.output).toBe(1);
  });

  it.each(["runtime", "motion", "node", "kit"])(
    "permits declared npm dependencies in %s lint",
    (owner) => {
      const result = lintSource(`packages/${owner}/src/index.ts`, "import 'some-tool';", {
        "some-tool": "1.0.0",
      });
      expect(result.status, result.output).toBe(0);
      const declared = lintSource(
        `packages/${owner}/src/index.ts`,
        "import 'some-tool';",
        { "some-tool": "1.0.0" },
        "correctness/noUndeclaredDependencies",
      );
      expect(declared.status, declared.output).toBe(0);
      const undeclared = lintSource(
        `packages/${owner}/src/index.ts`,
        "import 'some-tool';",
        {},
        "correctness/noUndeclaredDependencies",
      );
      expect(undeclared.status, undeclared.output).toBe(1);
    },
  );

  it.each(["core", "node"])("rejects implicit JSX runtime imports in %s", (owner) => {
    expect(
      checkSource(owner, `packages/${owner}/src/view.tsx`, "export const view = <div />;").join(
        "\n",
      ),
    ).toContain("react/jsx-runtime");
  });

  it("parses TypeScript assertions without hiding subsequent imports", () => {
    expect(
      checkSource(
        "core",
        "packages/core/src/index.ts",
        'const value = <unknown>0; import "react";',
      ).join("\n"),
    ).toContain("react: React is forbidden");
  });

  it.each([
    ["core", "react", false],
    ["core", "node:fs", false],
    ["core", "fs", false],
    ["core", "./navigation", true],
    ["runtime", "@react-decks/kit", false],
    ["runtime", "@react-decks/core", true],
    ["runtime", "react-dom/client", true],
    ["motion", "@react-decks/kit", false],
    ["node", "react", false],
    ["node", "node:fs", true],
    ["node", "fs/promises", true],
    ["kit", "@react-decks/node", false],
    ["kit", "@react-decks/motion", true],
    ["kit", "@react-decks/core/src/index", false],
  ])("Biome agrees that %s importing %s is allowed: %s", (owner, specifier, allowed) => {
    const file = `packages/${owner}/src/index.ts`;
    for (const source of [
      `import '${specifier}';`,
      `export * from '${specifier}';`,
      `import type { Value } from '${specifier}';`,
      `import('${specifier}');`,
    ]) {
      const result = lintSource(file, source);
      expect(result.status === 0, `${file}: ${source}\n${result.output}`).toBe(allowed);
      expect(checkSource(owner, file, source).length === 0).toBe(allowed);
    }
  });

  it.each([
    ["core", "react"],
    ["core", "react-dom/client"],
    ["core", "@react-decks/core"],
    ["core", "node:fs"],
    ["core", "fs/promises"],
    ["runtime", "node:fs"],
    ["runtime", "@react-decks/motion"],
    ["runtime", "@react-decks/kit"],
    ["runtime", "@react-decks/node"],
    ["motion", "@react-decks/kit"],
    ["motion", "@react-decks/node"],
    ["motion", "node:path"],
    ["node", "react"],
    ["node", "@react-decks/runtime"],
    ["node", "@react-decks/motion"],
    ["node", "@react-decks/kit"],
    ["kit", "@react-decks/node"],
    ["kit", "node:fs"],
    ["runtime", "@react-decks/core/src/navigation"],
    ["runtime", "../../core/src/index"],
    ["runtime", "../../runtime-other/src/index"],
  ])("rejects %s importing %s with a file, line, and specifier", (owner, specifier) => {
    const file = `packages/${owner}/src/index.ts`;
    const result = checkSource(owner, file, `// first line\nimport '${specifier}';`);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain(`${file}:2: ${specifier}:`);
  });

  it.each([
    'export * from "react";',
    'export type { ReactNode } from "react";',
    'import type { ReactNode } from "react";',
    'import { type ReactNode } from "react";',
    'const load = () => import(/* comment */ "react");',
    'type Node = import("react").ReactNode;',
    'import "re\u0061ct";',
    'import {\n  ReactNode,\n} from /* comment */ "react";',
  ])("checks every import form: %s", (source) => {
    expect(checkSource("core", "packages/core/src/index.ts", source).join("\n")).toContain(
      "react: React is forbidden",
    );
  });

  it("rejects computed dynamic imports rather than silently skipping them", () => {
    expect(checkSource("core", "packages/core/src/index.ts", 'import("rea" + "ct");')[0]).toContain(
      "must be a string literal",
    );
  });

  it("rejects a template specifier even without substitutions", () => {
    expect(checkSource("core", "packages/core/src/index.ts", "import(`react`);")).toEqual([
      "packages/core/src/index.ts:1: import(): import specifier must be a string literal for boundary checking",
    ]);
  });

  it("ignores non-directory entries when listing workspace packages", () => {
    const fixture = mkdtempSync(join(tmpdir(), "react-decks-packages-"));
    try {
      mkdirSync(join(fixture, "core"));
      writeFileSync(join(fixture, ".DS_Store"), "");
      expect(packageDirectories(fixture)).toEqual(["core"]);
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  it("scans every supported source extension recursively", () => {
    const fixture = mkdtempSync(join(tmpdir(), "react-decks-sources-"));
    try {
      mkdirSync(join(fixture, "nested"));
      const files = ["ts", "tsx", "js", "jsx", "mjs", "mts", "cts"].map((extension) =>
        join(fixture, "nested", `source.${extension}`),
      );
      for (const file of files) writeFileSync(file, 'import "react";');
      writeFileSync(join(fixture, "ignored.css"), "");
      expect(sourceFiles(fixture).sort()).toEqual(files.sort());
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  it("ignores comments and strings", () => {
    expect(
      checkSource(
        "core",
        "packages/core/src/index.ts",
        `
      // import 'react';
      /* export * from 'node:fs'; */
      const text = "import('react')";
      const textWithDomName = "document";
    `,
      ),
    ).toEqual([]);
  });

  it.each([
    ["core", "./navigation"],
    ["core", "../local"],
    ["runtime", "@react-decks/core"],
    ["runtime", "react"],
    ["runtime", "react-dom/client"],
    ["motion", "@react-decks/core"],
    ["motion", "@react-decks/runtime"],
    ["motion", "react"],
    ["node", "@react-decks/core"],
    ["node", "node:fs"],
    ["node", "fs/promises"],
    ["kit", "@react-decks/core"],
    ["kit", "@react-decks/runtime"],
    ["kit", "@react-decks/motion"],
    ["kit", "react-dom"],
  ])("allows %s importing %s", (owner, specifier) => {
    expect(checkSource(owner, `packages/${owner}/src/index.ts`, `import '${specifier}';`)).toEqual(
      [],
    );
  });

  it("allows a nested relative import that stays within its package", () => {
    expect(
      checkSource("core", "packages/core/src/navigation/steps.ts", "export * from '../../local';"),
    ).toEqual([]);
  });

  it("accepts a type import covered by a declared @types package", () => {
    const file = "packages/runtime/src/source.ts";
    const source = 'import type { MDXComponents } from "mdx/types";';
    expect(checkSource("runtime", file, source, ["@types/mdx"])).toEqual([]);
    expect(checkSource("runtime", file, source)).toHaveLength(1);
  });

  it("rejects an import from an unstable API path", () => {
    expect(
      checkSource("node", "packages/node/src/index.ts", 'import "typescript/unstable/ast";', [
        "typescript",
      ]),
    ).toEqual([
      "packages/node/src/index.ts:1: typescript/unstable/ast: unstable APIs are not allowed",
    ]);
  });

  it("permits only declared npm dependencies outside core", () => {
    for (const owner of ["runtime", "motion", "node", "kit"]) {
      const file = `packages/${owner}/src/index.ts`;
      expect(checkSource(owner, file, "import 'some-tool';", ["some-tool"])).toEqual([]);
      expect(checkSource(owner, file, "import 'some-tool';")).toHaveLength(1);
    }
  });

  it("allows test tooling without relaxing forbidden package directions", () => {
    const file = "packages/runtime/src/view.test.tsx";
    expect(
      checkSource("runtime", file, "import 'vitest'; import '@testing-library/react';"),
    ).toEqual([]);
    expect(checkSource("runtime", file, "import '@react-decks/kit';")).toHaveLength(1);
    expect(checkSource("core", "packages/core/src/core.test.ts", "import 'react';")).toHaveLength(
      1,
    );
  });

  it.each(["dependencies", "peerDependencies"])(
    "checks forbidden entries in %s for every package",
    (field) => {
      const cases: [string, string][] = [
        ["core", "react"],
        ["runtime", "@react-decks/kit"],
        ["motion", "@react-decks/node"],
        ["node", "react-dom"],
        ["kit", "node:fs"],
      ];
      for (const [owner, specifier] of cases) {
        expect(
          checkDependencies(owner, { [field]: { [specifier]: "1.0.0" } }).join("\n"),
        ).toContain(`packages/${owner}/package.json: ${specifier}:`);
      }
    },
  );
});
