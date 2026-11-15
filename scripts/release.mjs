// `bun run release <version>`: rewrite every place the version lives, so a bump cannot miss one.
//
// It edits files and updates the lockfile with `bun install`; it never commits, tags or pushes.
// The release workflow publishes when a `v<version>` tag is pushed on the bump commit.
// A modified CHANGELOG.md is the only dirt it accepts, because the documented flow writes the
// changelog first and commits it together with the bump.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

// A refused precondition is an expected outcome, not a crash: say what to do, exit 1, no stack.
const refuse = (message) => {
  console.error(`release: ${message}`);
  process.exit(1);
};
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });

const files = ["packages/decks/package.json", "plugins/decks/.claude-plugin/plugin.json"];
const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version))
  refuse("usage: bun run release <x.y.z[-rc.N]> (no leading v)");

const dirty = git("status", "--porcelain")
  .split("\n")
  .filter((line) => line && line.slice(3) !== "CHANGELOG.md");
if (dirty.length > 0)
  refuse(
    `the working tree has uncommitted changes besides CHANGELOG.md:\n${dirty.join("\n")}\nCommit or stash them first.`,
  );
if (git("branch", "--show-current").trim() !== "main") refuse("release from main");
if (git("tag", "--list", `v${version}`).trim() !== "") refuse(`tag v${version} already exists`);

const versionLine = /("version": ")[^"]+(")/;
const previous = /"version": "([^"]+)"/.exec(readFileSync(files[0], "utf8"))?.[1];
if (previous === version) refuse(`${files[0]} is already at ${version}`);

const heading = new RegExp(`^## \\[?${version.replaceAll(".", "\\.")}\\]?(\\s|$)`, "m");
if (!heading.test(readFileSync("CHANGELOG.md", "utf8")))
  refuse(`CHANGELOG.md has no "## ${version}" section: write it first`);

for (const file of files) {
  const text = readFileSync(file, "utf8");
  if (!versionLine.test(text)) refuse(`${file} has no "version" field: update scripts/release.mjs`);
  writeFileSync(file, text.replace(versionLine, `$1${version}$2`));
}
execFileSync("bun", ["install"], { stdio: "inherit" });

console.log(`Prepared ${previous} -> ${version}. Next:
  bun run check
  git add -A && git commit -m "chore(release): ${version}"
  git push origin main      # then wait for CI to pass on that commit
  git tag v${version} && git push origin v${version}   # tag that commit, not before`);
