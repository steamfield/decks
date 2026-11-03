// Builds fixtures/<run>.json, the static transcript excerpt on the landing page,
// from a Claude Code stream-json log (`claude -p ... --output-format stream-json`).
//
//   node scripts/excerpt-run.mjs keeling-1 <path/to/keeling-run.jsonl>   # the hero
//   node scripts/excerpt-run.mjs smoke-1 <path/to/smoke-1.jsonl>         # tides
//
// It keeps the calls a reader needs to follow the run (skill, scaffold, rules,
// sources, data and stage files, check, lint, build) with their first output
// line, and the run's own turn count, duration and cost. The prompt is passed
// with -p, so it isn't in the log: it is recorded per run below. Nothing else is
// typed by hand: re-run it on the log to regenerate the fixture.
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const firstLine = (text, pattern) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => (pattern ? pattern.test(line) : line.length > 0)) ?? "";

/** `cat > data/record.ts <<'EOF'` targets in one Bash call, matching `pattern`. */
const heredocTargets = (command, pattern) =>
  [...command.matchAll(/cat > (\S+) <<'EOF'/g)]
    .map((match) => match[1] ?? "")
    .filter((file) => pattern.test(file));

/**
 * Each step: which call it is, how it reads, and which output line to keep.
 * `label` names one call; `labels` (with `all`) names several from the matched calls.
 */
