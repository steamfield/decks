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
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSync, Visitor } from "oxc-parser";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));

type Rule = {
  workspace: string[];
  react: boolean;
  node: boolean;
  npm: "none" | "declared";
};

export const RULES: Record<string, Rule> = {
  core: { workspace: [], react: false, node: false, npm: "none" },
  runtime: { workspace: ["core"], react: true, node: false, npm: "declared" },
  motion: { workspace: ["core", "runtime"], react: true, node: false, npm: "declared" },
  node: { workspace: ["core"], react: false, node: true, npm: "declared" },
  kit: { workspace: ["core", "runtime", "motion"], react: true, node: false, npm: "declared" },
  decks: {
    workspace: ["core", "runtime", "motion", "node", "kit"],
    react: true,
    node: true,
    npm: "declared",
  },
};

export type Manifest = {
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
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
  if (name === "@steamfield/decks") return "workspace dependency is forbidden";
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

export function checkDependencies(owner: string, manifest: Manifest): string[] {
  const declared = Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies });
  return declared.flatMap((specifier) => {
    const reason = importViolation(owner, specifier, declared);
    return reason ? [`packages/${owner}/package.json: ${specifier}: ${reason}`] : [];
  });
}

/** Reads module requests using the same parser as Vite, including type-only imports. */
export function checkSource(
  owner: string,
  file: string,
  source: string,
  declared: string[] = [],
  devDependencies: string[] = [],
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
      const testFile = /\.test(?:-support)?\.tsx?$/.test(file);
      const reason = importViolation(
        owner,
        specifier,
        testFile ? [...declared, ...devDependencies] : declared,
        testFile,
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

export function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(file)
      : /\.(?:[jt]sx?|m[jt]s|cts)$/.test(entry.name)
        ? [file]
        : [];
  });
}

export function packageDirectories(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

export function lintSource(
  file: string,
  source: string,
  dependencies: Record<string, string> = {},
  only = "style/noRestrictedImports",
) {
  mkdirSync(join(ROOT, ".tmp"), { recursive: true });
  const fixture = mkdtempSync(join(ROOT, ".tmp/react-decks-biome-"));
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

export function typecheckSource(owner: string, file: string, source: string) {
  mkdirSync(join(ROOT, ".tmp"), { recursive: true });
  const fixture = mkdtempSync(join(ROOT, ".tmp/react-decks-typecheck-"));
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
