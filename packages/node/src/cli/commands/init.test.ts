import { spawnSync } from "node:child_process";
import { mkdir, readdir, readFile, rm, symlink } from "node:fs/promises";
import { dirname, join } from "node:path";
import { expect, inject, it } from "vitest";
import { repoPath } from "../../dev/server.test-support";
import { installedInit, pluginProject } from "./plugin.test-support";

const packageDir = inject("builtPackage");

const installLine =
  "Each collaborator runs once: claude plugin install decks@steamfield --scope project";
const skill = ".agents/skills/building-a-deck/SKILL.md";
const shipped = "installed-decks/dist/plugin/skills/building-a-deck/SKILL.md";
const read = (dir: string, file: string) => readFile(join(dir, file), "utf8");

it("merges project settings, copies skills and appends guidance without changing surrounding text", async () => {
  const { dir, put } = await pluginProject(packageDir);
  const previous = {
    hooks: {
      PreToolUse: [{ matcher: "Write", hooks: [{ type: "command", command: "my-check" }] }],
    },
    permissions: { allow: ["Read"] },
    extraKnownMarketplaces: { mine: { source: { source: "github", repo: "me/tools" } } },
    enabledPlugins: { "mine@mine": true },
  };
  await put(".claude/settings.json", JSON.stringify(previous));
  await put("AGENTS.md", "# Project\n\nKeep this guidance.\n");
  await put(shipped, "# Build a deck\n");
  await put("installed-decks/dist/plugin/skills/building-a-deck/references/setup.md", "Setup\n");
  const result = installedInit(dir);
  expect(result.status, result.stderr).toBe(0);
  const { version } = JSON.parse(await read(dir, "installed-decks/package.json"));
  expect(JSON.parse(await read(dir, ".claude/settings.json"))).toEqual({
    ...previous,
    extraKnownMarketplaces: {
      ...previous.extraKnownMarketplaces,
      steamfield: { source: { source: "github", repo: "steamfield/decks", ref: `v${version}` } },
    },
    enabledPlugins: { ...previous.enabledPlugins, "decks@steamfield": true },
  });
  expect(await read(dir, skill)).toBe("# Build a deck\n");
  expect(await read(dir, ".agents/skills/building-a-deck/references/setup.md")).toBe("Setup\n");
  const agents = await read(dir, "AGENTS.md");
  expect(agents).toMatch(/^# Project\n\nKeep this guidance.\n\n<!-- decks:start -->/);
  expect(agents).toContain("node_modules/@steamfield/decks/docs/");
  for (const name of [
    "building-a-deck",
    "writing-slides",
    "deck-design",
    "deck-motion",
    "visualization",
    "deck-data",
    "working-with-decks",
  ])
    expect(agents).toContain(`\`${name}\``);
  expect(result.stdout.trimEnd().split("\n").at(-1)).toBe(installLine);
  expect(result.stdout).toContain(`Wrote ${skill}`);
});

it("updates the version and unedited skills while preserving edited skills and section across reruns", async () => {
  // Far from any real release, so the "upgrade" stays one however the package is versioned.
  const upgradedVersion = "99.0.0";
  const { dir, put } = await pluginProject(packageDir);
  await put(shipped, "Original skill\n");
  await put("installed-decks/dist/plugin/skills/deck-data/SKILL.md", "Original data\n");
  expect(installedInit(dir).status).toBe(0);
  await put(skill, "My skill\n");
  const agents = (await read(dir, "AGENTS.md")).replace("## Decks", "## Decks\n\nMy rule.");
  await put("AGENTS.md", `Before\n${agents}After\n`);
  const metadata = JSON.parse(await read(dir, "installed-decks/package.json"));
  await put(
    "installed-decks/package.json",
    JSON.stringify({ ...metadata, version: upgradedVersion }),
  );
  await put(shipped, "Upgraded skill\n");
  await put("installed-decks/dist/plugin/skills/deck-data/SKILL.md", "Upgraded data\n");
  for (let run = 0; run < 2; run++) {
    const result = installedInit(dir);
    expect(result.status, result.stderr).toBe(0);
    expect(await read(dir, skill)).toBe("My skill\n");
    expect(await read(dir, ".agents/skills/deck-data/SKILL.md")).toBe("Upgraded data\n");
    expect(await read(dir, "AGENTS.md")).toBe(`Before\n${agents}After\n`);
    expect(result.stdout).toContain(`Kept ${skill}: edited since last init`);
    expect(result.stdout).toContain("Kept AGENTS.md Decks section: edited since last init");
    if (run === 0)
      expect(result.stdout).toContain("claude plugin update decks@steamfield --scope project");
  }
  expect(
    JSON.parse(await read(dir, ".claude/settings.json")).extraKnownMarketplaces.steamfield.source
      .ref,
  ).toBe(`v${upgradedVersion}`);
  const forced = installedInit(dir, ["--force"]);
  expect(forced.status, forced.stderr).toBe(0);
  expect(await read(dir, skill)).toBe("Upgraded skill\n");
  expect(await read(dir, "AGENTS.md")).not.toContain("My rule.");
  expect(await read(dir, "AGENTS.md")).toMatch(/^Before\n[\s\S]+After\n$/);
});

it("ships source skills through the package build and copies binary references unchanged", async () => {
  const { dir } = await pluginProject(packageDir);
  const result = installedInit(dir);
  expect(result.status, result.stderr).toBe(0);
  expect(await read(dir, ".agents/skills/init-fixture/SKILL.md")).toBe("# Packaged fixture\n");
  expect(await readFile(join(dir, ".agents/skills/init-fixture/references/image.png"))).toEqual(
    Buffer.from([137, 80, 78, 71, 255, 0]),
  );
});

it.each([false, true])(
  "removes obsolete unedited skills and preserves edited ones (force: %s)",
  async (force) => {
    const { dir, put } = await pluginProject(packageDir);
    const obsolete = ".agents/skills/old-name/SKILL.md";
    const edited = ".agents/skills/old-edited/SKILL.md";
    const missing = ".agents/skills/old-missing/SKILL.md";
    const names = ["old-name", "old-edited", "old-missing", "old-user"];
    for (const name of names)
      await put(`installed-decks/dist/plugin/skills/${name}/SKILL.md`, "Original skill\n");
    await put("installed-decks/dist/plugin/skills/old-edited/references/setup.md", "Setup\n");
    expect(installedInit(dir).status).toBe(0);
    await put(edited, "My obsolete skill\n");
    await put(".agents/skills/old-user/my-reference.md", "My reference\n");
    await rm(join(dir, missing));
    for (const name of names)
      await rm(join(dir, `installed-decks/dist/plugin/skills/${name}`), { recursive: true });
    const result = installedInit(dir, force ? ["--force"] : []);
    expect(result.status, result.stderr).toBe(0);
    await expect(read(dir, obsolete)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readdir(join(dir, ".agents/skills/old-name"))).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(await read(dir, edited)).toBe("My obsolete skill\n");
    expect(await read(dir, ".agents/skills/old-edited/references/setup.md")).toBe("Setup\n");
    expect(await read(dir, ".agents/skills/old-user/SKILL.md")).toBe("Original skill\n");
    expect(await read(dir, ".agents/skills/old-user/my-reference.md")).toBe("My reference\n");
    expect(result.stdout).toContain("Kept .agents/skills/old-edited:");
    expect(result.stdout).toContain("Kept .agents/skills/old-user:");
    const manifest = JSON.parse(await read(dir, ".agents/skills/.decks-init.json"));
    expect(manifest.files).not.toHaveProperty(obsolete);
    expect(manifest.files).not.toHaveProperty(missing);
    expect(await read(dir, skill)).toBe(await read(dir, shipped));
  },
);

it("removes obsolete references within a shipped skill while keeping edited references", async () => {
  const { dir, put } = await pluginProject(packageDir);
  const original = "building-a-deck/references/retired.md";
  const edited = "building-a-deck/references/edited.md";
  for (const file of [original, edited])
    await put(`installed-decks/dist/plugin/skills/${file}`, "Original reference\n");
  expect(installedInit(dir).status).toBe(0);
  await put(`.agents/skills/${edited}`, "My reference\n");
  for (const file of [original, edited])
    await rm(join(dir, `installed-decks/dist/plugin/skills/${file}`));
  const result = installedInit(dir);
  expect(result.status, result.stderr).toBe(0);
  await expect(read(dir, `.agents/skills/${original}`)).rejects.toMatchObject({ code: "ENOENT" });
  expect(await read(dir, `.agents/skills/${edited}`)).toBe("My reference\n");
  expect(await read(dir, skill)).toBe(await read(dir, shipped));
});

it("updates managed skills and the section after a CRLF checkout without treating it as an edit", async () => {
  const { dir, put } = await pluginProject(packageDir);
  await put(shipped, "Original skill\n");
  expect(installedInit(dir).status).toBe(0);
  await put(skill, "Original skill\r\n");
  await put("AGENTS.md", (await read(dir, "AGENTS.md")).replaceAll("\n", "\r\n"));
  await put(shipped, "Upgraded skill\n");
  const result = installedInit(dir);
  expect(result.status, result.stderr).toBe(0);
  expect(await read(dir, skill)).toBe("Upgraded skill\n");
  expect(result.stdout).not.toContain("Kept AGENTS.md");
});

it("recognizes a Windows ownership record when upgrading on another platform", async () => {
  const { dir, put } = await pluginProject(packageDir);
  await put(shipped, "Original skill\n");
  expect(installedInit(dir).status).toBe(0);
  const manifestPath = ".agents/skills/.decks-init.json";
  const manifest = JSON.parse(await read(dir, manifestPath));
  manifest.files = Object.fromEntries(
    Object.entries(manifest.files).map(([key, value]) => [key.replaceAll("/", "\\"), value]),
  );
  await put(manifestPath, JSON.stringify(manifest));
  await put(shipped, "Upgraded skill\n");
  const result = installedInit(dir);
  expect(result.status, result.stderr).toBe(0);
  expect(await read(dir, skill)).toBe("Upgraded skill\n");
  expect(
    Object.keys(JSON.parse(await read(dir, manifestPath)).files).some((key) => key.includes("\\")),
  ).toBe(false);
});

it.each([
  "AGENTS.md",
  ".claude",
  ".agents",
  ".claude/settings.json",
  ".agents/skills/init-fixture/SKILL.md",
])("rejects symlink destination %s before writing anything", async (target) => {
  const { dir } = await pluginProject(packageDir);
  const external = await pluginProject();
  await external.put("shared.md", "{}");
  const file = target.endsWith(".md") || target.endsWith(".json");
  await mkdir(dirname(join(dir, target)), { recursive: true });
  await symlink(
    file ? join(external.dir, "shared.md") : external.dir,
    join(dir, target),
    file ? "file" : "dir",
  );
  const before = await readdir(external.dir);
  const result = installedInit(dir, ["--force"]);
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("symlink");
  expect(await readdir(external.dir)).toEqual(before);
  expect(await read(external.dir, "shared.md")).toBe("{}");
  expect(result.stdout).not.toContain("Wrote");
});

it("keeps unowned skill and section collisions even with force", async () => {
  const { dir, put } = await pluginProject(packageDir);
  await put(shipped, "Package skill");
  await put(skill, "My existing skill");
  const agents =
    "Before\n<!-- decks:start -->\n## Decks\nMy own section\n<!-- decks:end -->\nAfter";
  await put("AGENTS.md", agents);
  const result = installedInit(dir, ["--force"]);
  expect(result.status, result.stderr).toBe(0);
  expect(await read(dir, skill)).toBe("My existing skill");
  expect(await read(dir, "AGENTS.md")).toBe(agents);
  expect(result.stdout).toContain(`Kept ${skill}: not installed by init`);
});

it.each([
  [".claude/settings.json", "{broken"],
  [".claude/settings.json", '{"enabledPlugins":[]}'],
  [".agents/skills/.decks-init.json", '{"files":{"x":false}}'],
  ["AGENTS.md", "<!-- decks:start -->\nMy rule"],
])("reports invalid %s without changing the project", async (file, contents) => {
  const { dir, put } = await pluginProject(packageDir);
  await put(file, contents);
  const before = await readdir(dir);
  const result = installedInit(dir);
  expect(result.status).toBe(1);
  expect(result.stderr).not.toContain("This is a bug");
  expect(await read(dir, file)).toBe(contents);
  expect(await readdir(dir)).toEqual(before);
});

it("resolves the source package version and plugin skills when running the source CLI", async () => {
  const { dir } = await pluginProject();
  const result = spawnSync(
    repoPath("node_modules/.bin/tsx"),
    [repoPath("packages/node/src/cli/cli.ts"), "init"],
    { cwd: dir, encoding: "utf8" },
  );
  if (result.error) throw result.error;
  expect(result.status, result.stderr).toBe(0);
  const metadata = JSON.parse(await readFile(repoPath("packages/decks/package.json"), "utf8"));
  expect(
    JSON.parse(await read(dir, ".claude/settings.json")).extraKnownMarketplaces.steamfield.source
      .ref,
  ).toBe(`v${metadata.version}`);
});

it.each([["--bogus"], ["extra"]])(
  "rejects arguments %j before writing guidance",
  async (...args) => {
    const { dir } = await pluginProject(packageDir);
    const result = installedInit(dir, args);
    expect(result.status).toBe(1);
    expect(result.stderr).not.toContain("This is a bug");
    expect(await readdir(dir)).not.toContain(".claude");
  },
);
