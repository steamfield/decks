import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import ts from "typescript";
import { CLI } from "../../scripts/scratch-project.mjs";

const repo = join(process.cwd(), "..");
const read = (path: string) => readFileSync(join(repo, path), "utf8");
const usage = new Map<string, string>();
export function commandUsage(command: string): string {
  const cached = usage.get(command);
  if (cached !== undefined) return cached;
  const run = spawnSync(
    process.execPath,
    [
      "--conditions=@steamfield/decks/source",
      "--import",
      createRequire(join(repo, "package.json")).resolve("tsx"),
      CLI,
      ...(command ? [command] : []),
      "--help",
    ],
    { encoding: "utf8" },
  );
  if (run.error) throw run.error;
  if (run.status !== 0)
    throw new Error(`decks ${command} --help failed: ${run.stdout}${run.stderr}`);
  usage.set(command, run.stdout);
  return run.stdout;
}
export const subcommands = new Set(
  /USAGE decks ([\w|-]+)/.exec(commandUsage(""))?.[1]?.split("|") ?? [],
);

// The tools currently have no working --help entry point. Read their declared
// citty args with TypeScript's parser, excluding positional arguments.
export function toolFlags(command: string): Set<string> {
  const flags = new Set<string>();
  const file = `packages/node/src/commands/${command}.ts`;
  const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest);
  const visit = (node: ts.Node) => {
    if (
      ts.isPropertyAssignment(node) &&
      node.name.getText(source) === "args" &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (
          !ts.isPropertyAssignment(property) ||
          !ts.isObjectLiteralExpression(property.initializer)
        )
          continue;
        const type = property.initializer.properties.find(
          (entry) => ts.isPropertyAssignment(entry) && entry.name.getText(source) === "type",
        );
        if (
          type &&
          ts.isPropertyAssignment(type) &&
          ts.isStringLiteral(type.initializer) &&
          ["string", "boolean"].includes(type.initializer.text)
        )
          flags.add(`--${property.name.getText(source)}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return flags;
}
