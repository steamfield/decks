# Speaker guide: Building for agents

This guide is for anyone presenting this deck. Read it once, then run the deck in presenter view: every slide's notes explain what is on screen, script each click, and list the questions you are likely to get. `SPEAKER-NOTES.md` has the same script in one file.

## The talk in one paragraph

Every tool in this talk has two users: the person at the terminal, and a coding agent that reads every byte the tool prints. The talk follows one change through five tools the speaker built, in the order work moves through them: Stacks starts a project and checks the agent's work, foreman delegates tasks from Claude Code to Codex, rr runs tests on other machines, StatGlass watches those machines, and Decks presents the result. Stacks, foreman and StatGlass get a closer look with their source on screen; rr and Decks get about ninety seconds each. Three slides run the tools live in a terminal. The agent support in all five comes from ordinary decisions about output, errors, exit codes and running several agents at once, and the talk ends on six habits any CLI can adopt and the address steamfield.io.

Audience: working JavaScript and TypeScript developers at Austin JS who have used a coding agent such as Claude Code, Codex or Cursor. Do not assume they know Effect, Tauri, MCP or any Steamfield product. Length: 28 slides, about 28 minutes by the plan below, in a 30-minute slot, plus questions.

## Running the deck

From the repo root, on the laptop you present from:

```bash
bun install
bun run decks dev agents --live-term
```

`--live-term` gives slides 7, 17 and 25 a real shell. Without it, `bun run decks dev agents` runs the same deck and the demo slides play their recordings.

The command prints the deck's address, normally `http://localhost:3030`. Open it in one browser window on the projector and press `f` for fullscreen. Press `p` to open the presenter window and drag it to the laptop screen. Each station in the thread rail along the bottom links to that product's site (`https://<product>.steamfield.io`) and opens in a new tab, so a click on the rail leaves the deck window. The presenter window shows the current slide, the next state, the notes with the current click marked, the position ("5 / 28"), the click count and a timer that starts at the first key press.

- Right arrow or space: next click, or the next slide after the last click. Left arrow: back one click.
- Down arrow: next slide at click 0. Up arrow: previous slide at click 0.
- `o` opens the overview of every slide; Esc closes it.
- On a demo slide, click into the terminal pane to type into the shell. Press Esc to give the keys back to the deck.
- A second audience window or tab shows the same shell, and each command still runs once, whichever window advances. The presenter window's own slide previews play the recording.
- Backup: `bun run decks export agents` writes `dist/building-for-agents.pdf` with every click as its own page. The demo slides print their recordings. Bring it on a USB drive.

## Timing

Position is where the slide plays in the default cut; File is the slide's filename prefix. Slide 25 is hidden, so files 01 to 24 play as positions 1 to 24 and files 26 to 29 play as positions 25 to 28. Files 06, 12, 18 and 24 are hand-off slides: one beat each, no clicks. Files 04, 10, 15, 19 and 26 are section title slides: no clicks, and a picture that plays once. Minutes come from the plan in `OUTLINE.md` section 8, and Clock is the running total at the end of each slide.