const RUNS = {
  // The tides deck, drafted with this repository's own agent setup.
  "smoke-1": {
    prompt: "make a 5-slide story deck about how ocean tides work",
    short: (file) => file.replace(/^.*\/Projects\/decks\//, ""),
    steps: (short) => [
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
    ],
  },

  // The Keeling deck, drafted in a fresh project with only bun add and decks init.
  // The agent wrote its files through Bash heredocs, so those are shown as such.
  "keeling-1": {
    prompt: "make a 5-slide story deck about what the Keeling curve shows about atmospheric CO2",
    short: (file) => file.replace(/^.*\/scratchpad\/keeling\//, ""),
    steps: (short) => {
      const decks = "bunx -p slidev-addon-decks decks";
      const checkRound = /^bunx -p slidev-addon-decks decks check 2>&1 \| tail -15;/;
      const recheck = /&& bunx -p slidev-addon-decks decks check 2>&1 \| tail -2 &&/;
      return [
        {
          find: (c) => c.name === "Skill",
          label: (c) => `Skill(${c.input.skill})`,
          note: "Loads the deck-building workflow that decks init installed.",
          out: (c) => firstLine(c.output),
        },
        {
          find: (c) =>
            c.name === "Bash" && /cat \.claude\/rules\/story-stage\.md/.test(c.input.command),
          label: () =>
            "Bash(cat .claude/rules/story-stage.md .claude/rules/deck-data.md .claude/rules/deck-writing.md)",
          note: "Reads the stage, data and writing rules before drafting.",
        },
        {
          find: (c) =>
            c.name === "Bash" && c.input.command.startsWith(`${decks} new keeling --story`),
          label: () => `Bash(${decks} new keeling --story --author "Riley Hilliard")`,
          note: "Scaffolds a story deck and registers it.",
          out: (c) => firstLine(c.output, /^Scaffolded/),
        },
        {
          find: (c) =>
            c.name === "Bash" && /gml\.noaa\.gov\/webdata\/ccgg\/trends\/co2/.test(c.input.command),
          label: () => "Bash(curl gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv ...)",
          note: "NOAA's Mauna Loa monthly, annual and growth-rate files.",
        },
        {
          find: (c) =>
            c.name === "Bash" &&
            c.input.command.startsWith(
              "E=node_modules/slidev-addon-decks/agent/exemplars/tides; cat",
            ),
          label: () => "Bash(cat node_modules/slidev-addon-decks/agent/exemplars/tides/...)",
          note: "Reads the story deck the package ships as an example.",
        },
        {
          find: (c) =>
            c.name === "Bash" && /gml\.noaa\.gov\/education\/carbon_toolkit/.test(c.input.command),
          label: () => "Bash(curl gml.noaa.gov/education/carbon_toolkit/basics.html)",
          note: "NOAA's explanation of the seasonal cycle.",
        },
        {
          find: (c) =>
            c.name === "Bash" && heredocTargets(c.input.command, /\.(py|ts)$/).length > 0,
          all: true,
          labels: (found) =>
            found.flatMap((c) =>
              heredocTargets(c.input.command, /\.(py|ts)$/).map((file) => `Bash(cat > ${file})`),
            ),
          note: "A script that copies the CSVs into one generated file, then one data module per slide.",
        },
        {
          find: (c) =>
            c.name === "Bash" && heredocTargets(c.input.command, /Stage\.vue$/).length > 0,
          all: true,
          labels: (found) =>
            found.flatMap((c) =>
              heredocTargets(c.input.command, /Stage\.vue$/).map((file) => `Bash(cat > ${file})`),
            ),
          note: "One stage component per story slide.",
        },
        {
          find: (c) => c.name === "Write" && /data-sources\.md$/.test(c.input.file_path),
          label: (c) => `Write(${short(c.input.file_path)})`,
          note: "The fact-check input: each figure and where it came from.",
        },
        {
          find: (c) => c.name === "Bash" && checkRound.test(c.input.command),
          labels: () => [
            `Bash(${decks} check)`,
            `Bash(${decks} lint keeling)`,
            `Bash(${decks} build keeling)`,
          ],
          out: (c) => firstLine(c.output, /All page files/),
        },
        {
          find: (c) =>
            c.name === "Bash" &&
            c.input.command.startsWith(`for n in 2 3 4 5; do ${decks} shot keeling $n 2`),
          label: () => `Bash(${decks} shot keeling $n 2 --port 3030)`,
          note: "Screenshots slides 2 to 5 at every click, then reads the images and fixes what they show.",
          out: (c) => firstLine(c.output, /^errors:/),
        },
        {
          find: (c) => c.name === "Bash" && recheck.test(c.input.command),
          labels: () => [
            `Bash(${decks} check)`,
            `Bash(${decks} lint keeling)`,
            `Bash(${decks} build keeling)`,
          ],
          note: "Checks, lints and builds again after the fixes.",
          out: (c) => firstLine(c.output, /built in/),
        },
      ];
    },
  },
};

const [name, path] = process.argv.slice(2);
const spec = RUNS[name];
if (!spec || !path) {
  console.error(`usage: node scripts/excerpt-run.mjs <${Object.keys(RUNS).join("|")}> <log.jsonl>`);
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

const excerpt = [];
/** Tool calls the excerpt shows; one call can appear as several commands. */
const shownIds = new Set();
for (const step of spec.steps(spec.short)) {
  const found = step.all ? calls.filter(step.find) : calls.filter(step.find).slice(0, 1);
  if (found.length === 0) throw new Error(`no call matches the step "${step.note ?? step.label}"`);
  for (const call of found) shownIds.add(call.id);
  excerpt.push({
    calls: step.labels ? step.labels(found) : found.map((call) => step.label(call)),
    note: step.note ?? "",
    output: step.out ? step.out(found[0]) : "",
  });
}

const result = events.find((event) => event.type === "result");
if (!result || result.is_error) throw new Error("the log has no successful result event");
const fixture = {
  source: basename(path),
  session: result.session_id,
  prompt: spec.prompt,
  turns: result.num_turns,
  durationMs: result.duration_ms,
  costUsd: result.total_cost_usd,
  toolCalls: calls.length,
  shownCalls: shownIds.size,
  steps: excerpt,
};
writeFileSync(
  new URL(`../fixtures/${name}.json`, import.meta.url),
  `${JSON.stringify(fixture, null, 2)}\n`,
);
console.log(`wrote fixtures/${name}.json: ${excerpt.length} steps from ${calls.length} calls`);
