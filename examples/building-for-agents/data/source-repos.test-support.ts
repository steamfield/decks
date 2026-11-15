/**
 * Shared setup for the data tests that check slide content against the sibling repositories
 * under ~/Projects (stacks, rr, statglass, ...). Those repositories exist only on the author's
 * machine, so the whole group is opt-in: set DECKS_SOURCE_REPOS=1 to run it. When set, a missing
 * repository, commit or file is an error naming the thing that is missing, never a skip.
 * These tests are outside the gate; run them by hand with a vitest config that includes them.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { describe } from "vitest";

/** True when the author asked for the sibling-repository checks. */
export const sourceReposEnabled = process.env.DECKS_SOURCE_REPOS === "1";

/** A `describe` that runs only under DECKS_SOURCE_REPOS=1 and says so in its name. */
export function describeSourceRepos(name: string, body: () => void): void {
  describe.skipIf(!sourceReposEnabled)(`${name} (needs DECKS_SOURCE_REPOS=1)`, body);
}

/** The checkout of a sibling repository. Throws when it is not there. */
export function repoDir(repo: string): string {
  const dir = join(homedir(), "Projects", repo);
  if (!existsSync(join(dir, ".git"))) {
    throw new Error(`DECKS_SOURCE_REPOS=1 but ${dir} is not a git checkout. Clone ${repo} there.`);
  }
  return dir;
}

function git(repo: string, args: string[]): string {
  try {
    return execFileSync("git", ["-C", repoDir(repo), ...args], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`git ${args.join(" ")} failed in ${repo}: ${detail}`, { cause });
  }
}

/** The text of `path` as it was at `commit`, so a moved branch or local edit cannot change it. */
export function readAtCommit(repo: string, commit: string, path: string): string {
  return git(repo, ["show", `${commit}:${path}`]);
}

/**
 * The absolute path of `path` in the working tree, for a test that must import the file as code.
 * Throws unless the file is identical to what `commit` holds, so the import still reads the
 * pinned version.
 */
export function importablePathAtCommit(repo: string, commit: string, path: string): string {
  readAtCommit(repo, commit, path);
  const drift = git(repo, ["diff", "--stat", commit, "--", path]).trim();
  if (drift !== "") {
    throw new Error(
      `${repo}/${path} differs from commit ${commit} in the working tree:\n${drift}\nCheck out ${commit} or update the pin.`,
    );
  }
  return join(repoDir(repo), path);
}
