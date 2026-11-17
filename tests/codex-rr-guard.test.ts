import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { repoRoot } from "./release-workflow.test-support";

const script = resolve(repoRoot, "scripts/codex-rr-guard.mjs");

// Runs the hook as Codex does: the PreToolUse payload on stdin, the exit code and stderr out.
function guard(stdin: string): Promise<{ code: number; stderr: string }> {
  return new Promise((done) => {
    const child = execFile(process.execPath, [script], (error, _stdout, stderr) => {
      done({ code: error ? Number(error.code) : 0, stderr });
    });
    child.stdin?.end(stdin);
  });
}

const bash = (command: string) =>
  guard(
    JSON.stringify({ hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command } }),
  );

it.each([
  "bun run test packages/core",
  "bun run test:e2e e2e/play.spec.ts --repeat-each=5",
  "bun run check",
  "cd packages/node && bun run test",
  "bunx vitest run packages/kit",
  "npx playwright test e2e/code.spec.ts",
  "node_modules/.bin/vitest run",
  "bun test",
])("blocks %s and names the rr task to use", async (command) => {
  const { code, stderr } = await bash(command);
  expect(code).toBe(2);
  expect(stderr).toContain("rr rd-test <path>");
});

it.each([
  "rr rd-test packages/core",
  "rr rd-e2e -- e2e/play.spec.ts --repeat-each=5",
  "rr rd-check",
  'rr run --local "bun run check"',
  "bun run lint",
  "bun run typecheck",
  "bun run test:tarball",
  "bun run check:isolated",
  "bun run decks check agents",
  "git commit -m 'test: check the guard'",
])("lets %s through", async (command) => {
  expect(await bash(command)).toEqual({ code: 0, stderr: "" });
});

it("fails the hook, without blocking, on input that is not JSON", async () => {
  const { code, stderr } = await guard("not json");
  expect(code).toBe(1);
  expect(stderr).toMatch(/^codex-rr-guard: hook input is not JSON .*: not json/);
});
