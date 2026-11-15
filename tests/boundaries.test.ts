import { readFileSync } from "node:fs";

import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";
import {
  checkDependencies,
  checkSource,
  type Manifest,
  packageDirectories,
  ROOT,
  RULES,
  sourceFiles,
} from "./boundaries.test-support";

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
            Object.keys(manifest.devDependencies ?? {}),
          ),
        );
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
