import { spawnSync } from "node:child_process";
import { mkdir, rename, rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import { expect, inject, it } from "vitest";
import { repoPath } from "../../dev/server.test-support";
import { pluginProject } from "./plugin.test-support";

const packageDir = inject("builtPackage");

const script = repoPath("plugins/decks/scripts/decks-hook.mjs");
function hook(
  dir: string,
  payload: unknown,
  kind = "lint",
  env: Record<string, string> = { CLAUDE_PROJECT_DIR: dir },
) {
  const result = spawnSync(process.execPath, [script, kind], {
    cwd: dir,
    input: typeof payload === "string" ? payload : JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: "", ...env },
  });
  if (result.error) throw result.error;
  return result;
}
const write = {
  tool_name: "Write",
  tool_input: { file_path: "decks/q3/slides/02-x.mdx", content: "At its core, tides." },
};

it("denies banned deck prose through the project's linked built package with its pattern name", async () => {
  const { dir, put } = await pluginProject(packageDir);
  await put("decks/q3/deck.config.ts", 'export default {title: "Quarterly"};');
  const result = hook(dir, write);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stderr).toBe("");
  expect(JSON.parse(result.stdout)).toMatchObject({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny" },
  });
  expect(JSON.parse(result.stdout).hookSpecificOutput.permissionDecisionReason).toContain(
    "banned-phrase",
  );
});

it("forwards prompt context and uses the payload cwd when the project environment is absent", async () => {
  const { dir } = await pluginProject(packageDir);
  const result = hook(dir, { cwd: dir, prompt: "Write a deck about tides" }, "prompt", {});
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout).hookSpecificOutput).toMatchObject({
    hookEventName: "UserPromptSubmit",
    additionalContext: expect.stringContaining("Headlines are CLAIMS"),
  });
});

it.each(["lint", "prompt"])("silently allows %s in a project without the package", async (kind) => {
  const { dir } = await pluginProject();
  const result = hook(dir, { ...write, prompt: "Write a deck" }, kind);
  expect(result.status).toBe(0);
  expect(result.stdout).toBe("");
  expect(result.stderr).toBe("");
});

it("preserves the lint hook's refusal and exit code for malformed input", async () => {
  const { dir } = await pluginProject(packageDir);
  const result = hook(dir, "{broken");
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("BLOCKED:");
  expect(result.stdout).toBe("");
});

it.each(["lint", "prompt"])(
  "reports broken runtime dependencies with the %s failure policy",
  async (kind) => {
    const { dir, pkg } = await pluginProject(packageDir);
    await rm(join(pkg, "node_modules"));
    const result = hook(dir, { ...write, prompt: "Rewrite this bullet" }, kind);
    expect(result.stderr).toContain("ERR_MODULE_NOT_FOUND");
    expect(result.status).toBe(kind === "lint" ? 2 : 0);
    expect(result.stderr).toContain(
      "decks hook could not run: installed hook exited with status 1",
    );
  },
);

it("keeps a revision prompt when git is missing and reports the reason", async () => {
  const { dir } = await pluginProject(packageDir);
  const result = hook(dir, { prompt: "Rewrite this bullet" }, "prompt", {
    CLAUDE_PROJECT_DIR: dir,
    PATH: "",
  });
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toBe("");
  expect(result.stderr).toContain("cannot run git");
});

it.each(["Write", "apply_patch"])(
  "finds a subproject's package for %s from the monorepo root",
  async (tool) => {
    const { dir, put } = await pluginProject(packageDir);
    await mkdir(join(dir, "apps/talks"), { recursive: true });
    await rename(join(dir, "node_modules"), join(dir, "apps/talks/node_modules"));
    await put("apps/talks/deck.config.ts", 'export default {title: "Talk"};');
    const path = "apps/talks/slides/01.mdx";
    const payload =
      tool === "Write"
        ? {
            tool_name: tool,
            tool_input: { file_path: join(dir, path), content: "At its core, tides." },
          }
        : {
            tool_name: tool,
            tool_input: {
              command: `*** Begin Patch\n*** Add File: README.md\n+Notes\n*** Add File: ${path}\n+At its core, tides.\n*** End Patch`,
            },
          };
    const result = hook(dir, payload);
    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe("");
    expect(JSON.parse(result.stdout).hookSpecificOutput).toMatchObject({
      permissionDecision: "deny",
      permissionDecisionReason: expect.stringContaining("banned-phrase"),
    });
  },
);

it.each(["cli.js", "index.js"])(
  "refuses with a one-line reason when installed %s is missing",
  async (file) => {
    const { dir, pkg } = await pluginProject(packageDir);
    await rm(join(pkg, "dist", file));
    const result = hook(dir, write);
    expect(result.status).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr.trimEnd().split("\n")).toHaveLength(1);
    expect(result.stderr).toContain("decks hook could not run:");
    expect(result.stderr).toContain(file);
  },
);

it("refuses patches spanning distinct installations and asks to split them by project", async () => {
  const { dir } = await pluginProject(packageDir);
  const other = await pluginProject(packageDir);
  await mkdir(join(dir, "apps/a"), { recursive: true });
  await rename(join(dir, "node_modules"), join(dir, "apps/a/node_modules"));
  await mkdir(join(dir, "apps/b"), { recursive: true });
  await symlink(join(other.dir, "node_modules"), join(dir, "apps/b/node_modules"), "dir");
  const result = hook(dir, {
    tool_name: "apply_patch",
    tool_input: {
      command:
        "*** Begin Patch\n*** Add File: apps/a/README.md\n+Notes\n*** Add File: apps/b/README.md\n+Notes\n*** End Patch",
    },
  });
  expect(result.status).toBe(2);
  expect(result.stdout).toBe("");
  expect(result.stderr).toContain("split the patch by project");
});
