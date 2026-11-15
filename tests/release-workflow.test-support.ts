import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { parse } from "yaml";

const exec = promisify(execFile);

/** The repository root, found from this file rather than from the process's working directory. */
export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** A fresh directory under the repo's `.tmp/`, with symlinks resolved. */
export async function tempDir(prefix: string): Promise<string> {
  const parent = resolve(repoRoot, ".tmp");
  await mkdir(parent, { recursive: true });
  return realpath(await mkdtemp(resolve(parent, prefix)));
}

type WorkflowStep = { name?: string; run?: string };
type Workflow = { jobs: Record<string, { steps?: WorkflowStep[] }> };

/** The `run` script of the release workflow's step with this name, exactly as GitHub runs it. */
export async function workflowStepScript(stepName: string): Promise<string> {
  const text = await readFile(resolve(repoRoot, ".github/workflows/release.yml"), "utf8");
  const workflow = parse(text) as Workflow;
  const steps = Object.values(workflow.jobs).flatMap((job) => job.steps ?? []);
  const script = steps.find((step) => step.name === stepName)?.run;
  if (!script) throw new Error(`Release workflow has no \`${stepName}\` step with a run script`);
  return script;
}

/**
 * The one PATH policy for release tests: fake tools first, then node's directory and the
 * system directories a runner's shell script can reasonably use.
 */
export const pathWith = (fakeBin: string) =>
  `${fakeBin}:${dirname(process.execPath)}:/usr/bin:/bin`;

/**
 * The process environment with git isolated from the developer's machine: no global or system
 * config (signing, hooks, templates) and no GIT_DIR or GIT_INDEX_FILE inherited from a hook.
 */
export function isolatedGitEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_SYSTEM: "/dev/null",
  };
  delete env.GIT_DIR;
  delete env.GIT_INDEX_FILE;
  return env;
}

/** Runs a workflow step's script in bash as the workflow does, returning its exit status. */
export async function runStepScript(
  script: string,
  options: { cwd: string; env: Record<string, string> },
) {
  try {
    const { stdout, stderr } = await exec("/bin/bash", ["-e", "-c", script], options);
    return { status: 0, stdout, stderr };
  } catch (error) {
    if (!(error instanceof Error) || !("code" in error) || typeof error.code !== "number")
      throw error;
    return {
      status: error.code,
      stdout: "stdout" in error ? String(error.stdout) : "",
      stderr: "stderr" in error ? String(error.stderr) : "",
    };
  }
}