| Position | File | Slide | Clicks | Minutes | Clock |
|---|---|---|---|---|---|
| 1 | 01 | Cover | 0 | 0.5 | 0.5 |
| 2 | 02 | Two users | 2 | 1.25 | 1.75 |
| 3 | 03 | The thread | 2 | 1.25 | 3 |
| 4 | 04 | Stacks title | 0 | 0.25 | 3.25 |
| 5 | 05 | Stacks: the loop | 4 | 1.75 | 5 |
| 6 | 06 | Stacks hand-off | 0 | 0.5 | 5.5 |
| 7 | 07 | Stacks: live | 3 | 1 | 6.5 |
| 8 | 08 | Stacks: the repo tour | 5 | 2.75 | 9.25 |
| 9 | 09 | Stacks: output for people and agents | 3 | 1.5 | 10.75 |
| 10 | 10 | foreman title | 0 | 0.25 | 11 |
| 11 | 11 | foreman: the session | 4 | 2 | 13 |
| 12 | 12 | foreman hand-off | 0 | 0.5 | 13.5 |
| 13 | 13 | foreman: the daemon | 3 | 1.5 | 15 |
| 14 | 14 | foreman: the held question | 3 | 1.5 | 16.5 |
| 15 | 15 | rr title | 0 | 0.25 | 16.75 |
| 16 | 16 | rr: host locks | 7 | 2 | 18.75 |
| 17 | 17 | rr: live | 2 | 0.75 | 19.5 |
| 18 | 18 | rr hand-off | 0 | 0.5 | 20 |
| 19 | 19 | StatGlass title | 0 | 0.25 | 20.25 |
| 20 | 20 | From rr monitor to StatGlass | 2 | 1 | 21.25 |
| 21 | 21 | StatGlass: Rust and TypeScript | 4 | 2 | 23.25 |
| 22 | 22 | StatGlass in a browser tab | 1 | 1 | 24.25 |
| 23 | 23 | StatGlass: the agent CLI | 2 | 1.25 | 25.5 |
| 24 | 24 | StatGlass hand-off | 0 | 0.5 | 26 |
| 25 | 26 | Decks title | 0 | 0.75 | 26.75 |
| 26 | 27 | Decks | 2 | 1.25 | 28 |
| 27 | 28 | Six habits | 3 | 1.5 | 29.5 |
| 28 | 29 | Close | 0 | 0.5 | 30 |
Total: about 30 minutes, which is the whole 30-minute slot with nothing left for the demos running slow. The four hand-off slides added 2.0 minutes and the five section title slides 1.75 (0.25 each, and 0.75 for the Decks title, where the Horse Tinder pitch is shown in the browser) to a plan that was already tight (see below). Nothing has been rehearsed against the new total.

Clock checks:

- About a third of the way: leaving slide 8 (the repo tour) at about 9.25 minutes.
- Halfway: leaving slide 13 (the foreman daemon) at about 15 minutes.
- Before the close: leaving position 27 (six habits) at about 29.5 minutes.

Slides 5 and 16 gained clicks after these minutes were planned: slide 5 went from four beats to five and slide 16 from five to eight. Read at 140 words a minute, the script runs about 28 to 30 minutes, so the plan above was short by two to four minutes before the hand-off slides. That estimate was not redone with them, and they add 2.0 minutes to the plan. Time the talk in rehearsal, adjust the clock checks, and decide beforehand which of the beats under "If you are running long" to drop.

## The live demos

Each demo slide shows a terminal pane that fills the width under the headline, with no story card. The beat's one-line caption sits in the pane's bottom band, and one card per command sits above the thread rail. The arrow key, the presenter window's next, or the lit card's play button runs the next command. At click 0 the pane is switched off. The trackpad scrolls the pane from anywhere on it.

When the shell is live, the pane's tag reads `Live`. If you press before the shell is ready, or while a command is still running, the press is queued and the command runs at the next prompt, in order; the tag reads `Live · busy` while a command runs and `Live · queued` while presses wait. Press only once the slide is on screen: a press made while the slide is still loading counts as arriving mid-slide and runs nothing. If the live shell is unavailable, the tag reads `Recorded <date> · <tool version>` and the pane plays the recording, and after a failure the tag adds `live unavailable: <reason>`. The deck works the same either way.

The live shell is a clean `zsh` with a private config, so your own rc files and aliases do not load. It runs without the package runner's variables and `node_modules/.bin` entries on the PATH, so `bun`, `node` and the tools on your own PATH behave as they do in a normal terminal. Output longer than three lines prints at about 30 lines a second, so a long result takes a moment to finish. Default text is light, the prompt and typed command are bold green, and tools that colour their output, such as `jq`, show their colours.

To recover on any demo slide:

- If a command is slow, wait for the prompt. Further presses queue behind it.
- To start over, step back to click 0. The shell resets when you arrive on the slide at click 0 or step back to it.
- A browser reload keeps the shell session.
- If the pane plays the recording, say the recording sentence below and carry on.

### Slide 7: Stacks

