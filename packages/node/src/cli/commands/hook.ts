import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { parseArgs } from "node:util";
import { defineCommand } from "citty";
import { z } from "zod";
import { loadDeck } from "../../dev/config";
import { DeckError } from "../../dev/errors";
import { loadPatterns } from "../../prose/prose-patterns";
import type { ProseHit } from "../../prose/prose-scan";
import { patchWrites, replay, type WriteCall } from "./hook-edit";

const payloadSchema = z.object({
  tool_name: z.string().optional(),
  tool_input: z.unknown().optional(),
  prompt: z.string().optional(),
  cwd: z.string().optional(),
});
const editSchema = z.object({
  old_string: z.string(),
  new_string: z.string(),
  replace_all: z.boolean().optional(),
});

function inScope(file: string, project: string) {
  const absolute = resolve(project, file);
  const rel = relative(project, absolute).split(sep).join("/");
  if (rel.startsWith("../") || isAbsolute(rel) || rel.split("/").includes("node_modules"))
    return false;
  for (let dir = dirname(absolute); ; dir = dirname(dir)) {
    if (existsSync(resolve(dir, "deck.config.ts"))) {
      return /^(slides\/.+\.mdx|(components|layers)\/.+\.tsx?)$/.test(
        relative(dir, absolute).split(sep).join("/"),
      )
        ? dir
        : undefined;
    }
    if (dirname(dir) === dir) return undefined;
  }
}

function emit(hookSpecificOutput: object) {
  writeSync(1, `${JSON.stringify({ hookSpecificOutput })}\n`);
}

async function lintPayload(payload: z.infer<typeof payloadSchema>, project: string) {
  const tool = payload.tool_name;
  let calls: WriteCall[];
  if (tool === "apply_patch") {
    const input = z.object({ command: z.string() }).parse(payload.tool_input);
    calls = patchWrites(input.command);
  } else if (tool === "Write") {
    const input = z
      .object({ file_path: z.string(), content: z.string() })
      .parse(payload.tool_input);
    calls = [{ toolName: tool, file: input.file_path, content: input.content, edits: [] }];
  } else if (tool === "Edit" || tool === "MultiEdit") {
    const input = z.object({ file_path: z.string() }).parse(payload.tool_input);
    const edits =
      tool === "Edit"
        ? [editSchema.parse(payload.tool_input)]
        : z.object({ edits: z.array(editSchema) }).parse(payload.tool_input).edits;
    calls = [{ toolName: tool, file: input.file_path, edits }];
  } else return;
  let patterns: ReturnType<typeof loadPatterns> | undefined;
  const found: string[] = [];
  for (const call of calls) {
    const deckDir = inScope(call.file, project);
    if (!deckDir || (call.toolName === "Write" && !call.content)) continue;
    const deck = await loadDeck(deckDir);
    const { scanSource, formatHit } = await import("../../prose/prose-scan");
    patterns ??= loadPatterns();
    const absolute = resolve(project, call.file);
    const after = replay(call, resolve(project, call.source ?? call.file));
    const path = relative(project, absolute).split(sep).join("/");
    const scan = (src: string) =>
      scanSource(absolute, src, patterns ?? [], {
        errorsOnly: true,
        remarkPlugins: deck.config.mdx?.remarkPlugins,
      });
    const afterHits = scan(after.src);
    let oldHits: ProseHit[] = [];
    try {
      oldHits = after.before === undefined ? [] : scan(after.before);
    } catch (cause) {
      // A repair can make invalid source parseable. With no valid baseline, every hit is new.
      if (!(cause instanceof DeckError)) throw cause;
    }
    const seen = new Map<string, number>();
    const key = (hit: ProseHit) => `${hit.id}\0${hit.text}`;
    for (const hit of oldHits) seen.set(key(hit), (seen.get(key(hit)) ?? 0) + 1);
    const hits = afterHits.filter((hit) => {
      if (after.before === undefined || after.touched?.has(hit.line)) return true;
      const count = seen.get(key(hit)) ?? 0;
      if (count) seen.set(key(hit), count - 1);
      return !count;
    });
    const label = call.toolName === "Write" && tool !== "apply_patch" ? "stdin" : path;
    if (hits.length)
      found.push(
        `${hits.map((hit) => formatHit({ ...hit, file: label })).join("\n")}\n\n${call.toolName === "Write" ? `Line numbers refer to the NEW text being written${tool === "apply_patch" ? ` to ${path}` : ""}.` : `Line numbers refer to ${path} as it will read after this edit.`}`,
      );
  }
  if (found.length)
    emit({
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `BLOCKED: AI-rhetoric patterns found in prose.\n\n${found.join("\n\n")} Rewrite the flagged\nphrasing (don't synonym-swap). A rewrite that keeps the same sentence\nskeleton with new words still reads as AI; change the structure, or\njust state the fact plainly. If a hit is a legitimate direct quote,\nappend the lint-allow marker to that exact line:\n  mdx/tsx: {/* lint-allow: pattern-id */}\n  ts: // lint-allow: pattern-id`,
    });
}

