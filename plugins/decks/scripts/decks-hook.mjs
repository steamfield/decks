import { spawnSync } from "node:child_process";
import { accessSync, existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

function installedEntry(dir) {
  const require = createRequire(join(dir, "package.json"));
  try {
    return require.resolve("@steamfield/decks");
  } catch (cause) {
    const installed = require.resolve
      .paths("@steamfield/decks")
      ?.some((path) => existsSync(join(path, "@steamfield/decks")));
    if (cause.code !== "MODULE_NOT_FOUND" || installed) throw cause;
  }
}

function run() {
  const input = readFileSync(0);
  let payload;
  try {
    payload = JSON.parse(input.toString("utf8"));
  } catch {
    // The installed lint hook reports malformed payloads and refuses the write.
  }
  const projectDir = resolve(
    process.env.CLAUDE_PROJECT_DIR ||
      (typeof payload?.cwd === "string" && payload.cwd) ||
      process.cwd(),
  );
  const files = [];
  if (process.argv[2] === "lint") {
    if (typeof payload?.tool_input?.file_path === "string")
      files.push(payload.tool_input.file_path);
    if (payload?.tool_name === "apply_patch" && typeof payload.tool_input?.command === "string")
      for (const match of payload.tool_input.command.matchAll(
        /^\*\*\* (?:Add File|Update File|Delete File|Move to): (.+)$/gm,
      ))
        files.push(match[1].trim());
  }
  const directories = files.map((file) => dirname(resolve(projectDir, file)));
  const entries = new Set();
  for (const dir of new Set(directories)) {
    const entry = installedEntry(dir);
    if (entry) entries.add(entry);
  }
  if (!entries.size) {
    const entry = installedEntry(projectDir);
    if (entry) entries.add(entry);
  }
  if (entries.size > 1)
    throw new Error("Multiple Decks installations found; split the patch by project.");
  const [entry] = entries;
  if (!entry) return;
  const cli = join(dirname(entry), "cli.js");
  accessSync(cli);
  const child = spawnSync(process.execPath, [cli, "hook", process.argv[2]], {
    cwd: projectDir,
    input,
    stdio: ["pipe", "inherit", "inherit"],
  });
  if (child.error) throw child.error;
  if (child.status === null) throw new Error(`hook terminated by ${child.signal}`);
  if (child.status !== 0 && !(process.argv[2] === "lint" && child.status === 2))
    throw new Error(`installed hook exited with status ${child.status}`);
  process.exitCode = child.status;
}

try {
  run();
} catch (cause) {
  console.error(
    `decks hook could not run: ${String(cause instanceof Error ? cause.message : cause).replace(/[\r\n]+/g, " ")}`,
  );
  process.exitCode = process.argv[2] === "lint" ? 2 : 0;
}
