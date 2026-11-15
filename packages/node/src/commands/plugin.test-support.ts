import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { onTestFinished } from "vitest";

export async function pluginProject(installed?: string) {
  // Outside the workspace so the absent-package case cannot resolve its dependency.
  const dir = await mkdtemp(join(tmpdir(), "rd-plugin-"));
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
