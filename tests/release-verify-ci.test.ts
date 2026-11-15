import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";
import { expect, it } from "vitest";

const exec = promisify(execFile);
type Run = { status: string; conclusion: string | null };

// The release workflow's `Verify CI passed on this commit` step, run as the workflow runs it,
// against a fake `gh` that lists the given CI runs.
async function verify(runs: Run[]) {
  await mkdir(resolve(".tmp"), { recursive: true });
  const root = await realpath(await mkdtemp(resolve(".tmp/release-verify-")));
  await mkdir(`${root}/bin`);
  await writeFile(
    `${root}/bin/gh`,
    `#!${process.execPath}\nconsole.log(${JSON.stringify(JSON.stringify(runs))});\n`,
    { mode: 0o755 },
  );
  const workflow = await readFile(".github/workflows/release.yml", "utf8");
  const block = workflow
    .split("      - name: Verify CI passed on this commit")[1]
    ?.split("        run: |\n")[1]
    ?.split("\n\n")[0];
  if (!block) throw new Error("Release workflow has no `Verify CI passed on this commit` step");
  const script = block
    .split("\n")
    .map((line) => line.replace(/^ {10}/, ""))
    .join("\n");
  try {
    await exec("/bin/bash", ["-e", "-c", script], {
      cwd: root,
      env: {
        HOME: root,
        PATH: `${root}/bin:${dirname(process.execPath)}:/usr/bin:/bin`,
        GITHUB_REPOSITORY: "steamfield/decks",
        GITHUB_SHA: "0123456789abcdef",
      },
    });
    return { status: 0, stderr: "" };
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || typeof error.code !== "number")
      throw error;
    return { status: error.code, stderr: "stderr" in error ? String(error.stderr) : "" };
  }
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
