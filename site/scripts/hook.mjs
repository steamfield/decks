// Sends the planted line through the write hook of a project set up with
// `decks init` (scripts/scratch-project.mjs) as a Claude Code PreToolUse payload,
// and returns the hook's decision, the rules it named and its reason, with the
// scanner's temporary file path shortened to "stdin". It runs the PreToolUse
// command init wrote into .claude/settings.json, exactly as Claude Code would:
// .claude/hooks/decks.sh, which calls the installed package's `decks hook lint`.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { withScratchProject } from "./scratch-project.mjs";

export const PLANTED = '<p class="od-lede">At its core, the tide is a game-changer.</p>';
export const TARGET = "decks/my-talk/pages/01-cover.md";
export const HOOK = ".claude/hooks/decks.sh hook lint";

export function runHook() {
  return withScratchProject((dir) => {
    const payload = {
      tool_name: "Write",
      tool_input: { file_path: join(dir, TARGET), content: `${PLANTED}\n` },
    };
    const settings = JSON.parse(readFileSync(join(dir, ".claude/settings.json"), "utf8"));
    const command = settings.hooks.PreToolUse[0].hooks[0].command;
    const run = spawnSync("sh", ["-c", command], {
      input: JSON.stringify(payload),
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    });
    if (run.status !== 0) throw new Error(`hook exited ${run.status}: ${run.stderr}`);
    const output = JSON.parse(run.stdout).hookSpecificOutput;
    const reason = output.permissionDecisionReason.replace(
      /\S*content-lint-stdin\S*?:(\d+)/g,
      "stdin:$1",
    );
    return {
      hook: HOOK,
      tool: "Write",
      file: TARGET,
      line: PLANTED,
      decision: output.permissionDecision,
      rules: [...reason.matchAll(/\[([\w-]+)\]/g)].map((match) => match[1]),
      reason: reason.split("\n"),
    };
  });
}
