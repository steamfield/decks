import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import type { TestProject } from "vitest/node";

export default async function setup(project: TestProject) {
  await mkdir(resolve(".tmp"), { recursive: true });
  const workspace = await mkdtemp(resolve(".tmp/package-build-"));
  try {
    for (const path of [
      "package.json",
      "bun.lock",
      "tsconfig.json",
      "packages",
      "docs/guide",
      "plugins/decks/skills",
    ]) {
      await mkdir(dirname(join(workspace, path)), { recursive: true });
      await cp(resolve(path), join(workspace, path), {
        recursive: true,
        filter: (source) => !["node_modules", "dist", "docs"].includes(basename(source)),
      });
    }
    await promisify(execFile)("bun", ["install", "--offline", "--frozen-lockfile"], {
      cwd: workspace,
    });
    const fixture = join(workspace, "plugins/decks/skills/init-fixture");
    await mkdir(join(fixture, "references"), { recursive: true });
    await writeFile(join(fixture, "SKILL.md"), "# Packaged fixture\n");
    await writeFile(join(fixture, "references/image.png"), Buffer.from([137, 80, 78, 71, 255, 0]));
    const builtPackage = join(workspace, "packages/decks");
    await promisify(execFile)("node", ["build.mjs"], { cwd: builtPackage });
    // Source deck configs resolve the workspace package through Jiti, outside Vitest's resolver.
    for (const path of ["dist", "docs"]) {
      await rm(resolve("packages/decks", path), { recursive: true, force: true });
      await cp(join(builtPackage, path), resolve("packages/decks", path), { recursive: true });
    }
    project.provide("builtPackage", resolve("packages/decks"));
  } catch (cause) {
    await rm(workspace, { recursive: true, force: true });
    throw cause;
  }
  return async () => {
    await rm(resolve("packages/decks/dist/plugin/skills/init-fixture"), {
      recursive: true,
      force: true,
    });
    await rm(workspace, { recursive: true, force: true });
  };
}
