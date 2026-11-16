/**
 * Slide 16's data against its sources. The quoted result lines must be bytes
 * of the fixture, the fixture must still be line 4 of rr's run.jsonl, and the
 * ported simulation must still agree with rr's own. The two checks that read
 * ~/Projects/rr run only with DECKS_SOURCE_REPOS=1, at the commits the data file cites.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  AGENT_1_TEST_START,
  AGENT_2_RETRY_END,
  AGENT_2_TEST_START,
  AGENT_2_WAITING_AT,
  AGENT_3_RETRY_START,
  AGENT_4_ARRIVAL,
  FAILURE_AT,
  FLOW_HOSTS,
  FLOW_RUNS,
  flowSteps,
  RESULT_HOT,
  RESULT_LINES,
  RUN,
  SEGMENTS,
  STEPS,
  STILLS,
  sceneAt,
  simulate,
} from "./16-rr-locks";
import {
  describeSourceRepos,
  importablePathAtCommit,
  readAtCommit,
} from "./source-repos.test-support";

// The fixture file is pretty-printed by the repo's formatter. The slide quotes rr's one-line
// event, so compare against the compact serialization, which is that line.
const fixture = JSON.stringify(
  JSON.parse(
    readFileSync(fileURLToPath(new URL("./fixtures/16-rr-result.json", import.meta.url)), "utf8"),
  ),
);
// The commits cited in 16-rr-locks.ts: the run fixture, and the flow.ts it ports.
const RUN_FIXTURE_COMMIT = "9a0dab1";
const FLOW_COMMIT = "536948d";
const scene = (beat: number) => {
  const frame = sceneAt(SEGMENTS, FLOW_RUNS, FLOW_HOSTS.length, STILLS[beat] ?? 0);
  return {
    holders: frame.hosts.map((host) => host.holder),
    phases: frame.hosts.map((host) => host.phase),
    waiting: frame.chips.map((chip) => chip.visible && chip.state === "waiting" && chip.slot === 1),
    visible: frame.chips.map((chip) => chip.visible),
    results: frame.results,
  };
};

describe("slide 16: the recorded result", () => {
  it("quotes the fixture event byte for byte", () => {
    for (const line of RESULT_LINES) {
      const quoted = line.text.replace(/^… /, "").replace(/ …$/, "");
      expect(fixture, quoted).toContain(quoted);
    }
  });

  it("highlights the failure that carries a line number", () => {
    expect(FAILURE_AT).toBe("src/data/articles/charts-json.test.ts:74");
    expect(RESULT_LINES[RESULT_HOT]?.text).toContain(FAILURE_AT);
  });

  it("reads the run totals from the event", () => {
    expect(RUN).toMatchObject({ recorded: "2026-11-02", shards: 8, passed: 5, failed: 3 });
  });
});

describeSourceRepos("slide 16: the fixture against rr", () => {
  it("is still line 4 of rr/site/fixtures/run.jsonl", () => {
    const lines = readAtCommit("rr", RUN_FIXTURE_COMMIT, "site/fixtures/run.jsonl").split("\n");
    expect(fixture).toBe(lines[3]);
  });
});

describe("slide 16: each beat rests on the frame its card describes", () => {
  it("orders the mid-beat moments strictly inside their clicks' stills", () => {
    const spans = [
      { from: STILLS[1], moments: [AGENT_1_TEST_START], to: STILLS[2] },
      { from: STILLS[2], moments: [AGENT_2_WAITING_AT], to: STILLS[3] },
      { from: STILLS[3], moments: [AGENT_2_RETRY_END], to: STILLS[4] },
      { from: STILLS[4], moments: [AGENT_2_TEST_START, AGENT_3_RETRY_START], to: STILLS[5] },
      { from: STILLS[5], moments: [AGENT_4_ARRIVAL], to: STILLS[6] },
    ];
    let previous: number = STILLS[0];
    for (const { from, moments, to } of spans) {
      for (const moment of moments) {
        expect(moment).toBeGreaterThan(previous);
        expect(moment).toBeGreaterThan(from);
        expect(moment).toBeLessThan(to);
        previous = moment;
      }
    }
  });

  it("beat 0: every host free, no rr process yet", () => {
    expect(scene(0)).toEqual({
      holders: [undefined, undefined, undefined],
      phases: ["free", "free", "free"],
      waiting: [false, false, false, false],
      visible: [false, false, false, false],
      results: [undefined, undefined, undefined, undefined],
    });
  });

  it("beat 1: agent 1 holds every host and nobody else has arrived", () => {
    expect(scene(1)).toEqual({
      holders: [0, 0, 0],
      phases: ["sync", "sync", "sync"],
      waiting: [false, false, false, false],
      visible: [true, false, false, false],
      results: [undefined, undefined, undefined, undefined],
    });
  });

  it("beat 2: agent 1's tests run after sync, before the other calls", () => {
    expect(scene(2)).toEqual({
      holders: [0, 0, 0],
      phases: ["test", "test", "test"],
      waiting: [false, false, false, false],
      visible: [true, false, false, false],
      results: [undefined, undefined, undefined, undefined],
    });
  });

  it("beat 3: agents 2 and 3 have moved into waiting while every host is held", () => {
    expect(scene(3)).toEqual({
      holders: [0, 0, 0],
      phases: ["test", "test", "test"],
      waiting: [false, true, true, false],
      visible: [true, true, true, false],
      results: [undefined, undefined, undefined, undefined],
    });
  });

  it("beat 4: a retry has failed and agent 1 still holds every lock", () => {
    expect(scene(4)).toEqual({
      holders: [0, 0, 0],
      phases: ["test", "hold", "hold"],
      waiting: [false, true, true, false],
      visible: [true, true, true, false],
      results: [undefined, undefined, undefined, undefined],
    });
  });

  it("beat 5: the waiting agents run on the first two hosts and agent 1 has its result", () => {
    expect(scene(5)).toEqual({
      holders: [1, 2, undefined],
      phases: ["test", "test", "free"],
      waiting: [false, false, false, false],
      visible: [false, true, true, false],
      results: [FLOW_RUNS[0]?.result, undefined, undefined, undefined],
    });
  });

  it("beat 6: agent 4 holds the last host while agents 2 and 3 still run", () => {
    expect(scene(6)).toEqual({
      holders: [1, 2, 3],
      phases: ["test", "test", "sync"],
      waiting: [false, false, false, false],
      visible: [false, true, true, true],
      results: [FLOW_RUNS[0]?.result, undefined, undefined, undefined],
    });
  });
});

describeSourceRepos("slide 16: the port agrees with rr/site/src/lib/flow.ts", () => {
  it("produces the same segments, scenes and steps", async () => {
    const path = importablePathAtCommit("rr", FLOW_COMMIT, "site/src/lib/flow.ts");
    const source = (await import(/* @vite-ignore */ path)) as typeof import("./16-rr-locks");
    const theirs = source.simulate(source.FLOW_RUNS, source.FLOW_HOSTS.length);
    expect(simulate(FLOW_RUNS, FLOW_HOSTS.length)).toEqual(theirs);
    expect(STEPS).toEqual(source.flowSteps(theirs, source.FLOW_RUNS, source.FLOW_HOSTS));
    expect(flowSteps(SEGMENTS, FLOW_RUNS, FLOW_HOSTS)).toEqual(STEPS);
    const end = Math.max(...theirs.map((segment) => segment.end));
    for (let t = 0; t <= end; t += 250) {
      expect(sceneAt(SEGMENTS, FLOW_RUNS, FLOW_HOSTS.length, t)).toEqual(
        source.sceneAt(theirs, source.FLOW_RUNS, source.FLOW_HOSTS.length, t),
      );
    }
  });
});
