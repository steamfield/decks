// Builds fixtures/smoke-1.json, the static transcript excerpt on the landing page,
// from a Claude Code stream-json log (`claude -p ... --output-format stream-json`).
//
//   node scripts/excerpt-smoke.mjs <path/to/smoke-1.jsonl>
//
// It keeps the calls a reader needs to follow the run (skill, scaffold, rules,
// sources, data and stage files, check, test, lint, build) with their first
// output line, and the run's own turn count, duration and cost. Nothing is typed
// by hand: re-run it on the log to regenerate the fixture.
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const [path] = process.argv.slice(2);
if (!path) {
  console.error("usage: node scripts/excerpt-smoke.mjs <smoke-1.jsonl>");
  process.exit(2);
}

const events = readFileSync(path, "utf8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const results = new Map();
for (const event of events) {
  if (event.type !== "user" || !Array.isArray(event.message?.content)) continue;
  for (const part of event.message.content) {
    if (part.type !== "tool_result") continue;
    const text = Array.isArray(part.content)
      ? part.content.map((c) => c.text ?? "").join("\n")
      : String(part.content ?? "");
    results.set(part.tool_use_id, text);
  }
}

const calls = events
  .filter((event) => event.type === "assistant")
  .flatMap((event) => event.message.content.filter((part) => part.type === "tool_use"))
  .map((call) => ({ ...call, output: results.get(call.id) ?? "" }));

const firstLine = (text, pattern) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => (pattern ? pattern.test(line) : line.length > 0)) ?? "";
const short = (file) => file.replace(/^.*\/Projects\/decks\//, "");

/** Each step: which call it is, how it reads, and which output line to keep. */
const steps = [
  {
    find: (c) => c.name === "Skill",
    label: (c) => `Skill(${c.input.skill})`,
    note: "Loads the repo's deck-building workflow.",
    out: (c) => firstLine(c.output),
  },
  {
    find: (c) =>
      c.name === "Bash" &&
      c.input.command === "bun run new tides ocean-tides --story 2>&1 | tail -20",
    label: () => "Bash(bun run new tides ocean-tides --story)",
    note: "Scaffolds a story deck and registers it.",
    out: (c) => firstLine(c.output, /^Scaffolded/),
  },
  {
    find: (c) => c.name === "Read" && /\.claude\/rules\//.test(c.input.file_path),
    all: true,
    label: (c) => `Read(${short(c.input.file_path)})`,
    note: "Reads the writing, stage and data rules before drafting.",
  },
  {
    find: (c) => c.name === "Bash" && /tidesandcurrents\.noaa\.gov\/api/.test(c.input.command),
    label: () => "Bash(curl api.tidesandcurrents.noaa.gov ... station=8443970)",
    note: "NOAA tide predictions for Boston.",
  },
  {
    find: (c) => c.name === "Bash" && /aa\.usno\.navy\.mil/.test(c.input.command),
    label: () => "Bash(curl aa.usno.navy.mil/api/moon/phases ...)",
    note: "US Naval Observatory moon phase dates.",
  },
  {
    find: (c) => c.name === "Bash" && /nssdc\.gsfc\.nasa\.gov/.test(c.input.command),
    label: () => "Bash(curl nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html)",
    note: "NASA fact-sheet constants.",
  },
  {
    find: (c) => c.name === "Write" && /\/data\/[\w-]+\.ts$/.test(c.input.file_path),
    all: true,
    label: (c) => `Write(${short(c.input.file_path)})`,
    note: "One data module per slide, each figure with its source.",
  },
  {
    find: (c) => c.name === "Write" && /\/components\/\w+Stage\.vue$/.test(c.input.file_path),
    all: true,
    label: (c) => `Write(${short(c.input.file_path)})`,
    note: "One stage component per story slide.",
  },
  {
    find: (c) => c.name === "Bash" && /^cd \S+ && bun run check/.test(c.input.command),
    label: () => "Bash(bun run check)",
    out: (c) => firstLine(c.output, /All page files/),
  },
  {
    find: (c) => c.name === "Bash" && c.input.command === "bun run test 2>&1 | tail -40",
    label: () => "Bash(bun run test)",
    out: (c) => firstLine(c.output, /Tests\s+\d+ passed/),
  },
  {
    find: (c) => c.name === "Bash" && c.input.command === "bun run lint 2>&1 | tail -20",
    label: () => "Bash(bun run lint)",
    note: "The prose lint prints only its own command line: no findings.",
    out: (c) => firstLine(c.output, /content-lint/),
  },
  {
    find: (c) => c.name === "Bash" && /^bun run build tides/.test(c.input.command),
    label: () => "Bash(bun run build tides)",
    out: (c) => firstLine(c.output, /built in/),
  },
];

const excerpt = [];
for (const step of steps) {
  const found = step.all ? calls.filter(step.find) : calls.filter(step.find).slice(0, 1);
  if (found.length === 0) throw new Error(`no call matches the step "${step.note ?? step.label}"`);
  excerpt.push({
    calls: found.map((call) => step.label(call)),
    note: step.note ?? "",
    output: step.out ? step.out(found[0]) : "",
  });
}

const result = events.find((event) => event.type === "result");
if (!result || result.is_error) throw new Error("the log has no successful result event");
const fixture = {
  source: basename(path),
  session: result.session_id,
  prompt: "make a 5-slide story deck about how ocean tides work",
  turns: result.num_turns,
  durationMs: result.duration_ms,
  costUsd: result.total_cost_usd,
  toolCalls: calls.length,
  steps: excerpt,
};
writeFileSync(
  new URL("../fixtures/smoke-1.json", import.meta.url),
  `${JSON.stringify(fixture, null, 2)}\n`,
);
console.log(`wrote fixtures/smoke-1.json: ${excerpt.length} steps from ${calls.length} calls`);
