// `make ci-fresh`: what Workers Builds sees. Clones the committed HEAD into a new temporary
// directory, so no build output or installed packages from this checkout leak in, then runs
// the deploy's build there (`WORKERS_CI=1 bun run build`, which installs the parent repo and
// builds the example decks first). Uncommitted changes are not included: commit, then run it
// before pushing main.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { stdio: "inherit", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`ci-fresh: ${command} ${args.join(" ")} exited ${result.status}`);
};

const top = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
if (top.status !== 0) throw new Error(`ci-fresh: not in a git checkout: ${top.stderr}`);
const work = mkdtempSync(join(tmpdir(), "decks-ci-fresh-"));
try {
  const clone = join(work, "repo");
  run("git", ["clone", "-q", "--no-hardlinks", top.stdout.trim(), clone]);
  const site = join(clone, "site");
  run("bun", ["install", "--frozen-lockfile"], { cwd: site });
  run("bun", ["run", "build"], { cwd: site, env: { ...process.env, WORKERS_CI: "1" } });
  console.log("ci-fresh: the committed HEAD builds as a deploy would.");
} finally {
  rmSync(work, { recursive: true, force: true });
}
