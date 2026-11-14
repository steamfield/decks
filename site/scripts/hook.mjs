// Runs the installed plugin write hook in a project created by the source CLI.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { withScratchProject } from "./scratch-project.mjs";

export const PLANTED = '<p class="od-lede">At its core, the tide is a game-changer.</p>';
export const TARGET = "decks/my-talk/slides/01-cover.mdx";

export function runHook() {
  return withScratchProject((dir) => {
    const payload = {
      tool_name: "Write",
      tool_input: { file_path: join(dir, TARGET), content: `${PLANTED}\n` },
    };
    const settings = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8"));
    if (!settings.enabledPlugins?.["decks@steamfield"])
      throw new Error("decks init did not enable the Decks plugin");
    const pluginRoot = resolve(process.cwd(), "../plugins/decks");
    const hooks = JSON.parse(readFileSync(join(pluginRoot, "hooks/hooks.json"), "utf8"));
    const { command, args } = hooks.hooks.PreToolUse[0].hooks[0];
    const run = spawnSync(
      command,
      args.map((arg) => arg.replace(/^\$\{CLAUDE_PLUGIN_ROOT\}/, pluginRoot)),
      {
        input: JSON.stringify(payload),
        encoding: "utf8",
        env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
      },
    );
    if (run.error) throw run.error;
    if (run.status !== 0 && run.status !== 2)
      throw new Error(`hook exited ${run.status}: ${run.stderr}`);
    const output = JSON.parse(run.stdout).hookSpecificOutput;
    const reason = output.permissionDecisionReason.replace(
      /\S*(?:content-lint-stdin|decks-lint-stdin)\S*?:(\d+)/g,
      "stdin:$1",
    );
    return {
      hook: [command, ...args].join(" "),
      tool: "Write",
      file: TARGET,
      line: PLANTED,
      decision: output.permissionDecision,
      rules: [...reason.matchAll(/\berror\s+([\w-]+)\s/g)].map((match) => match[1]),
      reason: reason.split("\n"),
    };
  });
}
