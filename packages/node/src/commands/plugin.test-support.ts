import { execFile, spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { afterAll, onTestFinished } from "vitest";

let buildRoot: string | undefined;
afterAll(async () => {
  if (buildRoot) await rm(buildRoot, { recursive: true, force: true });
});

export async function buildPluginPackage() {
  await mkdir(resolve("../.tmp"), { recursive: true });
  buildRoot = await mkdtemp(resolve("../.tmp/rd-plugin-build-"));
  const workspace = join(buildRoot, "react-decks");
  await mkdir(workspace);
  for (const path of ["package.json", "bun.lock", "tsconfig.json", "packages", "docs/guide"]) {
    await mkdir(dirname(join(workspace, path)), { recursive: true });
    await cp(resolve(path), join(workspace, path), {
      recursive: true,
      filter: (source) => !["node_modules", "dist", "docs"].includes(basename(source)),
    });
  }
  await cp(resolve("plugins/decks/skills"), join(buildRoot, "plugins/decks/skills"), {
    recursive: true,
  });
  const sourceSkill = join(buildRoot, "plugins/decks/skills/init-fixture");
  await mkdir(join(sourceSkill, "references"), { recursive: true });
  await writeFile(join(sourceSkill, "SKILL.md"), "# Packaged fixture\n");
  await writeFile(
    join(sourceSkill, "references/image.png"),
    Buffer.from([137, 80, 78, 71, 255, 0]),
  );
  await promisify(execFile)("bun", ["install", "--offline", "--frozen-lockfile"], {
    cwd: workspace,
  });
  await promisify(execFile)("bun", ["run", "--cwd", "packages/decks", "build"], {
    cwd: workspace,
  });
  return join(workspace, "packages/decks");
}

export async function pluginProject(installed?: string) {
  // Outside react-decks so the absent-package case cannot resolve its workspace dependency.
  await mkdir(resolve("../.tmp"), { recursive: true });
  const dir = await mkdtemp(resolve("../.tmp/rd-plugin-"));
  onTestFinished(() => rm(dir, { recursive: true, force: true }));
  const put = async (file: string, text: string) => {
    await mkdir(dirname(join(dir, file)), { recursive: true });
    await writeFile(join(dir, file), text);
  };
  await put("package.json", '{"private":true,"type":"module"}');
  const pkg = join(dir, "installed-decks");
  if (installed) {
    await mkdir(pkg);
    await cp(join(installed, "dist"), join(pkg, "dist"), { recursive: true });
    await cp(join(installed, "package.json"), join(pkg, "package.json"));
    await symlink(join(installed, "node_modules"), join(pkg, "node_modules"), "dir");
    await mkdir(join(dir, "node_modules/@steamfield"), { recursive: true });
    await symlink(pkg, join(dir, "node_modules/@steamfield/decks"), "dir");
  }
  return { dir, pkg, put };
}

export function installedInit(dir: string, args: string[] = []) {
  const result = spawnSync(
    process.execPath,
    [join(dir, "installed-decks/dist/cli.js"), "init", ...args],
    { cwd: dir, encoding: "utf8" },
  );
  if (result.error) throw result.error;
  return result;
}
