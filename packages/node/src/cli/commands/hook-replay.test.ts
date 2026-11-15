import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { expect, it, onTestFinished } from "vitest";
import { fixture } from "../../dev/server.test-support";

function hook(cwd: string, payload: unknown) {
  const result = spawnSync(
    resolve("node_modules/.bin/tsx"),
    [resolve("packages/node/src/cli/cli.ts"), "hook", "lint"],
    {
      cwd,
      input: JSON.stringify(payload),
      encoding: "utf8",
      env: { ...process.env, CLAUDE_PROJECT_DIR: cwd },
    },
  );
  if (result.error) throw result.error;
  return {
    ...result,
    reason: result.stdout
      ? JSON.parse(result.stdout).hookSpecificOutput.permissionDecisionReason
      : "",
  };
}
const edit = (
  old_string: string,
  new_string: string,
  file_path = "slides/03-x.mdx",
  replace_all = false,
) => ({ tool_name: "Edit", tool_input: { file_path, old_string, new_string, replace_all } });

it("denies a Claude Edit at its post-edit line and leaves untouched violations alone", async () => {
  const { dir } = await fixture(onTestFinished, {
    "slides/03-x.mdx": "# Clean.\n\nAn em — dash.\n\nOld text.\n",
  });
  const denied = hook(dir, edit("Old text.", "It's not just a chart, it's a story."));
  expect(denied.status, denied.stderr).toBe(0);
  expect(denied.reason).toContain("slides/03-x.mdx:5:1  error  not-just-reveal");
  expect(denied.reason).not.toContain("em-dash");
  expect(hook(dir, edit("Old text.", "New text.")).stdout).toBe("");
});

it("replays edits in fenced code and COPY context", async () => {
  const { dir } = await fixture(onTestFinished, {
    "slides/03-x.mdx": "```\nOld text.\n```",
    "components/S.tsx": "const label = 'seamless';\nconst COPY = [{lead: 'High water.'}];",
  });
  expect(hook(dir, edit("Old text.", "It's not just a chart, it's a story.")).stdout).toBe("");
  expect(
    hook(dir, edit("High water.", "At its core, tides.", "components/S.tsx")).reason,
  ).toContain("banned-phrase");
  expect(hook(dir, edit("seamless", "game-changer", "components/S.tsx")).stdout).toBe("");
});

it.each([
  ["Here's the XX thing.\n", "XX ", "", "banned-phrase"],
  ["{/*\nLet that sink in.\n*/}\n", "{/*\n", "", "banned-phrase"],
  ["An em — dash. {/* lint-allow: em-dash */}\n", " {/* lint-allow: em-dash */}", "", "em-dash"],
])("denies a deletion that exposes prose: %j", async (source, old, next, id) => {
  const { dir } = await fixture(onTestFinished, { "slides/03-x.mdx": source });
  const result = hook(dir, edit(old, next));
  expect(result.status, result.stderr).toBe(0);
  expect(result.reason).toContain(id);
});

it.each([
  ["Old — bad.\nZ\n", "\nZ", "\nZ fine"],
  ["# Head.\nremove me\nLet that sink in.\n", "remove me\n", ""],
  ["Old — bad.\n\nGood line.\n", "Good line.", "Better line.\nAnother."],
  ["# Head.\n\nLet that sink in.\n", "# Head.", "# Head.\n\nExtra line."],
])("does not blame a hit that was not written: %j", async (source, old, next) => {
  const { dir } = await fixture(onTestFinished, { "slides/03-x.mdx": source });
  const result = hook(dir, edit(old, next));
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toBe("");
});

