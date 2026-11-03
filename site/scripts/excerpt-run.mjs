// Builds fixtures/<run>.json, the static transcript excerpt on the landing page,
// from a Claude Code stream-json log (`claude -p ... --output-format stream-json`).
//
//   node scripts/excerpt-run.mjs keeling-1 <path/to/keeling-run.jsonl>   # the hero
//   node scripts/excerpt-run.mjs smoke-1 <path/to/smoke-1.jsonl>         # tides
//
// It keeps the calls a reader needs to follow the run (skill, scaffold, rules,
// sources, data and stage files, check, lint, build) with their first output
// line, and the run's own turn count, duration and cost. The prompt is passed
// with -p, so it isn't in the log: it is recorded per run below. A shown Bash
// command is either cut from the logged command (`run`: split on &&, ;, || and
// newlines, pipes and redirections dropped) or, where the log's command is too
// long to show, an abbreviation every word of which must appear in it; the
// script throws when one doesn't. Re-run it on the log to regenerate the fixture.
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
 * The simple commands in one Bash call, as a reader would name them: heredoc
 * bodies dropped; split on unquoted &&, ||, ; and newlines; everything after an
 * unquoted pipe dropped; redirections, a leading `(`, `do` or `then` and a
 * trailing `&` or `)` removed.
 */
function commandsIn(command) {
  const text = command.replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n\2(?=\n|$)/g, "$3");
  const parts = [];
  let current = "";
  let quote = null;
  let piped = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const keep = (c) => {
      if (!piped) current += c;
    };
    if (quote) {
      if (ch === quote) quote = null;
      keep(ch);
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      keep(ch);
      continue;
    }
    const pair = text.slice(i, i + 2);
    if (pair === "&&" || pair === "||" || ch === ";" || ch === "\n") {
      parts.push(current);
      current = "";
      piped = false;
      if (pair === "&&" || pair === "||") i++;
      continue;
    }
    if (ch === "|") piped = true;
    else keep(ch);
  }
  parts.push(current);
  return parts
    .map((part) =>
      part
        .replace(/\s*\d*>>?&?\s*[^\s)]+/g, "")
        .trim()
        .replace(/^\(\s*/, "")
        .replace(/^(do|then)\s+/, "")
        .replace(/\s*&?\s*\)?\s*$/, "")
        .trim(),
    )
    .filter(Boolean);
}

