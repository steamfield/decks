import { isUtf8 } from "node:buffer";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { lstat, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { parseArgs } from "node:util";
import { defineCommand } from "citty";
import { glob } from "tinyglobby";
import { z } from "zod";
import { DeckError } from "../../dev/errors";

const start = "<!-- decks:start -->";
const end = "<!-- decks:end -->";
const skillNames = [
  "building-a-deck",
  "writing-slides",
  "deck-design",
  "deck-motion",
  "visualization",
  "deck-data",
  "working-with-decks",
];
const block = `${start}\n## Decks\n\nRead \`node_modules/@steamfield/decks/docs/\` for the installed version first.\nUse these skills in \`.agents/skills/\` when working on a deck:\n\n${skillNames.map((name) => `- \`${name}\``).join("\n")}\n${end}`;
function hash(content: string | Buffer) {
  const bytes = typeof content === "string" ? Buffer.from(content) : content;
  return createHash("sha256")
    .update(isUtf8(bytes) ? bytes.toString("utf8").replaceAll("\r\n", "\n") : bytes)
    .digest("hex");
}

async function assertTarget(target: string) {
  let path = process.cwd();
  for (const part of target.split("/")) {
    path = join(path, part);
    try {
      if ((await lstat(path)).isSymbolicLink())
        throw new DeckError(
          `Cannot write ${target}: symlink at ${path}. Use a regular destination.`,
        );
    } catch (cause) {
      if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return;
      throw cause;
    }
  }
}

async function readObject(file: string): Promise<Record<string, unknown>> {
  if (!existsSync(file)) return {};
  try {
    return z.record(z.string(), z.unknown()).parse(JSON.parse(await readFile(file, "utf8")));
  } catch (cause) {
    throw new DeckError(
      `Cannot read ${file}: ${cause instanceof Error ? cause.message : String(cause)}`,
      undefined,
      undefined,
      { cause },
    );
  }
}

export const init = defineCommand({
  meta: { name: "decks init", description: "Set up agent guidance for Decks in this project" },
  args: {
    force: {
      type: "boolean",
      default: false,
      description: "Replace edits to guidance init installed",
    },
  },
  async run({ args, rawArgs }) {
    try {
      const parsed = parseArgs({ args: rawArgs, options: { force: { type: "boolean" } } });
      if (parsed.positionals.length) throw new DeckError("decks init takes only --force.");
      const source = import.meta.url.endsWith(".ts");
      const skills = new URL(
        source ? "../../../../../plugins/decks/skills/" : "./plugin/skills/",
        import.meta.url,
      );
      const metadata = new URL(
        source ? "../../../../decks/package.json" : "../package.json",
        import.meta.url,
      );
      const { version } = z
        .object({ version: z.string() })
        .parse(JSON.parse(await readFile(metadata, "utf8")));
      const settingsPath = ".claude/settings.json";
      const manifestPath = ".agents/skills/.decks-init.json";
      const settings = await readObject(settingsPath);
      const marketplace = z
        .record(z.string(), z.unknown())
        .parse(settings.extraKnownMarketplaces ?? {});
      const enabled = z.record(z.string(), z.unknown()).parse(settings.enabledPlugins ?? {});
      const previousRef = z
        .object({ source: z.object({ ref: z.string() }) })
        .safeParse(marketplace.steamfield).data?.source.ref;
      const manifest = await readObject(manifestPath);
      const owned = Object.fromEntries(
        Object.entries(z.record(z.string(), z.string()).parse(manifest.files ?? {})).map(
          ([key, value]) => [key.replaceAll("\\", "/"), value],
        ),
      );
      const agents = existsSync("AGENTS.md") ? await readFile("AGENTS.md", "utf8") : "";
      const from = agents.indexOf(start);
      const to = agents.indexOf(end);
      if (
        from < 0 !== to < 0 ||
        (from >= 0 &&
          (to < from ||
            agents.indexOf(start, from + start.length) >= 0 ||
            agents.indexOf(end, to + end.length) >= 0))
      )
        throw new DeckError(
          "AGENTS.md has incomplete or repeated Decks markers. Repair them before running init.",
        );
      const currentBlock = from < 0 ? undefined : agents.slice(from, to + end.length);
      const files = await glob("**/*", { cwd: skills, dot: true, ignore: ["**/.gitkeep"] });
      const updates = await Promise.all(
        files.sort().map(async (file) => ({
          target: `.agents/skills/${file}`,
          content: await readFile(new URL(file, skills)),
        })),
      );
      const current = new Set(updates.map(({ target }) => target));
      const obsolete = Object.keys(owned).filter(
        (target) =>
          target.startsWith(".agents/skills/") &&
          !target.split("/").includes("..") &&
          !current.has(target),
      );
      const currentSkills = new Set(
        [...current].map((target) => target.split("/").slice(0, 3).join("/")),
      );
      const retiredSkills = new Set(
        obsolete
          .map((target) => target.split("/").slice(0, 3).join("/"))
          .filter((skill) => !currentSkills.has(skill)),
      );
      for (const target of [
        settingsPath,
        manifestPath,
        "AGENTS.md",
        ...updates.map(({ target }) => target),
        ...obsolete,
      ])
        await assertTarget(target);
      for (const skill of retiredSkills) {
        if (existsSync(skill)) {
          let keep = false;
          for (const file of await glob("**/*", {
            cwd: skill,
            dot: true,
            onlyFiles: false,
            followSymbolicLinks: false,
          })) {
            const target = `${skill}/${file}`;
            if ((await lstat(target)).isDirectory()) continue;
            if (!owned[target] || hash(await readFile(target)) !== owned[target]) {
              keep = true;
              break;
            }
          }
          if (keep) {
            console.log(`Kept ${skill}: contains edited or unowned files`);
            continue;
          }
          await rm(skill, { recursive: true });
          console.log(`Removed ${skill}`);
        }
        for (const target of obsolete) if (target.startsWith(`${skill}/`)) delete owned[target];
      }
      for (const target of obsolete) {
        if ([...retiredSkills].some((skill) => target.startsWith(`${skill}/`))) continue;
        if (existsSync(target)) {
          if (hash(await readFile(target)) !== owned[target]) {
            console.log(`Kept ${target}: edited since last init`);
            continue;
          }
          await rm(target);
          console.log(`Removed ${target}`);
        }
        delete owned[target];
      }
      for (const { target, content } of updates) {
        const current = existsSync(target) ? await readFile(target) : undefined;
        if (
          current !== undefined &&
          !current.equals(content) &&
          (!owned[target] || (!args.force && hash(current) !== owned[target]))
        ) {
          console.log(
            `Kept ${target}: ${owned[target] ? "edited since last init" : "not installed by init"}`,
          );
          continue;
        }
        await mkdir(dirname(target), { recursive: true });
        await writeFile(target, content);
        owned[target] = hash(content);
        console.log(`Wrote ${target}`);
      }
      if (
        currentBlock !== undefined &&
        currentBlock !== block &&
        (!owned["AGENTS.md"] || (!args.force && hash(currentBlock) !== owned["AGENTS.md"]))
      ) {
        console.log(
          `Kept AGENTS.md Decks section: ${owned["AGENTS.md"] ? "edited since last init" : "not installed by init"}`,
        );
      } else {
        const text =
          from < 0
            ? `${agents}${agents && !agents.endsWith("\n") ? "\n" : ""}${agents ? "\n" : ""}${block}\n`
            : `${agents.slice(0, from)}${block}${agents.slice(to + end.length)}`;
        await writeFile("AGENTS.md", text);
        owned["AGENTS.md"] = hash(block);
        console.log("Wrote AGENTS.md Decks section");
      }
      settings.extraKnownMarketplaces = {
        ...marketplace,
        steamfield: { source: { source: "github", repo: "steamfield/decks", ref: `v${version}` } },
      };
      settings.enabledPlugins = { ...enabled, "decks@steamfield": true };
      await mkdir(".claude", { recursive: true });
      await writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
      console.log(`Wrote ${settingsPath}`);
      await mkdir(dirname(manifestPath), { recursive: true });
      await writeFile(manifestPath, `${JSON.stringify({ files: owned }, null, 2)}\n`);
      console.log(`Wrote ${manifestPath}`);
      if (previousRef !== undefined && previousRef !== `v${version}`)
        console.log(
          "Update the plugin: claude plugin update decks@steamfield --scope project (then restart Claude Code).",
        );
      console.log(
        "Each collaborator runs once: claude plugin install decks@steamfield --scope project",
      );
    } catch (cause) {
      if (cause instanceof DeckError) throw cause;
      throw new DeckError(
        `Cannot initialize Decks: ${cause instanceof Error ? cause.message : String(cause)}`,
        undefined,
        undefined,
        { cause },
      );
    }
  },
});