const intent =
  /\b(write|writ|draft|revis|edit|polish|build|author|make).{0,60}(\bdeck\b|\bslides?\b|\btalk\b|\bpresentation\b|\bmdx\b)|(\bdeck\b|\bslides?\b|\btalk\b|\bpresentation\b|\bmdx\b).{0,60}\b(write|writ|draft|revis|edit|polish|build|author|make)/i;
const revision =
  /\b(rewrite|reword|rephras|revis|trim|tighten|shorten|cut|polish|slop|headline|bullet|eyebrow|wording|phrasing|too (long|wordy|dense))/i;

function promptPayload(payload: z.infer<typeof payloadSchema>, project: string) {
  if (!payload.prompt) return;
  let fires = intent.test(payload.prompt);
  if (!fires && revision.test(payload.prompt)) {
    const status = spawnSync("git", ["status", "--porcelain", "--untracked-files=all", "-z"], {
      cwd: project,
      encoding: "utf8",
    });
    if (status.error)
      throw new Error(`decks hook prompt cannot run git: ${status.error.message}`, {
        cause: status.error,
      });
    const top = spawnSync("git", ["rev-parse", "--show-toplevel"], {
      cwd: project,
      encoding: "utf8",
    });
    if (top.error) throw top.error;
    fires =
      status.status === 0 &&
      top.status === 0 &&
      status.stdout
        .split("\0")
        .some((entry) => entry && inScope(entry.slice(3), top.stdout.trim()));
  }
  if (fires)
    emit({
      hookEventName: "UserPromptSubmit",
      additionalContext: readFileSync(
        new URL(
          `${import.meta.url.endsWith(".ts") ? "../../../lint/" : "./lint/"}deck-writing-reminder.md`,
          import.meta.url,
        ),
        "utf8",
      ).trimEnd(),
    });
}

export const hook = defineCommand({
  meta: {
    name: "decks hook",
    description: "Agent hooks: lint (PreToolUse) or prompt (UserPromptSubmit)",
  },
  args: {
    kind: { type: "positional", required: true, description: "lint or prompt" },
  },
  async run({ args, rawArgs }) {
    try {
      const parsed = parseArgs({ args: rawArgs, options: {}, allowPositionals: true });
      if (parsed.positionals.length > 1)
        throw new Error(
          `unexpected argument ${JSON.stringify(parsed.positionals[1])}. Pass lint or prompt.`,
        );
    } catch (cause) {
      throw new DeckError(cause instanceof Error ? cause.message : String(cause));
    }
    if (args.kind !== "lint" && args.kind !== "prompt")
      throw new DeckError(
        "Usage: decks hook {lint|prompt}   (reads the Claude Code hook payload on stdin)",
      );
    let source = "";
    process.stdin.setEncoding("utf8");
    for await (const chunk of process.stdin) source += chunk;
    let payload: z.infer<typeof payloadSchema>;
    try {
      payload = payloadSchema.parse(JSON.parse(source));
    } catch (cause) {
      if (args.kind === "prompt") return;
      writeSync(
        2,
        `BLOCKED: decks hook lint could not parse the hook payload on stdin (${cause instanceof Error ? cause.message : String(cause)}), so the write is refused.\n`,
      );
      process.exitCode = 2;
      return;
    }
    const project = resolve(process.env.CLAUDE_PROJECT_DIR || payload.cwd || process.cwd());
    if (args.kind === "prompt") return promptPayload(payload, project);
    try {
      await lintPayload(payload, project);
    } catch (cause) {
      writeSync(
        2,
        `BLOCKED: decks hook lint failed (${cause instanceof Error ? cause.message : String(cause)}), so the write is refused. Restore the scanner and lint/ai-rhetoric-patterns.tsv, or check the edit and file syntax.\n`,
      );
      process.exitCode = 2;
    }
  },
});