/** `cmd` with the variables the same call assigns (`E=path; cat $E/x`) filled in. */
function expanded(command) {
  const vars = new Map(
    [...command.matchAll(/(?:^|[\s;&(])([A-Za-z_]\w*)=("[^"]*"|'[^']*'|[^\s;&]+)/g)].map((m) => [
      m[1],
      (m[2] ?? "").replace(/^["']|["']$/g, ""),
    ]),
  );
  return command.replace(/\$\{?([A-Za-z_]\w*)\}?/g, (all, name) => vars.get(name) ?? all);
}

/** Shows the commands of a call that match `pattern`, as cut from the logged command. */
const run = (pattern) => (c) =>
  commandsIn(c.input.command)
    .filter((command) => pattern.test(command))
    .map((command) => `Bash(${command})`);

/**
 * Each step: a name (for errors), which call it is, how the call shows, and which
 * output line to keep. `show` returns one label or several for each found call.
 */
const RUNS = {
  // The tides deck, drafted with this repository's own agent setup.
  "smoke-1": {
    prompt: "make a 5-slide story deck about how ocean tides work",
    short: (file) => file.replace(/^.*\/Projects\/decks\//, ""),
    steps: (short) => [
      {
        name: "skill",
        find: (c) => c.name === "Skill",
        show: (c) => `Skill(${c.input.skill})`,
        note: "Loads the repo's deck-building workflow.",
        out: (c) => firstLine(c.output),
      },
      {
        name: "scaffold",
        find: (c) => c.name === "Bash" && /^bun run new tides /.test(c.input.command),
        show: run(/^bun run new /),
        note: "Scaffolds a story deck and registers it.",
        out: (c) => firstLine(c.output, /^Scaffolded/),
      },
      {
        name: "rules",
        find: (c) => c.name === "Read" && /\.claude\/rules\//.test(c.input.file_path),
        all: true,
        show: (c) => `Read(${short(c.input.file_path)})`,
        note: "Reads the writing, stage and data rules before drafting.",
      },
      {
        name: "NOAA tides",
        find: (c) => c.name === "Bash" && /tidesandcurrents\.noaa\.gov\/api/.test(c.input.command),
        show: () => "Bash(curl api.tidesandcurrents.noaa.gov ... station=8443970)",
        note: "NOAA tide predictions for Boston.",
      },
      {
        name: "USNO moon phases",
        find: (c) => c.name === "Bash" && /aa\.usno\.navy\.mil/.test(c.input.command),
        show: () => "Bash(curl aa.usno.navy.mil/api/moon/phases ...)",
        note: "US Naval Observatory moon phase dates.",
      },
      {
        name: "NASA fact sheet",
        find: (c) => c.name === "Bash" && /nssdc\.gsfc\.nasa\.gov/.test(c.input.command),
        show: () => "Bash(curl nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html)",
        note: "NASA fact-sheet constants.",
      },
      {
        name: "data modules",
        find: (c) => c.name === "Write" && /\/data\/[\w-]+\.ts$/.test(c.input.file_path),
        all: true,
        show: (c) => `Write(${short(c.input.file_path)})`,
        note: "One data module per slide, each figure with its source.",
      },
      {
        name: "stages",
        find: (c) => c.name === "Write" && /\/components\/\w+Stage\.vue$/.test(c.input.file_path),
        all: true,
        show: (c) => `Write(${short(c.input.file_path)})`,
        note: "One stage component per story slide.",
      },
      {
        name: "check",
        find: (c) => c.name === "Bash" && /^cd \S+ && bun run check/.test(c.input.command),
        show: run(/^bun run check/),
        out: (c) => firstLine(c.output, /All page files/),
      },
      {
        name: "test",
        find: (c) => c.name === "Bash" && /^bun run test 2>&1 \| tail -40$/.test(c.input.command),
        show: run(/^bun run test/),
        out: (c) => firstLine(c.output, /Tests\s+\d+ passed/),
      },
      {
        name: "lint",
        find: (c) => c.name === "Bash" && /^bun run lint 2>&1 \| tail -20$/.test(c.input.command),
        show: run(/^bun run lint/),
        note: "The prose lint prints only its own command line: no findings.",
        out: (c) => firstLine(c.output, /content-lint/),
      },
      {
        name: "build",
        find: (c) => c.name === "Bash" && /^bun run build tides/.test(c.input.command),
        show: run(/^bun run build /),
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
      const decks = /^bunx -p slidev-addon-decks decks /;
      const checkRound = /^bunx -p slidev-addon-decks decks check 2>&1 \| tail -15;/;
      const recheck = /&& bunx -p slidev-addon-decks decks check 2>&1 \| tail -2 &&/;
      const heredocs = (pattern) => (c) =>
        heredocTargets(c.input.command, pattern).map((file) => `Bash(cat > ${file})`);
      return [
        {
          name: "skill",
          find: (c) => c.name === "Skill",
          show: (c) => `Skill(${c.input.skill})`,
          note: "Loads the deck-building workflow that decks init installed.",
          out: (c) => firstLine(c.output),
        },
        {
          name: "rules",
          find: (c) =>
            c.name === "Bash" && /cat \.claude\/rules\/story-stage\.md/.test(c.input.command),
          show: run(/^cat \.claude\/rules\//),
          note: "Reads the stage, data and writing rules before drafting.",
        },
        {
          name: "scaffold",
          find: (c) => c.name === "Bash" && /^bunx -p \S+ decks new keeling /.test(c.input.command),
          show: run(/^bunx -p \S+ decks new /),
          note: "Scaffolds a story deck and registers it.",
          out: (c) => firstLine(c.output, /^Scaffolded/),
        },
        {
          name: "NOAA CSVs",
          find: (c) =>
            c.name === "Bash" && /gml\.noaa\.gov\/webdata\/ccgg\/trends\/co2/.test(c.input.command),
          show: () => "Bash(curl gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv ...)",
          note: "NOAA's Mauna Loa monthly, annual and growth-rate files.",
        },
        {
          name: "exemplar",
          find: (c) =>
            c.name === "Bash" &&
            c.input.command.startsWith(
              "E=node_modules/slidev-addon-decks/agent/exemplars/tides; cat",
            ),
          show: () => "Bash(cat node_modules/slidev-addon-decks/agent/exemplars/tides/...)",
          note: "Reads the story deck the package ships as an example.",
        },
        {
          name: "NOAA seasonal cycle",
          find: (c) =>
            c.name === "Bash" && /gml\.noaa\.gov\/education\/carbon_toolkit/.test(c.input.command),
          show: () => "Bash(curl gml.noaa.gov/education/carbon_toolkit/basics.html)",
          note: "NOAA's explanation of the seasonal cycle.",
        },
        {
          name: "data modules",
          find: (c) =>
            c.name === "Bash" && heredocTargets(c.input.command, /\.(py|ts)$/).length > 0,
          all: true,
          show: heredocs(/\.(py|ts)$/),
          note: "A script that copies the CSVs into one generated file, then one data module per slide.",
        },
        {
          name: "stages",
          find: (c) =>
            c.name === "Bash" && heredocTargets(c.input.command, /Stage\.vue$/).length > 0,
          all: true,
          show: heredocs(/Stage\.vue$/),
          note: "One stage component per story slide.",
        },
        {
          name: "data-sources.md",
          find: (c) => c.name === "Write" && /data-sources\.md$/.test(c.input.file_path),
          show: (c) => `Write(${short(c.input.file_path)})`,
          note: "The fact-check input: each figure and where it came from.",
        },
        {
          name: "first check round",
          find: (c) => c.name === "Bash" && checkRound.test(c.input.command),
          show: run(decks),
          out: (c) => firstLine(c.output, /All page files/),
        },
        {
          name: "screenshots",
          find: (c) =>
            c.name === "Bash" &&
            /^for n in 2 3 4 5; do bunx \S+ \S+ decks shot /.test(c.input.command),
          show: run(decks),
          note: "Screenshots slides 2 to 5 at every click, then reads the images and fixes what they show.",
          out: (c) => firstLine(c.output, /^errors:/),
        },
        {
          name: "second check round",
          find: (c) => c.name === "Bash" && recheck.test(c.input.command),
          show: run(decks),
          note: "Checks, lints and builds again after the fixes, then lists every figure for the fact-check.",
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
  const fail = (why) => {
    throw new Error(`step "${step.name}": ${why}`);
  };
  const found = step.all ? calls.filter(step.find) : calls.filter(step.find).slice(0, 1);
  if (found.length === 0) fail("no call matches");
  const shown = found.flatMap((call) => [step.show(call)].flat());
  if (shown.length === 0) fail("the matched call shows no command");
  // Every word of a shown Bash command is in the logged command (an abbreviation's
  // trailing "..." aside), so nothing on the page is a command the agent didn't type.
  const logged = found.map((call) => expanded(call.input.command ?? "")).join("\n");
  for (const label of shown) {
    const command = /^Bash\((.*)\)$/s.exec(label)?.[1];
    if (command === undefined) continue;
    for (const word of command.split(/\s+/)) {
      const part = word.replace(/\.\.\.$/, "");
      if (part && !logged.includes(part))
        fail(`"${part}" in ${label} is not in the logged command`);
    }
  }
  for (const call of found) shownIds.add(call.id);
  excerpt.push({
    calls: shown,
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
