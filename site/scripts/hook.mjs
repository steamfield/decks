// Runs .claude/hooks/lint-ai-rhetoric.sh (in the parent repository) on the planted
// line and returns its decision, the rules it named, and its reason with the
// scanner's temporary file path shortened to "stdin".
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../..", import.meta.url));

export const PLANTED = '<p class="od-lede">At its core, the tide is a game-changer.</p>';
export const TARGET = "examples/tides/pages/01-cover.md";

export function runHook() {
  const payload = {
    tool_name: "Write",
    tool_input: { file_path: `${repo}${TARGET}`, content: `${PLANTED}\n` },
  };
  const run = spawnSync("bash", [`${repo}.claude/hooks/lint-ai-rhetoric.sh`], {
    input: JSON.stringify(payload),
    encoding: "utf8",
  });
  if (run.status !== 0) throw new Error(`hook exited ${run.status}: ${run.stderr}`);
  const output = JSON.parse(run.stdout).hookSpecificOutput;
  const reason = output.permissionDecisionReason.replace(
    /\S*content-lint-stdin\S*?:(\d+)/g,
    "stdin:$1",
  );
  return {
    hook: ".claude/hooks/lint-ai-rhetoric.sh",
    tool: "Write",
    file: TARGET,
    line: PLANTED,
    decision: output.permissionDecision,
    rules: [...reason.matchAll(/\[([\w-]+)\]/g)].map((match) => match[1]),
    reason: reason.split("\n"),
  };
}