```bash
stacks new typescript-cli demo-cli --sandbox --no-launch --offline
cd demo-cli && stacks verify 2>/dev/null | tail -5; echo "exit=$pipestatus[1]"
stacks verify --json 2>/dev/null | jq '{outcome, totals, firstGreen, tamperCheck}'
```

The commands run in a fresh temp directory and need no network.

What the audience sees: the first command prints `Created demo-cli from typescript-cli (sandbox).`, the brief's path and word count, and the hand-off line that starts `NEXT STEP FOR THE AGENT`. The second prints the tail of a failed verify report and `exit=5`. The third prints a JSON object with the outcome, the pass, fail and skip totals, firstGreen and tamperCheck. The second command sends verify's progress lines, which go to stderr, to `/dev/null`, so the command line stays on screen above the report. `stacks verify | tail -5` emits no colour live; the recording tints its fail lines.

Each command took under one and a half seconds when it was recorded.

If the pane shows the recording: "This is a recording of the same three commands from November 16."

### Slide 17: rr

```bash
rr monitor --once --no-color
rr demo --pretty
```

The commands run at the repo root against the four hosts in its `.rr.yaml`: m1-linux, m1-mini and m4-mini over the network, and mbp, this laptop.

What the audience sees: the first command prints a table with one row per host. Each row should read `online`, and the LOCK column should be a dash for every host. The second runs the demo task, four shards of the core package's tests, one per host, and ends with the Parallel Execution Summary: one line per shard with its host and time, then a totals line with 4 passed and 0 failed. Live, rr also prints progress lines while it runs. The recording's LOCK column is all dashes, but live a host can be held by another task, and the caption says only that the snapshot reports each host's lock.

The snapshot takes about 2 seconds and the run about 11 seconds. While the run is going, you can say what it is doing: rr is locking each host and syncing the repo before the tests start.

If the pane shows the recording: "This is a recording of the same two commands from November 16, against the same four machines."

If a remote host is offline, the snapshot shows it, and the run takes longer or fails. Say what the recording would have shown: all four hosts online and unlocked, and four shards passing, one on each host, in about ten seconds. Then move on. If the LOCK column shows a command, something else is holding rr on that host, and the run will wait for it; say so and move on.

### Slide 25: StatGlass (hidden)

This slide is out of the default cut. To use it, see "If you are running short" below.

```bash
statglass history cpu.total --since 30m
statglass events --since 2h
statglass history cpu.total --since 30m --json | jq '.series[0].summary'
```

The commands run in a temp directory and ask the StatGlass app on this laptop for its history. The app has to be running and needs at least 30 minutes of history; the events command looks back two hours.

What the audience sees: the first command prints the time range, the bucket size and how much of the window was measured, then the minimum, mean and maximum with the bucket the peak fell in. The second lists recent events, such as fan ramps and sustained CPU use, each with the processes running at the time. The third prints the same summary as JSON.

Each command returns at once; the recorded ones took under 15 milliseconds.

The notes for click 2 describe the recording's events (fans ramping while bun and editor processes ran). Live, read the events on screen and describe those.

If the pane shows the recording: "This is a recording of the same three commands from November 16, on this laptop."

If StatGlass is not running, the commands fail. Say what the recording showed: half an hour of CPU history fully measured, fan ramps with the processes running at the time, and the same summary as JSON. Then move on.

### Optional: foreman outside the deck

A live foreman run is the one demo that leaves the deck. It is optional, comes after slide 11, takes about 3 minutes and is outside the timing above. `OUTLINE.md` section 12 has the commands. Rehearse it, because whether a delegate asks a question depends on the model. If it fails, say that slide 11 showed a recorded session and move on.

## External sessions

Slides 5, 12, 18 and 24 are hand-off slides. Each shows one prompt with a Copy button and no clicks. You paste it into a Claude Code session outside the deck and leave it running while the talk goes on. Nothing in the deck checks that the session worked, and none of the three agent prompts (slides 5, 12 and 18) has been run end to end.

Before the talk:

