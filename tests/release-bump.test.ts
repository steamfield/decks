import { execFile, execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { expect, it } from "vitest";

const exec = promisify(execFile);
const script = resolve("scripts/release.mjs");

// A throwaway repo shaped like this one: the two version files, a changelog and a bun workspace.
async function fixture() {
  await mkdir(resolve(".tmp"), { recursive: true });
  const root = await realpath(await mkdtemp(resolve(".tmp/release-bump-")));
  const git = (...args: string[]) =>
    execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  await mkdir(`${root}/packages/decks`, { recursive: true });
  await mkdir(`${root}/plugins/decks/.claude-plugin`, { recursive: true });
  await writeFile(
    `${root}/package.json`,
    JSON.stringify({ name: "w", private: true, workspaces: ["packages/*"] }),
  );
  await writeFile(
    `${root}/packages/decks/package.json`,
    `{\n  "name": "@steamfield/decks",\n  "version": "1.0.0"\n}\n`,
  );
  await writeFile(
    `${root}/plugins/decks/.claude-plugin/plugin.json`,
    `{\n  "name": "decks",\n  "version": "1.0.0"\n}\n`,
  );
  await writeFile(`${root}/CHANGELOG.md`, "# Changelog\n\n## 1.0.0\n\nFirst.\n");
  await exec("bun", ["install"], { cwd: root });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  git("add", "-A");
  git("commit", "-qm", "init");
  const bump = async (version: string) => {
    try {
      const { stdout } = await exec(process.execPath, [script, version], { cwd: root });
      return { status: 0, stdout, stderr: "" };
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || typeof error.code !== "number")
        throw error;
      return {
        status: error.code,
        stdout: "",
        stderr: "stderr" in error ? String(error.stderr) : "",
      };
    }
  };
  return { root, git, bump };
}
const writeChangelog = (root: string, version: string) =>
  writeFile(
    `${root}/CHANGELOG.md`,
    `# Changelog\n\n## ${version}\n\nNext.\n\n## 1.0.0\n\nFirst.\n`,
  );

it("rewrites the package, the plugin and the lockfile, allowing the changelog as the only dirt", async () => {
  const { root, bump } = await fixture();
  await writeChangelog(root, "1.1.0");
  const result = await bump("1.1.0");
  expect(result.status).toBe(0);
  expect(await readFile(`${root}/packages/decks/package.json`, "utf8")).toContain(
    '"version": "1.1.0"',
  );
  expect(await readFile(`${root}/plugins/decks/.claude-plugin/plugin.json`, "utf8")).toContain(
    '"version": "1.1.0"',
  );
  expect(await readFile(`${root}/bun.lock`, "utf8")).toContain('"version": "1.1.0"');
  expect(result.stdout).toContain('git commit -m "chore(release): 1.1.0"');
  expect(result.stdout).toContain("wait for CI to pass on that commit");
});

it("accepts a prerelease version", async () => {
  const { root, bump } = await fixture();
  await writeChangelog(root, "1.1.0-rc.0");
  expect((await bump("1.1.0-rc.0")).status).toBe(0);
  expect(await readFile(`${root}/packages/decks/package.json`, "utf8")).toContain('"1.1.0-rc.0"');
});

const refusals: [
  string,
  (root: string, git: (...a: string[]) => string) => Promise<void> | void,
  string,
  string,
][] = [
  ["a version that is not x.y.z", () => {}, "v1.1.0", "usage: bun run release"],
  [
    "a dirty file other than the changelog",
    (root) => writeFile(`${root}/package.json`, "{}"),
    "1.1.0",
    "uncommitted changes besides CHANGELOG.md",
  ],
  [
    "a branch other than main",
    (_root, git) => void git("checkout", "-q", "-b", "topic"),
    "1.1.0",
    "release from main",
  ],
  [
    "an existing tag",
    (_root, git) => void git("tag", "v1.1.0"),
    "1.1.0",
    "tag v1.1.0 already exists",
  ],
  ["the current version", () => {}, "1.0.0", "is already at 1.0.0"],
  ["a missing changelog section", () => {}, "1.1.0", 'CHANGELOG.md has no "## 1.1.0" section'],
];

it.each(refusals)(
  "refuses %s and leaves the files alone",
  async (_name, setup, version, message) => {
    const { root, git, bump } = await fixture();
    await setup(root, git);
    if (message.includes("is already at")) await writeChangelog(root, version);
    if (message.includes("tag v1.1.0") || message.includes("main") || message.includes("besides"))
      await writeChangelog(root, "1.1.0");
    const before = await readFile(`${root}/packages/decks/package.json`, "utf8");
    const result = await bump(version);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(message);
    expect(result.stderr).not.toContain("node:internal");
    expect(await readFile(`${root}/packages/decks/package.json`, "utf8")).toBe(before);
  },
);
