// Codex PreToolUse hook on Bash (.codex/hooks.json): blocks running Vitest, Playwright or the
// gate directly and names the rr task to use instead. Parallel Codex runs that each start a
// gate on this machine starve each other's builds and browser tests; through rr they queue on
// host locks and spread across the hosts in .rr.yaml. A blocked command exits 2 with the
// reason on stderr, which Codex shows the model.

const direct = [
  // bun/npm/pnpm/yarn [run] test | test:e2e | check, but not test:tarball or check:isolated
  /\b(?:bun|npm|pnpm|yarn)\s+(?:run\s+)?(?:test(?::e2e)?|check)(?![\w:-])/,
  /\b(?:bunx|npx|pnpx)\s+(?:vitest|playwright\s+test)\b/,
  /(?:^|[\s;&|(/])(?:vitest|playwright\s+test)(?:\s|$)/,
];

const reason = `Run tests through rr, not directly: rr queues parallel agents on host locks instead of starving one machine.
  rr rd-test <path>                      Vitest (flags after --: rr rd-test -- <path> -t "name")
  rr rd-e2e -- <spec> [--repeat-each=5]  Playwright
  rr rd-check                            the full gate
  rr run --local "<command>"             any other test command, on this machine under the same lock
Lint, typecheck and the decks CLI run directly.`;

let input = "";
for await (const chunk of process.stdin) input += chunk;

let command;
try {
  command = JSON.parse(input).tool_input?.command;
} catch (error) {
  console.error(
    `codex-rr-guard: hook input is not JSON (${error.message}): ${input.slice(0, 200)}`,
  );
  process.exit(1);
}

if (typeof command !== "string") process.exit(0);
const throughRr = /(?:^|[\s;&|(])rr\s/.test(command);
if (!throughRr && direct.some((pattern) => pattern.test(command))) {
  console.error(reason);
  process.exit(2);
}
