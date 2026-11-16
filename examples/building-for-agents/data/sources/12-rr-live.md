# Slide 12: rr runs this task across my machines.

Source: `../fixtures/12-rr-live.json`, opened and checked 2026-11-16.
Capture date: 2026-11-16. Tool: rr 0.30.0.

The capture used `zsh -f` on a 24-row, 104-column pseudo-terminal at the
repository root. Its commands queried the four configured hosts. Escape
sequences were removed, blank runs collapsed, and the run's final progress
frame retained during capture. Playback uses an 11-row, 104-column pane.

| Claim / constant | Evidence | Status |
| --- | --- | --- |
| `PANE.commands` | Both fixture `steps[].command` values, in order and unchanged | VERIFIED |
| All four hosts online and unlocked | Snapshot rows for m1-linux, m1-mini, m4-mini and mbp: online, LOCK `-` | VERIFIED |
| `demo` configures four shards | Root `.rr.yaml`: `demo.parallel` lists demo-1 through demo-4; each runs core tests with its explicit shard argument | VERIFIED |
| Each shard ran on a named host | Parallel Execution Summary: demo-1 on m1-linux, demo-2 on m1-mini, demo-3 on m4-mini, demo-4 on mbp; four passed | VERIFIED |
| Durations printed in the summary | Fixture: 5.1s, 7.0s, 6.2s, 2.8s; summary 10.0s | VERIFIED |
| Lock and sync precede execution | Contract's description of rr's parallel workflow, consistent with slide 11; not independently visible in the summary | EXTERNAL |
| mbp is the presenter's laptop | Root `.rr.yaml` comment and the author's capture description | FLAG: author-reported |
| `RECORDING.tag` | Fixture `recorded` and `tool` | VERIFIED |

The second exchange drops its four leading lines (`◉ demo-1 [m1-linux]`,
`◉ demo-2 [m1-mini]`, `◉ demo-3 [m4-mini]`, `◉ demo-4 [mbp]`) and every blank
line. It retains both separator rules and every line of the Parallel
Execution Summary, including timings, host names and the logs path. No
retained line's text is rewritten. The first exchange is unchanged.

The stage keeps complete exchanges. Beat 2 replaces the snapshot with the
command and complete summary; stepping back restores the snapshot. No
speedup is calculated or claimed. The no-color workaround and default JSON
output are author-supplied CLI context, confined to IF ASKED.

The shared `data-sources.md` row is supplied in the hand-off.