- VS Code is open with two Claude Code sessions ready: one for slide 6 (and slide 24), one for slide 12 and then slide 18.
- `~/demo` is empty or does not exist. It ends up holding `horse-tinder-deck` (slide 6) and `horse-tinder` (slide 12).
- Ghostty is optional. Use it only to run `rr monitor` when you rerun the command the agent hands back after slide 18.
- StatGlass is running and has about 30 minutes of history, so the slide 24 prompt has something to read.

At each hand-off slide, click Copy, switch to the app named on the slide, paste, and switch back to the deck. Slide 6 and slide 24 go into the first Claude Code session, and slide 12 into the second. Slide 18 is pasted into that same second session, the one building Horse Tinder, and waits behind the build.

The slide 18 work starts only after the Horse Tinder build finishes. With a 15-minute timebox started at about 12 minutes, that is near or after the end of the talk, so the sharded run is most likely something to show during questions. If it does run earlier, it uses only the three remote hosts. The in-deck rr demo on slide 17 needs the hosts free, so an agent running tests through rr during slide 17 would make that demo wait.

At the Decks title slide (file 26), switch to the browser and show the Horse Tinder deck that the slide 6 prompt built. If that session has not finished or verify did not pass, say so and carry on with the slide.

The slide 12 prompt builds the Horse Tinder web app in `~/demo/horse-tinder` and opens it in the browser when it finishes. It starts at about 12 minutes with a 15-minute timebox, so it may not be done before the close, and it is the prompt most likely to run long. Show it at the Decks slide beside the pitch deck if it is ready, or after the close during questions.

## Before you present

- Tailscale is up, and `rr monitor --once --no-color` from the repo root shows all four hosts online with an empty LOCK column (a dash on every row).
- Nothing else is using rr on the laptop: no test gate running and no coding agent working in a repo. `rr demo` needs the laptop's lock.
- Run `rr demo --pretty` once to warm the hosts.
- Run any `stacks` command once, so the first-run notice does not appear on stage.
- `stacks`, `rr`, `statglass` and `jq` are on the PATH of the shell you start the deck from.
- StatGlass has been running for at least 30 minutes, for the slide 24 hand-off and for slide 25 if it is in.
- VS Code is open with two Claude Code sessions ready, `~/demo` is empty or absent, and Ghostty is open only if you want `rr monitor` for the slide 18 rerun (see "External sessions").
- Slide 22's frame loads the hosted StatGlass demo, so the laptop needs a network connection for that beat.
- The deck is open in one audience window, with the presenter window on the laptop.
- The projector is at the resolution you rehearsed at.
- The PDF from `bun run decks export agents` is on a USB drive.

## If you are running long

Four beats can go. Each slide still makes its point without the beat. Any hand-off slide can also be skipped with one arrow press, since each is a single beat; the external session it starts then does not run.

| Slide | Beat | Card | How to skip |
|---|---|---|---|
| 8 | 3 | One function composes the layers. | It sits mid-slide: press through it with one sentence. |
| 13 | 3 | foreman checks the Codex protocol by hash. | It is the last beat: press the down arrow from beat 2. |
| 21 | 4 | Idle CPU was 0.67 percent of one core. | It is the last beat: press the down arrow from beat 3. |
| 28 | 2 | Agents run in parallel and read bundled docs. | It sits mid-slide: press through it with one sentence. |

Slide 25 is already hidden.

## If you are running short

Restore slide 25 by removing the `hide: true` line from `slides/25-glass-live.mdx` before the talk. It adds four beats and about one minute, which brings the total to about 29.25 minutes. Positions after it shift by one: habits plays at 28 and the close at 29. StatGlass then has to be running, as in the checklist.

## Where things live

| What | File |
|---|---|
| Speaker notes | each slide's `<Notes>` block in `slides/*.mdx`, and `SPEAKER-NOTES.md` |
| Every figure and its source | `data/*.ts` and `data-sources.md` |
| The demo recordings | `data/fixtures/07-stacks-live.json`, `17-rr-live.json`, `25-glass-live.json` |
| Slide order, click counts, hidden slides | the frontmatter of each file in `slides/` |
| The plan, timings and per-slide spec | `OUTLINE.md` |
