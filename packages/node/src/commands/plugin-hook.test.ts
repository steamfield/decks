import { spawnSync } from "node:child_process";
import { rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { beforeAll, expect, it } from "vitest";
import { buildPluginPackage, pluginProject } from "./plugin.test-support";

let packageDir: string;
beforeAll(async () => {
  packageDir = await buildPluginPackage();
}, 60_000);

const script = resolve("plugins/decks/scripts/decks-hook.mjs");
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

it("refuses a write when the installed CLI cannot load its runtime dependencies", async () => {
  const { dir, pkg } = await pluginProject(packageDir);
  await rm(join(pkg, "node_modules"));
  const result = hook(dir, write);
  expect(result.stderr).toContain("ERR_MODULE_NOT_FOUND");
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("decks hook could not run: installed hook exited with status 1");
});

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
