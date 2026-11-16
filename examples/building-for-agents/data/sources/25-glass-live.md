# Slide 25: StatGlass reports this laptop's CPU history.

Source: `../fixtures/25-glass-live.json`, opened and checked 2026-11-16.
Capture date: 2026-11-16. Tool: statglass 0.10.0.

The capture used `zsh -f` on a 24-row, 92-column pseudo-terminal with
`DO_NOT_TRACK=1`, querying the running app while the repo's test gate ran.
Escape sequences were removed; output text is otherwise as printed.
The capture is kept at its original 92-column width and playback wraps it at the shared 135-column grid.

| Claim / constant | Evidence | Status |
| --- | --- | --- |
| `PANE.commands` | All three fixture `steps[].command` values, unchanged | VERIFIED |
| CPU history includes coverage and bucket size | Step 1: 08:27 to 08:57, 10 s buckets, 100% measured | VERIFIED |
| Range, average and peak | Step 1: min 22.9%, mean 36.8%, max 100.0%; peak bucket begins 08:54:00 | VERIFIED |
| Events name processes | Step 2: fans_ramped lists bun, node and Code Helper processes; sustained_process names bun | VERIFIED |
| More than a core of sustained CPU | Step 2: bun cpu_pct=149 and cpu_pct=148 | VERIFIED |
| JSON exposes the same summary | Step 3: min 22.873037338256836, mean 36.83559671767131, max 100.0, max_bucket_s 10, measured_fraction 1.0 | VERIFIED |
| Laptop identity and test activity during capture | Fixture `how` and author-supplied capture context; the host name remains `Riley’s MacBook Pro` | FLAG: author-reported |
| `RECORDING.tag` | Fixture `recorded` and `tool` | VERIFIED |

All output lines are retained, kept at the 92-column capture width and wrapped for playback at the shared 135-column grid. No line's text
is rewritten and the recorded host name is preserved. The viewport retains
complete exchanges that fit together and restores earlier exchanges on back.
At the final beat the JSON exchange fills the pane. The events supply
concurrent process names, not proof of what caused a fan ramp.

This slide ships with `hide: true`; its evidence remains so it can be enabled
for a rehearsal. The shared `data-sources.md` row is supplied in the hand-off.
