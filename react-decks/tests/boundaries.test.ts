import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { builtinModules } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

type Rule = {
  workspace: string[];
  react: boolean;
  node: boolean;
  npm: "none" | "declared" | string[];
};

const RULES: Record<string, Rule> = {
  core: { workspace: [], react: false, node: false, npm: "none" },
  runtime: { workspace: ["core"], react: true, node: false, npm: "none" },
  motion: {
    workspace: ["core", "runtime"],
    react: true,
    node: false,
    npm: ["gsap", "@gsap/react"],
  },
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
// The core environment restriction is deliberately a direct identifier check.
const DOM_GLOBALS = [
  "window",
  "document",
  "location",
  "navigator",
  "history",
  "localStorage",
  "sessionStorage",
  "BroadcastChannel",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "fetch",
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
  if (Array.isArray(rule.npm) && rule.npm.includes(name)) return undefined;
  if (rule.npm === "declared" && declared.includes(name)) return undefined;
  return "external dependency is not allowed";
}

function checkDependencies(owner: string, manifest: Manifest): string[] {
  const declared = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies });
  return declared.flatMap((specifier) => {
    const reason = importViolation(owner, specifier, declared);
    return reason ? [`packages/${owner}/package.json: ${specifier}: ${reason}`] : [];
  });
}

/**
 * Blanks comments and replaces each string literal's contents with its index in `strings`, so
 * the patterns below see only real code and can read a specifier back by index. Newlines are
 * kept, so offsets still map to the original line numbers.
 */
function scan(source: string): { code: string; strings: string[] } {
  const strings: string[] = [];
  let code = "";
  let i = 0;
  while (i < source.length) {
    const char = source[i] ?? "";
    const next = source[i + 1];
    if (char === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i++;
    } else if (char === "/" && next === "*") {
      const end = source.indexOf("*/", i + 2);
      const stop = end === -1 ? source.length : end + 2;
      code += source.slice(i, stop).replace(/[^\n]/g, " ");
      i = stop;
    } else if (char === '"' || char === "'" || char === "`") {
      let j = i + 1;
      while (j < source.length && source[j] !== char) j += source[j] === "\\" ? 2 : 1;
      const text = source.slice(i + 1, j);
      // A template literal with a substitution is not a fixed specifier.
      const fixed = char !== "`" || !text.includes("${");
      code += fixed ? `"${strings.push(text) - 1}"` : "`computed`";
      code += text.replace(/[^\n]/g, "");
      i = j + 1;
    } else {
      code += char;
      i++;
    }
  }
  return { code, strings };
}

/** Resolves escapes such as "re\u0061ct", which name the same module as "react". */
function resolveEscapes(text: string): string {
  try {
    return JSON.parse(`"${text.replace(/"/g, '\\"')}"`);
  } catch {
    return text;
  }
}

const SPECIFIER = /(?:\bfrom\s*|\bimport\s*)"(\d+)"|\b(?:import|require)\s*\(\s*"(\d+)"\s*[,)]/g;
const COMPUTED = /\b(?:import|require)\s*\(\s*(?!"\d+"\s*[,)])[^)\s]/g;

/** Reads imports and globals from source text; comments and string contents cannot hide or fake them. */
function checkSource(
  owner: string,
  file: string,
  source: string,
  declared: string[] = [],
): string[] {
  const { code, strings } = scan(source);
  const violations: string[] = [];
  const report = (offset: number, specifier: string, reason: string) => {
    const line = code.slice(0, offset).split("\n").length;
    violations.push(`${file}:${line}: ${specifier}: ${reason}`);
  };
  for (const match of code.matchAll(SPECIFIER)) {
    const specifier = resolveEscapes(strings[Number(match[1] ?? match[2])] ?? "");
    if (specifier.startsWith(".")) {
      const target = resolve(ROOT, dirname(file), specifier);
      const within = relative(join(ROOT, "packages", owner), target);
      if (within === ".." || within.startsWith(`..${sep}`) || isAbsolute(within)) {
        report(match.index, specifier, "relative import leaves its package");
      }
    } else {
      const reason = importViolation(owner, specifier, declared, /\.test\.tsx?$/.test(file));
      if (reason) report(match.index, specifier, reason);
    }
  }
  for (const match of code.matchAll(COMPUTED)) {
    report(
      match.index,
      "import()",
      "import specifier must be a string literal for boundary checking",
    );
  }
  if (owner === "core") {
    for (const match of code.matchAll(new RegExp(`\\b(?:${DOM_GLOBALS.join("|")})\\b`, "g"))) {
      report(match.index, match[0], "DOM global is forbidden in core");
    }
  }
  // JSX compiles to an implicit react/jsx-runtime import, so core and node hold no .tsx files.
  if ((owner === "core" || owner === "node") && file.endsWith(".tsx")) {
    violations.push(`${file}:1: react/jsx-runtime: implicit React import is forbidden`);
  }
  return violations;
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(file) : /\.tsx?$/.test(entry.name) ? [file] : [];
  });
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
      ["lint", `--only=${only}`, file],
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
    expect(readdirSync(join(ROOT, "packages")).sort()).toEqual(Object.keys(RULES).sort());
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

  it.each(["node", "kit"])("permits declared npm dependencies in %s lint", (owner) => {
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
  });

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

  it.each(["export const { document } = globalThis;", "const { document: doc } = globalThis;"])(
    "rejects direct destructured DOM access: %s",
    (source) => {
      expect(checkSource("core", "packages/core/src/index.ts", source).join("\n")).toContain(
        "DOM global is forbidden",
      );
    },
  );

  it.each([
    ["core", "react", false],
    ["core", "node:fs", false],
    ["core", "fs", false],
    ["core", "./navigation", true],
    ["runtime", "@react-decks/kit", false],
    ["runtime", "@react-decks/core", true],
    ["runtime", "react-dom/client", true],
    ["motion", "@react-decks/kit", false],
    ["motion", "@gsap/react", true],
    ["motion", "gsap", true],
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
    "const load = () => import(`react`);",
    'type Node = import("react").ReactNode;',
    'import React = require("react");',
    'const React = require("react");',
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

  it.each([...DOM_GLOBALS, "globalThis.document"])(
    "rejects the DOM global %s in core",
    (expression) => {
      expect(
        checkSource("core", "packages/core/src/index.ts", `const value = ${expression};`).join(
          "\n",
        ),
      ).toContain("DOM global is forbidden");
    },
  );

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
    ["motion", "gsap"],
    ["motion", "@gsap/react"],
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

  it("permits only declared npm dependencies in node and kit", () => {
    for (const owner of ["node", "kit"]) {
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
