## Slide 11: StatGlass started as the rr monitor command.

Beats 0 and 1 are a recording; beat 2's cards are illustrative. rr read at commit 536948d, statglass at 5db8622a (both 2026-11-13).

| Figure | Value | Source |
|---|---|---|
| The origin claim (title, notes) | StatGlass came from keeping `rr monitor` open | `FLAG: author-reported` (Riley). Nothing in either repo records it |
| Notes: "a debugging aid", "always open", "why the fans were going at three" | Riley's account | `FLAG: author-reported`, from `OUTLINE.md` section 10, slide 11 |
| Monitor recording | 193 snapshots, 2026-11-02 16:41:08Z to 16:48:56Z, hosts m1-mini, m4-mini, mbp | `data/fixtures/11-monitor.json`: the lines of `~/Projects/rr/site/fixtures/monitor.jsonl` (rr commit 9a0dab1) as one JSON array; the test compares them |
| RECORDED | 2026-11-02 | first snapshot's `timestamp` |
| BUSIEST | frame 111, 281 s into the recording, all three hosts holding a lock | `busiestFrame`, ported from `~/Projects/rr/site/src/lib/monitor/timeline.ts`; the test compares the port's timeline and frame with the source |
| Card readings (CPU, 1m load, RAM, latency, lock command, held time, alias) | per host at frame 111 | the fixture, through `buildTimeline` |
| CPU sparkline dots | 40 characters by 2 braille rows | `sparkline`, ported from `~/Projects/rr/site/src/lib/monitor/render.ts`; drawn as dots like `site/src/components/landing/monitor/Dots.tsx`; the test compares the lit dots with the source |
| Reading colors (cyan, violet, pink at 70 and 90 percent) | thresholds 70 / 90 | `THRESHOLDS` and `severity` in `render.ts` (rr monitor's defaults) |
| "CPU, memory, latency and the command holding the host's lock, read over SSH" | claim | `~/Projects/rr/site/src/components/landing/monitor/MonitorCard.tsx` (ports `internal/monitor/card.go`) |
| HISTORY_SAMPLES | 600 | `~/Projects/rr/internal/monitor/history.go` line 7, `const DefaultHistorySize = 600` |
| HISTORY_MINUTES | 10 | 600 samples at the default interval of 1 s: `~/Projects/rr/internal/config/types.go` line 629 (`Interval: "1s"`) and the comment on `history.go` line 6 |
| "held in memory until rr monitor exits" | claim | `history.go`: `History` is ring buffers behind a mutex, with no persistence |
| RETENTION, AXIS_TICKS | 10 s buckets for 24 h, 1 min through 7 d, 15 min through 30 d | `~/Projects/statglass/README.md` lines 213 to 222. The "1 h" tick is only an axis mark |
| RETENTION_DAYS ("up to 30 days") | 30 | same paragraph, which adds "30 days is not guaranteed"; hence "up to" |
| "a menu bar app for Apple Silicon Macs" | claim | `~/Projects/statglass/README.md` lines 3 and 15 |
| "stores each host's history in SQLite" | claim | `~/Projects/statglass/AGENTS.md` line 34 and `crates/statglass-store/Cargo.toml` |
| Notes: monitors other Macs over SSH | claim | `~/Projects/statglass/README.md` lines 128 to 129 |
| Notes: "It used to be called Kelvo" | claim | `~/Projects/statglass/README.md` line 26 |
| Notes: reads rr's lock file and shows the job | claim | `~/Projects/statglass/crates/statglass-remote/src/rr.rs` (`LOCK_DIR = "/tmp/rr.lock"`, `RrJob`) |
| Notes: size limit, oldest per-process detail removed first | claim | `~/Projects/statglass/README.md` lines 213 to 222 |
| StatGlass cards and menu bar item on beat 2 | the recording's CPU, RAM and GPU histories, in StatGlass's metric colors | Illustrative. Colors follow `~/Projects/steamfield/src/components/home/StatGlassDemo.tsx` (CPU cyan, memory violet, GPU pink). StatGlass did not record these readings |
