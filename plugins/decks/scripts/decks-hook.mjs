import { spawnSync } from "node:child_process";
import { accessSync, existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

function run() {
  const input = readFileSync(0);
  let projectDir = process.env.CLAUDE_PROJECT_DIR;
  if (!projectDir) {
    try {
      const payload = JSON.parse(input.toString("utf8"));
      if (typeof payload?.cwd === "string") projectDir = payload.cwd;
    } catch {
      // The installed lint hook reports malformed payloads and refuses the write.
    }
  }
  projectDir = resolve(projectDir || process.cwd());
  const require = createRequire(join(projectDir, "package.json"));
  let entry;
  try {
    entry = require.resolve("@steamfield/decks");
  } catch (cause) {
    const installed = require.resolve.paths("@steamfield/decks")?.some((dir) =>
      existsSync(join(dir, "@steamfield/decks")),
    );
    if (cause.code === "MODULE_NOT_FOUND" && !installed) return;
    throw cause;
  }
  const cli = join(dirname(entry), "cli.js");
  accessSync(cli);
  const child = spawnSync(process.execPath, [cli, "hook", process.argv[2]], {
    cwd: projectDir,
    input,
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (child.error) throw child.error;
  if (child.status === null) throw new Error(`hook terminated by ${child.signal}`);
  if (child.status !== 0 && child.status !== 2)
    throw new Error(`installed hook exited with status ${child.status}`);
  process.exitCode = child.status;
}

try {
  run();
} catch (cause) {
  console.error(
    `decks hook could not run: ${String(cause instanceof Error ? cause.message : cause).replace(/[\r\n]+/g, " ")}`,
  );
  process.exitCode = 2;
}
