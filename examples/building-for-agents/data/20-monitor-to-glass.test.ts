/**
 * Slide 20's data against its sources. The fixture must still be rr's
 * monitor.jsonl, and the ported timeline and sparkline must still agree with
 * rr's own. Checks that read ~/Projects/rr or ~/Projects/statglass run only with
 * DECKS_SOURCE_REPOS=1, at the commits the data file cites.
 */
import { describe, expect, it } from "vitest";
import {
  BUSIEST,
  cardsAt,
  GRAPH_COLS,
  GRAPH_ROWS,
  HISTORY_MINUTES,
  HISTORY_SAMPLES,
  history,
  RECORDED,
  RETENTION,
  RETENTION_DAYS,
  sparkline,
  TIMELINE,
} from "./20-monitor-to-glass";
import snapshots from "./fixtures/20-monitor.json";
import {
  describeSourceRepos,
  importablePathAtCommit,
  readAtCommit,
} from "./source-repos.test-support";

// The commits cited in 20-monitor-to-glass.ts.
const MONITOR_FIXTURE_COMMIT = "9a0dab1";
const PORT_COMMIT = "536948d";
const STATGLASS_COMMIT = "5db8622a";

describe("slide 20: the recording", () => {
  it("rests on a frame where every host holds a lock", () => {
    const cards = cardsAt(BUSIEST);
    expect(cards.map((card) => card.name)).toEqual(["m1-mini", "m4-mini", "mbp"]);
    expect(
      cards.every((card) => card.frame.status === "running" && card.frame.command !== ""),
    ).toBe(true);
    expect(RECORDED).toBe("2026-11-02");
  });
});

describeSourceRepos("slide 20: the fixture against rr", () => {
  it("is still rr/site/fixtures/monitor.jsonl", () => {
    const lines = readAtCommit("rr", MONITOR_FIXTURE_COMMIT, "site/fixtures/monitor.jsonl")
      .split("\n")
      .filter((line) => line.trim().startsWith("{"));
    expect(snapshots).toEqual(lines.map((line) => JSON.parse(line)));
  });
});

describeSourceRepos("slide 20: the port agrees with rr/site/src/lib/monitor", () => {
  it("builds the same timeline and picks the same frame", async () => {
    const path = importablePathAtCommit("rr", PORT_COMMIT, "site/src/lib/monitor/timeline.ts");
    const source = await import(/* @vite-ignore */ path);
    const theirs = source.buildTimeline(snapshots);
    expect(TIMELINE).toEqual(theirs);
    expect(BUSIEST).toBe(source.busiestFrame(theirs));
    expect(history(TIMELINE, "mbp", "cpu", BUSIEST)).toEqual(
      source.history(theirs, "mbp", "cpu", BUSIEST),
    );
  });

  it("lights the same sparkline dots", async () => {
    const render = await import(
      /* @vite-ignore */ importablePathAtCommit("rr", PORT_COMMIT, "site/src/lib/monitor/render.ts")
    );
    const dots = await import(
      /* @vite-ignore */ importablePathAtCommit(
        "rr",
        PORT_COMMIT,
        "site/src/components/landing/monitor/Dots.tsx",
      )
    );
    for (const host of TIMELINE.hosts) {
      const cpu = history(TIMELINE, host, "cpu", BUSIEST);
      const theirs = render.sparkline(cpu, GRAPH_COLS, GRAPH_ROWS);
      const mine = sparkline(cpu, GRAPH_COLS, GRAPH_ROWS);
      expect(mine.heights).toEqual(dots.subColumnHeights(theirs.rows));
      expect(mine.columnMax).toEqual(theirs.columnMax);
    }
  });
});

describeSourceRepos("slide 20: the figures", () => {
  it("rr monitor keeps 600 samples", () => {
    const source = readAtCommit("rr", PORT_COMMIT, "internal/monitor/history.go");
    expect(source).toContain(`const DefaultHistorySize = ${HISTORY_SAMPLES}`);
    expect(HISTORY_MINUTES).toBe(10);
  });

  it("StatGlass keeps the tiers its README lists", () => {
    const readme = readAtCommit("statglass", STATGLASS_COMMIT, "README.md").replace(/\s+/g, " ");
    expect(readme).toContain(
      "10-second buckets for 24 hours, one-minute buckets through 7 days and 15-minute buckets through 30 days",
    );
    expect(RETENTION.map((tier) => tier.through)).toEqual(["24 h", "7 d", "30 d"]);
    expect(RETENTION_DAYS).toBe(30);
  });
});
