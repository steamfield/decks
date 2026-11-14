import { spawnSync } from "node:child_process";
import { cp, mkdir, symlink, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { fixture } from "../deck.test-support";

function hook(
  cwd: string,
  payload: unknown,
  raw?: string,
  cli = resolve("packages/node/src/cli.ts"),
) {
  const result = spawnSync(resolve("node_modules/.bin/tsx"), [cli, "hook", "lint"], {
    cwd,
    input: raw ?? JSON.stringify(payload),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: cwd },
  });
  if (result.error) throw result.error;
  return {
    ...result,
    reason: result.stdout
      ? JSON.parse(result.stdout).hookSpecificOutput.permissionDecisionReason
      : "",
  };
}
const write = (file_path: string, content: string) => ({
  tool_name: "Write",
  tool_input: { file_path, content },
});

it.each([
  ["slides/03-x.mdx", "It's not just a chart, it's a story.", "not-just-reveal"],
  ["components/Stage.tsx", "export const S = () => <p>At its core, tides.</p>;", "banned-phrase"],
  ["layers/footer.tsx", "export const S = () => <p>An em — dash.</p>;", "em-dash"],
  ["components/Stage.tsx", "const COPY = [{lead: 'A seamless tide.'}];", "ai-vocab"],
  ["components/copy.ts", "const COPY = [{body: 'At its core, tides.'}];", "banned-phrase"],
])("denies a Write to %s with the pattern and line", async (file, content, id) => {
  const { dir } = await fixture(onTestFinished);
  const result = hook(dir, write(file, content));
  expect(result.status, result.stderr).toBe(0);
  expect(JSON.parse(result.stdout)).toMatchObject({
    hookSpecificOutput: { hookEventName: "PreToolUse", permissionDecision: "deny" },
  });
  expect(result.reason).toContain(`error  ${id}`);
  expect(result.reason).toContain("stdin:1:");
  expect(result.reason).toContain("lint-allow: pattern-id");
});

it.each([
  ["slides/03-x.mdx", "```\nIt's not just a chart, it's a story.\n```"],
  ["slides/03-x.mdx", "An em — dash. {/* lint-allow: em-dash */}"],
  ["slides/03-x.mdx", "<Notes>At its core, tides.</Notes>"],
  ["slides/03-x.mdx", "In other words, tides."],
  ["slides/03-x.mdx", "---\ntitle: seamless\n---\nClean."],
  ["slides/03-x.mdx", ""],
  ["components/S.tsx", 'const label = "seamless"; export const S = () => <p>Clean.</p>;'],
  ["data/03.ts", "const COPY = [{lead: 'seamless'}];"],
  ["README.md", "An em — dash."],
  ["node_modules/pkg/slides/01.mdx", "An em — dash."],
  ["src/components/S.tsx", "export const S = () => <p>seamless</p>;"],
])("allows clean or out-of-scope Write to %s: %s", async (file, content) => {
  const { dir } = await fixture(onTestFinished);
  const result = hook(dir, write(file, content));
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toBe("");
});

it("scopes absolute paths, nested decks and worktrees by deck.config.ts", async () => {
  const { dir, put } = await fixture(onTestFinished);
  await put(".claude/worktrees/other/talk/deck.config.ts", 'export default {title: "Talk"};');
  expect(hook(dir, write(resolve(dir, "slides/01.mdx"), "An em — dash.")).reason).toContain(
    "em-dash",
  );
  expect(
    hook(dir, write(".claude/worktrees/other/talk/slides/01.mdx", "An em — dash.")).reason,
  ).toContain("em-dash");
  expect(hook(dir, write("outside/slides/01.mdx", "An em — dash.")).stdout).toBe("");
  expect(hook(dir, write("../other/slides/01.mdx", "An em — dash.")).stdout).toBe("");
});

it("ignores tools that do not write", async () => {
  const { dir } = await fixture(onTestFinished);
  expect(hook(dir, { tool_name: "Read", tool_input: { file_path: "slides/01.mdx" } }).stdout).toBe(
    "",
  );
});

