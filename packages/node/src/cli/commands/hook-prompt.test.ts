import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { fixture, repoPath } from "../../dev/server.test-support";

// A fixture repository must not read the developer's git config (signing, hooks, templates) or
// inherit GIT_DIR / GIT_INDEX_FILE from a git hook that is running the suite.
const gitEnv = (() => {
  const { GIT_DIR, GIT_INDEX_FILE, GIT_WORK_TREE, ...inherited } = process.env;
  return { ...inherited, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null" };
})();

function git(cwd: string, ...args: string[]) {
  const result = spawnSync("git", ["-c", "commit.gpgsign=false", ...args], {
    cwd,
    encoding: "utf8",
    env: gitEnv,
  });
  expect(result.status, result.stderr).toBe(0);
}

function prompt(cwd: string, text: string, raw?: string) {
  const result = spawnSync(
    repoPath("node_modules/.bin/tsx"),
    [repoPath("packages/node/src/cli/cli.ts"), "hook", "prompt"],
    {
      cwd,
      input: raw ?? JSON.stringify({ prompt: text, cwd }),
      encoding: "utf8",
      env: { ...gitEnv, CLAUDE_PROJECT_DIR: "" },
    },
  );
  if (result.error) throw result.error;
  return {
    ...result,
    context: result.stdout ? JSON.parse(result.stdout).hookSpecificOutput.additionalContext : "",
  };
}

it.each([
  "make a 5-slide story deck about tides",
  "Draft the slides for my talk",
  "the presentation needs a rewrite, can you revise it",
])("adds the reminder for %j", async (text) => {
  const { dir } = await fixture(onTestFinished);
  const result = prompt(dir, text);
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toMatchObject({
    hookSpecificOutput: { hookEventName: "UserPromptSubmit" },
  });
  expect(result.context).toContain("Deck writing reminder");
  expect(result.context).toContain("slides/*.mdx");
  expect(result.context).toContain("layers/*.tsx");
  expect(result.context).not.toContain("slides.md");
});

it.each([
  "why does the dev server log a warning on slide 3",
  "bump vitest to the latest version",
  "",
])("stays silent for %j", async (text) => {
  const { dir } = await fixture(onTestFinished);
  const result = prompt(dir, text);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toBe("");
});

it("ignores malformed prompt payloads because the reminder is advisory", async () => {
  const { dir } = await fixture(onTestFinished);
  const result = prompt(dir, "", "{not json");
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toBe("");
});

it("recognizes a short revision prompt only when deck prose has uncommitted changes", async () => {
  const { dir, put } = await fixture(onTestFinished, {
    "src/components/S.tsx": "export const S = () => <p />;",
  });
  git(dir, "init", "-q");
  git(dir, "add", "-A");
  git(dir, "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "Initial");
  expect(prompt(dir, "tighten this bullet").stdout).toBe("");
  await put("src/components/S.tsx", "export const S = () => <p>App text.</p>;");
  expect(prompt(dir, "tighten this bullet").stdout).toBe("");
  await put("slides/01-first.mdx", "# Revised.");
  expect(prompt(dir, "tighten this bullet").context).toContain("Deck writing reminder");
  git(dir, "add", "slides/01-first.mdx");
  expect(prompt(dir, "tighten this bullet").context).toContain("Deck writing reminder");
});

it("resolves modified deck paths against the Git root above the project", async () => {
  const { dir, put } = await fixture(onTestFinished, {
    "project/talk/deck.config.ts": 'export default {title: "Talk"};',
    "project/talk/slides/01.mdx": "# Head.",
  });
  for (const args of [
    ["init", "-q"],
    ["add", "-A"],
    ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "Initial"],
  ]) {
    git(dir, ...args);
  }
  await put("project/talk/slides/01.mdx", "# Revised.");
  expect(prompt(resolve(dir, "project"), "tighten this bullet").context).toContain(
    "Deck writing reminder",
  );
});

it("recognizes a renamed slide's source path when it moves out of the deck", async () => {
  const { dir } = await fixture(onTestFinished);
  for (const args of [
    ["init", "-q"],
    ["add", "-A"],
    ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-qm", "Initial"],
    ["mv", "slides/01-first.mdx", "archived.mdx"],
  ]) {
    git(dir, ...args);
  }
  const result = prompt(dir, "tighten this bullet");
  expect(result.status, result.stderr).toBe(0);
  expect(result.context).toContain("Deck writing reminder");
});
