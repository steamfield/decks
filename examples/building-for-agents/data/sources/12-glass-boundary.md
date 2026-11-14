## Slide 12: StatGlass, the boundary

Read 2026-11-13 from `~/Projects/statglass` at commit `5db8622a` (version 0.12.0, `package.json`).

| Figure | Value | Source |
|---|---|---|
| RUST_LINES | 153,401 | `find crates src-tauri -name '*.rs' -print0 \| xargs -0 cat \| wc -l`. Inline tests included. |
| TS_LINES | 111,644 | `find src \( -name '*.ts' -o -name '*.tsx' \) -print0 \| xargs -0 cat \| wc -l`. Tests and `src/core/generated` included. |
| RUST_PERCENT, TS_PERCENT | 58, 42 | `RUST_LINES / (RUST_LINES + TS_LINES)`, rounded, in `data/12-glass-boundary.ts`. The outline said "about 60". |
| COMMANDS | 92 | `grep -o '__TAURI_INVOKE[<(]' src/core/generated/bindings.ts \| wc -l`; the `collect_commands!` block in `src-tauri/src/lib.rs` (from line 79) lists the same 92. The outline said 81, which is `grep -c '__TAURI_INVOKE("'` and misses the 11 calls written `__TAURI_INVOKE<T>(`. `grep -c __TAURI_INVOKE` prints 93 because it counts the import line. |
| EVENTS | 10 | the `collect_events!` block, `src-tauri/src/lib.rs` lines 143 to 154 |
| "A pre-push hook fails if the file is stale" | | `Makefile` lines 235 to 250 (`bindings`, `bindings-check`) and its help text for `make check` |
| IDLE.cpuPercent | 0.67 (recorded as 0.672) | `plan/competitor-benchmarks.md` line 17; `README.md` line 190. One run, 120 s after a 30 s warm-up, menu bar only with shipped defaults, M3 Max, macOS 27, on AC, 2026-10-07, load average 4.8 to 7.8, before remote monitoring existed, Docker monitoring off. The file's own caveat: "One run each." The app's own target for this state is 0.5 (`AGENTS.md` line 55), which the run misses. |
| IDLE.memoryMb (notes only) | 104.9, said as "about 105" | same row of `plan/competitor-benchmarks.md` |
| IDLE.backgroundTickS (notes only) | 2 s | `README.md` line 184; decision D-094 in `plan/decisions.md` line 3111 |
| Box names and notes | crate and directory names | `AGENTS.md` lines 26 to 40; "one-hour ring" from `crates/statglass-engine/src/lib.rs` line 3; the tray from `src-tauri/src/tray/mod.rs` lines 1 to 19 |
| FRAME_MESSAGE | `{ kind: "frame", values: [ … ], … }` | abridged from the `frame` variant of `LiveMsg`, `src/core/generated/bindings.ts` line 1951; the layout message it depends on is documented at lines 1917 to 1921 |
| Code: `subscribe_live` | lines 75 to 85 | `src-tauri/src/commands.rs`, through `data/code/12-glass-boundary.ts` (drift test) |
| Code: `subscribeLive` | line 150 | `src/core/generated/bindings.ts`, same module |
| Code: `el.animate` | lines 33 to 36 | `src/app/widgets/lib/use-tick-scroll.ts`, same module |
| "d3 computes the path and React renders it as SVG" | | `src/app/widgets` imports `area` and `line` from `d3-shape`; `use-tick-scroll.ts` header comment |
| "A test counts renders" (notes) | | `src/app/stores/live-selectors.test.tsx` lines 7 to 32 |
| "Rust decides what a value means" (notes) | | `.claude/rules/data-boundary.md` line 10, "Rust Owns Meaning, the Client Presents" |
| "Rust stops sending frames with no window visible" (notes) | | `src-tauri/src/live.rs` lines 6 to 9 |
| The widget chart | illustrative | `cpuAt` in `data/12-glass-boundary.ts`, ported from `~/Projects/steamfield/src/lib/statglass-demo.ts` (steamfield commit 1b001f9). Tagged Illustrative on the slide. |

Banned on this slide (checked): "about 60 percent Rust" (it is 58); "81 commands" (it is 92); the idle figure without "one run" beside it; any ratio against Stats (one run each, different modules enabled).