it.each([
  "{not json",
  JSON.stringify(write("slides/01.mdx", "<Card>")),
  JSON.stringify(write("components/S.tsx", "const COPY = [")),
  JSON.stringify({ tool_name: "Write", tool_input: { file_path: "slides/01.mdx" } }),
])("refuses an unscannable payload %s", async (raw) => {
  const { dir } = await fixture(onTestFinished);
  const result = hook(dir, null, raw);
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("BLOCKED:");
  expect(result.stderr).toContain("refused");
});

it("denies a mixed Codex patch only for the deck prose file", async () => {
  const { dir } = await fixture(onTestFinished);
  const result = hook(dir, {
    tool_name: "apply_patch",
    tool_input: {
      command: [
        "*** Begin Patch",
        "*** Add File: data/03.ts",
        "+const label = 'seamless';",
        "*** Add File: slides/03-x.mdx",
        "+It's not just a chart, it's a story.",
        "*** End Patch",
      ].join("\n"),
    },
  });
  expect(result.status, result.stderr).toBe(0);
  expect(result.reason).toContain("slides/03-x.mdx:1:1  error  not-just-reveal");
  expect(result.reason).not.toContain("data/03.ts");
  expect(result.reason).not.toContain("ai-vocab");
});

it("allows a Codex patch which only edits data or deletes a slide", async () => {
  const { dir } = await fixture(onTestFinished);
  const result = hook(dir, {
    tool_name: "apply_patch",
    tool_input: {
      command:
        "*** Begin Patch\n*** Add File: data/03.ts\n+const label = 'seamless';\n*** Delete File: slides/01-first.mdx\n*** End Patch",
    },
  });
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toBe("");
});

it.each([undefined, "", "x\twarn\tfoo\tbar\n", "x\terorr\tfoo\tbar\n", "x\terror\t[\tbar\n"])(
  "refuses pattern file %j only when the write touches deck prose",
  async (source) => {
    const { dir } = await fixture(onTestFinished);
    const copy = resolve(dir, "scanner");
    await cp(resolve("packages/node/src"), resolve(copy, "src"), { recursive: true });
    await symlink(resolve("packages/node/node_modules"), resolve(copy, "node_modules"), "dir");
    await mkdir(resolve(copy, "lint"), { recursive: true });
    const cli = resolve(copy, "src/cli.ts");
    if (source !== undefined)
      await writeFile(resolve(copy, "lint/ai-rhetoric-patterns.tsv"), source);
    const refused = hook(dir, write("slides/03-x.mdx", "Clean prose."), undefined, cli);
    expect(refused.status, refused.stderr).toBe(2);
    expect(refused.stderr).toContain("refused");
    const lint = spawnSync(resolve("node_modules/.bin/tsx"), [cli, "lint", "--stdin"], {
      cwd: dir,
      input: "Clean.",
      encoding: "utf8",
    });
    if (lint.error) throw lint.error;
    expect(lint.status, lint.stderr).toBe(2);
    expect(lint.stderr).toContain("patterns file missing, unreadable or invalid");
    expect(lint.stderr).not.toContain("This is a bug");
    const allowed = hook(dir, write("README.md", "seamless"), undefined, cli);
    expect(allowed.status, allowed.stderr).toBe(0);
    expect(allowed.stdout).toBe("");
  },
);

it("finds the deck config above an agent's current subdirectory", async () => {
  const { dir } = await fixture(onTestFinished);
  const result = hook(
    resolve(dir, "slides"),
    write("03-x.mdx", "It's not just a chart, it's a story."),
  );
  expect(result.status, result.stderr).toBe(0);
  expect(result.reason).toContain("not-just-reveal");
});

it("rejects unknown hook options", async () => {
  const { dir } = await fixture(onTestFinished);
  const result = spawnSync(
    resolve("node_modules/.bin/tsx"),
    [resolve("packages/node/src/cli.ts"), "hook", "lint", "--bogus"],
    { cwd: dir, input: "{}", encoding: "utf8" },
  );
  if (result.error) throw result.error;
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Unknown option");
});

it("uses configured remark syntax when checking an agent write", async () => {
  const { dir } = await fixture(onTestFinished, {
    "deck.config.ts":
      'import math from "remark-math"; export default {title: "Math", mdx: {remarkPlugins: [math]}};',
  });
  const result = hook(dir, write("slides/02-x.mdx", "$x^{\\alpha}$\n\nAt its core, tides."));
  expect(result.status, result.stderr).toBe(0);
  expect(result.reason).toContain("banned-phrase");
});
