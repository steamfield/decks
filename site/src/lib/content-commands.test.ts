// @vitest-environment node
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { site } from "../config";
import { loadProjectFiles, setupCommands } from "../data/project";
import { commandUsage, subcommands, toolFlags } from "./cli-content.test-support";

const repo = join(process.cwd(), "..");
const read = (path: string) => readFileSync(join(repo, path), "utf8");
const guide = read("docs/guide/getting-started.md");
const pkg = JSON.parse(read("packages/decks/package.json"));
const splitCommands = (text: string) =>
  text
    .split(/\n|&&/)
    .map((line) => line.trim())
    .filter(Boolean);
// Recorded transcripts below retain the historical runner and package pin.
const deckInvocation = /^(?:(bunx|npx|pnpm exec)( -p \S+)? )?(decks)\s*(.*)$/;
const contentFiles = readdirSync(join(repo, "docs/guide"))
  .filter((file) => file.endsWith(".md"))
  .map((file) => ({ file, text: read(`docs/guide/${file}`) }));
// Blog posts are historical articles, each with a migration note. Their old commands
// are deliberately excluded by collection, as are recorded transcript commands.
const docsCommands = contentFiles.flatMap(({ file, text }) => [
  ...[...text.matchAll(/```(?:bash|sh)[^\n]*\n([\s\S]*?)```/g)].flatMap((match) =>
    splitCommands(match[1] ?? "").map((line) => ({ file, line: line.replace(/\s+#.*$/, "") })),
  ),
  ...[...text.matchAll(/^#{2,3} `(decks [^`]+)`/gm)].map((match) => ({
    file,
    line: match[1] ?? "",
  })),
]);
const shown = [
  ...site.quickstart.map((line) => ({ file: "config: hero", line })),
  ...site.install.flatMap((option) =>
    splitCommands(option.command).map((line) => ({ file: `config: ${option.label}`, line })),
  ),
  { file: "config: what you get", line: site.devCommand },
  ...setupCommands.map((line) => ({ file: "page: what you get", line })),
  ...docsCommands.filter(
    ({ line }) => deckInvocation.test(line) || /^(bun add|npm i|npm install|pnpm add) /.test(line),
  ),
];

function expectCommand(line: string, requirePin: boolean) {
  const [, runner, pin, bin = "", rest = ""] = deckInvocation.exec(line) ?? [];
  expect(Object.keys(pkg.bin)).toContain(bin);
  if (requirePin && runner !== "pnpm exec") expect(pin).toBe(" -p @steamfield/decks");
  else if (pin) expect(pin).toBe(" -p @steamfield/decks");
  const [subcommand = ""] = rest.split(/\s+/);
  expect(subcommands).toContain(subcommand);
  const flags =
    subcommand === "dev" || subcommand === "build"
      ? new Set(commandUsage(subcommand).match(/--[a-z][\w-]*/g))
      : toolFlags(subcommand);
  for (const flag of rest.match(/--[a-z][\w-]*/g) ?? []) expect(flags).toContain(flag);
}

describe("every current command matches the CLI", () => {
  it("checks the guide, hero, every install tab and the setup file tree", () => {
    const files = new Set(shown.map((command) => command.file));
    for (const file of [
      "getting-started.md",
      "config: hero",
      "config: bun",
      "config: npm",
      "config: pnpm",
      "config: stacks",
      "page: what you get",
    ])
      expect(files).toContain(file);
    expect(
      shown.filter(({ file }) => file === "cli.md").map(({ line }) => line.split(" ")[1]),
    ).toEqual(["new", "check", "lint", "hook", "export", "shot", "init"]);
  });

  it.each(shown.filter(({ line }) => deckInvocation.test(line)))(
    "$file: $line",
    ({ file, line }) => {
      expectCommand(line, file.startsWith("config:") || file.startsWith("page:"));
    },
  );

  it.each([
    "npx decks new talk",
    "bunx decks new talk",
    "bunx -p @steamfield/decks decks build talk --port 3030",
    "bunx -p @steamfield/decks decks dev talk --base /talk/",
    "bunx -p @steamfield/decks decks new talk --brand Acme",
    "bunx -p @steamfield/decks decks snap talk",
  ])("rejects invalid current command %s", (line) => {
    expect(() => expectCommand(line, true)).toThrow();
  });

  it("installs the package and React peers from every package-manager tab", () => {
    const managers = site.install.filter((option) => option.label !== "stacks");
    expect(managers.map((option) => option.label)).toEqual(["bun", "npm", "pnpm"]);
    for (const option of managers) {
      expect(splitCommands(option.command)[0]?.split(/\s+/).slice(2)).toEqual([
        pkg.name,
        "react",
        "react-dom",
      ]);
      expect(option.command).toContain("claude plugin install decks@steamfield --scope project");
    }
    for (const name of [pkg.name, "react", "react-dom"]) expect(guide).toContain(name);
  });

  it("offers one stacks line that scaffolds the deck the dev command serves", () => {
    const stacks = site.install.filter((option) => option.label === "stacks");
    expect(stacks.map((option) => option.command)).toEqual([
      "npx @steamfield/stacks@latest new decks my-talk",
    ]);
    // The decks stack registers the first deck under the project name.
    expect(site.devCommand.split(" ").at(-1)).toBe("my-talk");
  });

  it("uses the plugin and marketplace's current agent setup", () => {
    expect(read("plugins/decks/README.md")).toContain(
      "claude plugin install decks@steamfield --scope project",
    );
    expect(read(".claude-plugin/marketplace.json")).toContain('"name": "steamfield"');
    expect(site.quickstart).toContain("bunx -p @steamfield/decks decks init");
  });

  it("labels retained blog articles as historical and points readers at current docs", () => {
    for (const file of readdirSync("src/content/blog")) {
      const text = readFileSync(join("src/content/blog", file), "utf8");
      expect(text, file).toContain("Decks has moved to its own React framework");
      expect(text, file).toContain("[current documentation](/docs/)");
    }
  });
});

describe("copy matches the repository", () => {
  it("shows the package's version, name, runtime and React requirements", () => {
    expect(site.version).toBe(pkg.version);
    expect(site.packageName).toBe(pkg.name);
    expect(pkg.engines.node).toBe(">=22.12.0");
    expect(pkg.peerDependencies.react).toMatch(/^\^19\./);
    const requirements = site.requirements.map((row) => row.text).join(" ");
    expect(requirements).toContain("Node 22.12+");
    expect(requirements).toContain("React 19");
    expect(requirements).toContain(`OpenChart ${pkg.dependencies["@opendata-ai/openchart-core"]}`);
  });

  it("notes only files decks init and decks new really write", () => {
    const files = loadProjectFiles();
    for (const path of Object.keys(site.files)) expect(files, path).toContain(path);
  });
});