it("tracks MultiEdit ranges through later edits and replace_all", async () => {
  const { dir } = await fixture(onTestFinished, {
    "slides/03-x.mdx": "# Head.\n\nOld text.\n\nEND\n",
  });
  const result = hook(dir, {
    tool_name: "MultiEdit",
    tool_input: {
      file_path: "slides/03-x.mdx",
      edits: [
        { old_string: "Old text.", new_string: "An em — dash." },
        { old_string: "# Head.", new_string: "# Head.\n\nExtra." },
        { old_string: "END", new_string: "At its core, tides." },
      ],
    },
  });
  expect(result.reason).toContain("slides/03-x.mdx:5:5  error  em-dash");
  expect(result.reason).toContain("slides/03-x.mdx:7:1  error  banned-phrase");
  const replaced = hook(dir, edit("\n\n", "\n\nAt its core, tides.\n\n", "slides/03-x.mdx", true));
  expect(replaced.reason.match(/error {2}banned-phrase/g)).toHaveLength(2);
});

it("replays a moved Codex file against the original path", async () => {
  const { dir } = await fixture(onTestFinished, { "slides/03-x.mdx": "# Head.\n\nOld text.\n" });
  const result = hook(dir, {
    tool_name: "apply_patch",
    tool_input: {
      command:
        "*** Begin Patch\n*** Update File: slides/03-x.mdx\n*** Move to: slides/04-x.mdx\n@@\n-Old text.\n+At its core, tides.\n*** End Patch",
    },
  });
  expect(result.status, result.stderr).toBe(0);
  expect(result.reason).toContain("slides/04-x.mdx:3:1  error  banned-phrase");
});

it.each([
  edit("missing", "Clean."),
  edit("old", "Clean.", "slides/missing.mdx"),
  { tool_name: "apply_patch", tool_input: { command: "broken" } },
])("refuses when the full post-edit content cannot be determined", async (payload) => {
  const { dir } = await fixture(onTestFinished);
  const result = hook(dir, payload);
  expect(result.status).toBe(2);
  expect(result.stderr).toContain("refused");
});

it("allows an edit that repairs invalid syntax when the resulting file is clean", async () => {
  const { dir } = await fixture(onTestFinished, { "slides/03-x.mdx": "<Card>\n\nClean.\n" });
  const result = hook(dir, edit("<Card>", "<Card />"));
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toBe("");
});

it("uses a Codex hunk anchor to distinguish repeated text in code and prose", async () => {
  const { dir } = await fixture(onTestFinished, {
    "slides/03-x.mdx": "```\nOld text.\n```\n\n# Visible.\nOld text.\n",
  });
  const result = hook(dir, {
    tool_name: "apply_patch",
    tool_input: {
      command:
        "*** Begin Patch\n*** Update File: slides/03-x.mdx\n@@ # Visible.\n-Old text.\n+It's not just a chart, it's a story.\n*** End Patch",
    },
  });
  expect(result.status, result.stderr).toBe(0);
  expect(result.reason).toContain("slides/03-x.mdx:6:1  error  not-just-reveal");
});

it("honors End of File when repeated text appears earlier in code", async () => {
  const { dir } = await fixture(onTestFinished, {
    "slides/03-x.mdx": "```\nOld text.\n```\n\nOld text.\n",
  });
  const result = hook(dir, {
    tool_name: "apply_patch",
    tool_input: {
      command:
        "*** Begin Patch\n*** Update File: slides/03-x.mdx\n@@\n-Old text.\n+It's not just a chart, it's a story.\n*** End of File\n*** End Patch",
    },
  });
  expect(result.status, result.stderr).toBe(0);
  expect(result.reason).toContain("slides/03-x.mdx:5:1  error  not-just-reveal");
});

it.each(["Clean prose.", "At its core, tides."])(
  "replays an insertion-only Codex update: %s",
  async (text) => {
    const { dir } = await fixture(onTestFinished, { "slides/03-x.mdx": "# Head.\n" });
    const result = hook(dir, {
      tool_name: "apply_patch",
      tool_input: {
        command: `*** Begin Patch\n*** Update File: slides/03-x.mdx\n@@\n+${text}\n*** End Patch`,
      },
    });
    expect(result.status, result.stderr).toBe(0);
    expect(Boolean(result.reason)).toBe(text.startsWith("At its core"));
  },
);
