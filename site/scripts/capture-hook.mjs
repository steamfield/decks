// Feeds the repository's prose-lint hook one planted line as a Claude Code
// PreToolUse payload and records its answer in fixtures/hook-denial.json, the
// source of the landing page's hook panel. src/content-drift.test.ts runs the
// hook again and fails if its answer changes. Needs jq, like the hook itself.
//
//   node scripts/capture-hook.mjs
import { writeFileSync } from "node:fs";
import { runHook } from "./hook.mjs";

const denial = runHook();
writeFileSync(
  new URL("../fixtures/hook-denial.json", import.meta.url),
  `${JSON.stringify(denial, null, 2)}\n`,
);
console.log(
  `wrote fixtures/hook-denial.json: ${denial.decision}, rules ${denial.rules.join(", ")}`,
);
