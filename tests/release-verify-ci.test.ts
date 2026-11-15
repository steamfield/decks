import { mkdir, writeFile } from "node:fs/promises";
import { expect, it } from "vitest";
import {
  pathWith,
  runStepScript,
  tempDir,
  workflowStepScript,
} from "./release-workflow.test-support";

type Run = { status: string; conclusion: string | null };

// The release workflow's `Verify CI passed on this commit` step, run as the workflow runs it,
// against a fake `gh` that lists the given CI runs.
async function verify(runs: Run[]) {
  const root = await tempDir("release-verify-");
  await mkdir(`${root}/bin`);
  await writeFile(
    `${root}/bin/gh`,
    `#!${process.execPath}\nconsole.log(${JSON.stringify(JSON.stringify(runs))});\n`,
    { mode: 0o755 },
  );
  const script = await workflowStepScript("Verify CI passed on this commit");
  return runStepScript(script, {
    cwd: root,
    env: {
      HOME: root,
      PATH: pathWith(`${root}/bin`),
      GITHUB_REPOSITORY: "steamfield/decks",
      GITHUB_SHA: "0123456789abcdef",
    },
  });
}

const ok: Run = { status: "completed", conclusion: "success" };

it("passes when CI succeeded on the commit", async () => {
  expect((await verify([ok])).status).toBe(0);
});

it("passes when a failed CI run was rerun to success", async () => {
  const failed: Run = { status: "completed", conclusion: "failure" };
  expect((await verify([failed, ok])).status).toBe(0);
});

it.each([
  [
    "CI is still running",
    [{ status: "in_progress", conclusion: null }],
    "CI is still running on 0123456",
  ],
  ["CI failed", [{ status: "completed", conclusion: "failure" }], "CI did not pass on 0123456"],
  ["there is no CI run", [], "No CI run found for 0123456"],
] as [string, Run[], string][])("refuses the release when %s", async (_name, runs, message) => {
  const { status, stderr } = await verify(runs);
  expect(status).toBe(1);
  expect(stderr).toContain("::error title=CI has not passed on this commit::");
  expect(stderr).toContain(message);
});
