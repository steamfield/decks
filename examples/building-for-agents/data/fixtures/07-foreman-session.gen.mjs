// Writes 07-foreman-session.json from foreman's own session model. Reads ~/Projects/claude-codex/site and changes nothing there.
// Refresh: bun examples/building-for-agents/data/fixtures/07-foreman-session.gen.mjs examples/building-for-agents/data/fixtures/07-foreman-session.json
import { homedir } from "node:os";
const site = `${homedir()}/Projects/claude-codex/site`;
const { buildSession } = await import(`${site}/src/data/session.ts`);
const load = async (n) => (await import(`${site}/fixtures/runs/${n}.json`)).default;
const runs = { "site-console": await load("site-console"), "site-commands": await load("site-commands"), "site-e2e": await load("site-e2e") };
const q = runs["site-commands"];
const s = buildSession(q, runs);
const asked = q.questions.find((x) => x._tag === "Asked");
const resolved = q.questions.find((x) => x._tag === "Resolved" && x.id === asked.id);
const mayChange = (c) => c.split("\n").find((l) => l.startsWith("- May change:")).replace(/`/g, "");
const out = {
  runs: Object.values(runs).map((r) => ({ name: r.name, model: r.model, createdAt: r.createdAt, branch: r.branch, durationMs: r.durationMs })),
  question: { ...s.question, run: q.name, askedMs: asked.t, answeredMs: resolved.t, askedAt: asked.at, answeredAt: resolved.at },
  delegates: s.delegates.map((d) => ({
    name: d.name, model: d.model, work: d.work, branch: d.branch, contract: d.contract,
    mayChange: mayChange(runs[d.name].contract),
    start: d.start, done: d.done,
    activity: d.activity.map((a) => ({ at: Math.round(a.at), event: a.event.kind === "command" ? { kind: "command", command: a.event.command, exitCode: a.event.exitCode } : { kind: "files", paths: a.event.paths } })),
  })),
  steps: s.steps.map((x) => ({ at: x.at, title: x.title })),
  packets: s.packets,
  duration: s.duration,
  stillAt: s.stillAt,
};
await Bun.write(process.argv[2], JSON.stringify(out, null, 1) + "\n");
