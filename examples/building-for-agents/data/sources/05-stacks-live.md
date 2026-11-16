# Slide 05: Stacks gives a failed check an exit code.

Source: `../fixtures/05-stacks-live.json`, opened and checked 2026-11-16.
Capture date: 2026-11-16. Tool: stacks 0.12.0.

The capture ran each command in `zsh -f`, in an empty temporary directory on a
24-row, 92-column pseudo-terminal, with `DO_NOT_TRACK=1`. Escape sequences were
removed during capture; the fixture otherwise preserves the printed text.

| Claim / constant | Evidence | Status |
| --- | --- | --- |
| `PANE.commands` | The fixture's three `steps[].command` values, unchanged | VERIFIED |
| `RECORDING` | Each command followed by that step's captured output, wrapped every 92 characters | VERIFIED |
| Project and brief written; next agent step printed | Step 1: `Created demo-cli from typescript-cli (sandbox).`, `Brief: .stacks/BRIEF.md (4065 words)`, and `NEXT STEP FOR THE AGENT` | VERIFIED |
| `VERIFY_EXIT` | Step 2: `Verify failed.` and `exit=5` | VERIFIED |
| JSON result | Step 3: outcome failed; totals 2 passed, 8 failed, 12 skipped; firstGreen false; tamperCheck full | VERIFIED |
| `RECORDING.tag` | Fixture `recorded` and `tool` values | VERIFIED |

Step 2 omits these leading progress lines to fit its complete command and report
at a readable size: `> install`, `> lint`, `> typecheck`, `> test`,
`> config-logging`, `> binary`, `> schema-conventions`, `> no-standalone-schema`,
`> effect-testkit`, `> effect-api-reference`. No other output line is omitted
from the recording data and no line's text is rewritten.

The stage viewport keeps complete exchanges, always including the newest
command and all its retained output. When earlier exchanges no longer fit,
they leave the viewport together. Stepping back restores them.

The brief word count belongs to this capture and CLI version. The cards do not
repeat it or compare it to slide 04's different project and version.

The source rows for `data-sources.md` are in the hand-off because that shared
file is owned by the orchestrator during this run.
