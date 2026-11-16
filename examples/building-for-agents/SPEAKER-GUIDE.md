# Speaker guide: Building for agents

This guide is for anyone presenting this deck. Read it once, then run the deck in presenter view: every slide's notes explain what is on screen, script each click, and list the questions you are likely to get. `SPEAKER-NOTES.md` has the same script in one file.

## The talk in one paragraph

Every tool in this talk has two users: the person at the terminal, and a coding agent that reads every byte the tool prints. The talk follows one change through five tools the speaker built, in the order work moves through them: Stacks starts a project and checks the agent's work, foreman delegates tasks from Claude Code to Codex, rr runs tests on other machines, StatGlass watches those machines, and Decks presents the result. Stacks, foreman and StatGlass get a closer look with their source on screen; rr and Decks get about ninety seconds each. Three slides run the tools live in a terminal. The agent support in all five comes from ordinary decisions about output, errors, exit codes and running several agents at once, and the talk ends on six habits any CLI can adopt and the address steamfield.io.

Audience: working JavaScript and TypeScript developers at Austin JS who have used a coding agent such as Claude Code, Codex or Cursor. Do not assume they know Effect, Tauri, MCP or any Steamfield product. Length: 23 slides, about 28 minutes by the plan below, in a 30-minute slot, plus questions.

## Running the deck

From the repo root, on the laptop you present from:

```bash
bun install
DECKS_LIVE_TERM=1 bun run decks dev agents
```

`DECKS_LIVE_TERM=1` gives slides 6, 14 and 21 a real shell. Without it, `bun run decks dev agents` runs the same deck and the demo slides play their recordings.

The command prints the deck's address, normally `http://localhost:3030`. Open it in one browser window on the projector and press `f` for fullscreen. Press `p` to open the presenter window and drag it to the laptop screen. Each station in the thread rail along the bottom links to that product's site (`https://<product>.steamfield.io`) and opens in a new tab, so a click on the rail leaves the deck window. The presenter window shows the current slide, the next state, the notes with the current click marked, the position ("5 / 23"), the click count and a timer that starts at the first key press.

- Right arrow or space: next click, or the next slide after the last click. Left arrow: back one click.
- Down arrow: next slide at click 0. Up arrow: previous slide at click 0.
- `o` opens the overview of every slide; Esc closes it.
- On a demo slide, click into the terminal pane to type into the shell. Press Esc to give the keys back to the deck.
- Keep one audience window. A second window or tab on the deck would send each command to the same shell a second time. The presenter window is safe: its thumbnails play the recording.
- Backup: `bun run decks export agents` writes `dist/building-for-agents.pdf` with every click as its own page. The demo slides print their recordings. Bring it on a USB drive.

## Timing

Position is where the slide plays in the default cut; File is the slide's filename prefix. Slide 21 is hidden, so files 01 to 20 play as positions 1 to 20 and files 22 to 24 play as positions 21 to 23. Files 04, 10, 15 and 20 are hand-off slides: one beat each, no clicks. Minutes come from the plan in `OUTLINE.md` section 8, and Clock is the running total at the end of each slide.

| Position | File | Slide | Clicks | Minutes | Clock |
|---|---|---|---|---|---|
| 1 | 01 | Cover | 0 | 0.5 | 0.5 |
| 2 | 02 | Two users | 2 | 1.25 | 1.75 |
| 3 | 03 | The thread | 2 | 1.25 | 3.0 |
| 4 | 04 | Stacks hand-off | 0 | 0.5 | 3.5 |
| 5 | 05 | Stacks: the loop | 4 | 1.75 | 5.25 |
| 6 | 06 | Stacks: live | 3 | 1.0 | 6.25 |
| 7 | 07 | Stacks: the repo tour | 5 | 2.75 | 9.0 |
| 8 | 08 | Stacks: output for people and agents | 3 | 1.5 | 10.5 |
| 9 | 09 | foreman: the session | 4 | 2.0 | 12.5 |
| 10 | 10 | foreman hand-off | 0 | 0.5 | 13.0 |
| 11 | 11 | foreman: the daemon | 3 | 1.5 | 14.5 |
| 12 | 12 | foreman: the held question | 3 | 1.5 | 16.0 |
| 13 | 13 | rr: host locks | 7 | 2.0 | 18.0 |
| 14 | 14 | rr: live | 2 | 0.75 | 18.75 |
| 15 | 15 | rr hand-off | 0 | 0.5 | 19.25 |
| 16 | 16 | From rr monitor to StatGlass | 2 | 1.0 | 20.25 |
| 17 | 17 | StatGlass: Rust and TypeScript | 4 | 2.0 | 22.25 |
| 18 | 18 | StatGlass in a browser tab | 1 | 1.0 | 23.25 |
| 19 | 19 | StatGlass: the agent CLI | 2 | 1.25 | 24.5 |
| 20 | 20 | StatGlass hand-off | 0 | 0.5 | 25.0 |
| 21 | 22 | Decks | 2 | 1.25 | 26.25 |
| 22 | 23 | Six habits | 3 | 1.5 | 27.75 |
| 23 | 24 | Close | 0 | 0.5 | 28.25 |
Total: about 28.25 minutes, which leaves about 1.75 minutes of the 30 for the demos running slow. The four hand-off slides added 2.0 minutes to a plan that was already tight (see below), and nothing has been rehearsed against the new total.

Clock checks:

- About a third of the way: leaving slide 7 (the repo tour) at about 9.0 minutes.
- Halfway: leaving slide 11 (the foreman daemon) at about 14.5 minutes.
- Before the close: leaving position 22 (six habits) at about 27.75 minutes.

Slides 5 and 13 gained clicks after these minutes were planned: slide 5 went from four beats to five and slide 13 from five to eight. Read at 140 words a minute, the script runs about 28 to 30 minutes, so the plan above was short by two to four minutes before the hand-off slides. That estimate was not redone with them, and they add 2.0 minutes to the plan. Time the talk in rehearsal, adjust the clock checks, and decide beforehand which of the beats under "If you are running long" to drop.

## The live demos

Each demo slide shows a terminal pane that fills the width under the headline, with no story card. The beat's one-line caption sits in the pane's bottom band, and one card per command sits above the thread rail. The arrow key, the presenter window's next, or the lit card's play button runs the next command. At click 0 the pane is switched off. The trackpad scrolls the pane from anywhere on it.

When the shell is live, the pane's tag reads `Live`. If you press before the shell is ready, or while a command is still running, the press is queued and the command runs at the next prompt, in order; the tag reads `Live · busy` while a command runs and `Live · queued` while presses wait. Press only once the slide is on screen: a press made while the slide is still loading counts as arriving mid-slide and runs nothing. If the live shell is unavailable, the tag reads `Recorded <date> · <tool version>` and the pane plays the recording, and after a failure the tag adds `live unavailable: <reason>`. The deck works the same either way.

The live shell is a clean `zsh` with a private config, so your own rc files and aliases do not load. It runs without the package runner's variables and `node_modules/.bin` entries on the PATH, so `bun`, `node` and the tools on your own PATH behave as they do in a normal terminal. Output longer than three lines prints at about 30 lines a second, so a long result takes a moment to finish. Default text is light, the prompt and typed command are bold green, and tools that colour their output, such as `jq`, show their colours.

To recover on any demo slide:

- If a command is slow, wait for the prompt. Further presses queue behind it.
- To start over, step back to click 0. The shell resets when you arrive on the slide at click 0 or step back to it.
- A browser reload keeps the shell session.
- If the pane plays the recording, say the recording sentence below and carry on.

### Slide 6: Stacks

```bash
stacks new typescript-cli demo-cli --sandbox --no-launch --offline
cd demo-cli && stacks verify | tail -5; echo "exit=$pipestatus[1]"
stacks verify --json 2>/dev/null | jq '{outcome, totals, firstGreen, tamperCheck}'
```

The commands run in a fresh temp directory and need no network.

What the audience sees: the first command prints `Created demo-cli from typescript-cli (sandbox).`, the brief's path and word count, and the hand-off line that starts `NEXT STEP FOR THE AGENT`. The second prints the tail of a failed verify report and `exit=5`. The third prints a JSON object with the outcome, the pass, fail and skip totals, firstGreen and tamperCheck. Live, the second command also prints verify's progress lines, which go to stderr, so the command line scrolls off the top of the 17 rows by the time `exit=5` prints. Scroll up in the pane to show it. `stacks verify | tail -5` emits no colour live; the recording tints its fail lines.

Each command took under one and a half seconds when it was recorded.

If the pane shows the recording: "This is a recording of the same three commands from November 16."

### Slide 14: rr

```bash
rr monitor --once --no-color
rr demo --pretty
```

The commands run at the repo root against the four hosts in its `.rr.yaml`: m1-linux, m1-mini and m4-mini over the network, and mbp, this laptop.

What the audience sees: the first command prints a table with one row per host. Each row should read `online`, and the LOCK column should be a dash for every host. The second runs the demo task, four shards of the core package's tests, one per host, and ends with the Parallel Execution Summary: one line per shard with its host and time, then a totals line with 4 passed and 0 failed. Live, rr also prints progress lines while it runs. The recording's LOCK column is all dashes, but live a host can be held by another task, and the caption says only that the snapshot reports each host's lock.

The snapshot takes about 2 seconds and the run about 11 seconds. While the run is going, you can say what it is doing: rr is locking each host and syncing the repo before the tests start.

If the pane shows the recording: "This is a recording of the same two commands from November 16, against the same four machines."

If a remote host is offline, the snapshot shows it, and the run takes longer or fails. Say what the recording would have shown: all four hosts online and unlocked, and four shards passing, one on each host, in about ten seconds. Then move on. If the LOCK column shows a command, something else is holding rr on that host, and the run will wait for it; say so and move on.

### Slide 21: StatGlass (hidden)

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

A live foreman run is the one demo that leaves the deck. It is optional, comes after slide 9, takes about 3 minutes and is outside the timing above. `OUTLINE.md` section 12 has the commands. Rehearse it, because whether a delegate asks a question depends on the model. If it fails, say that slide 9 showed a recorded session and move on.

## External sessions

Slides 4, 10, 15 and 20 are hand-off slides. Each shows one prompt or shell command with a Copy button and no clicks. You paste it into a session outside the deck and leave it running while the talk goes on. Nothing in the deck checks that the session worked.

Before the talk:

- VS Code is open with two Claude Code sessions ready: one for the Stacks prompt, one for the foreman prompt. The StatGlass prompt can go into either.
- Ghostty is open.
- `~/demo` is empty or does not exist. The Stacks prompt writes `~/demo/horse-tinder-deck` and the foreman prompt writes `~/demo/horse-tinder`.
- StatGlass is running and has about 30 minutes of history, so the slide 20 prompt has something to read.
- Nothing else is using rr. The slide 15 command runs the Stacks suite on all four hosts.

At each hand-off slide, click Copy, switch to the app named on the slide, paste, and switch back to the deck. Slide 4 and slide 20 go into Claude Code in VS Code, slide 10 into the second Claude Code session, and slide 15 into Ghostty. The rr command also opens `rr monitor`; leave it on screen for a moment, then come back.

The rr hand-off has to come after the in-deck rr demo on slide 14. The suite locks all four hosts for about two minutes (128 seconds when run on 2026-11-16), and `rr demo` on slide 14 needs them free. Do not move slide 15 earlier, and do not run the slide 15 command before the slide 14 demo has finished.

At the Decks slide (file 22), switch to VS Code and show the Horse Tinder deck that the slide 4 prompt built. If that session has not finished or verify did not pass, say so and carry on with the slide.

The slide 10 prompt builds the Horse Tinder web app in `~/demo/horse-tinder` and opens it in the browser when it finishes. It starts at about 12 minutes with a 15-minute timebox, so it may not be done before the close. Show it at the Decks slide beside the pitch deck if it is ready, or after the close during questions.

## Before you present

- Tailscale is up, and `rr monitor --once --no-color` from the repo root shows all four hosts online with an empty LOCK column (a dash on every row).
- Nothing else is using rr on the laptop: no test gate running and no coding agent working in a repo. `rr demo` needs the laptop's lock.
- Run `rr demo --pretty` once to warm the hosts.
- Run any `stacks` command once, so the first-run notice does not appear on stage.
- `stacks`, `rr`, `statglass` and `jq` are on the PATH of the shell you start the deck from.
- StatGlass has been running for at least 30 minutes, for the slide 20 hand-off and for slide 21 if it is in.
- VS Code is open with two Claude Code sessions ready, Ghostty is open, `~/demo` is empty or absent, and nothing else is using rr (see "External sessions").
- Slide 18's frame loads the hosted StatGlass demo, so the laptop needs a network connection for that beat.
- The deck is open in one audience window, with the presenter window on the laptop.
- The projector is at the resolution you rehearsed at.
- The PDF from `bun run decks export agents` is on a USB drive.

## If you are running long

Four beats can go. Each slide still makes its point without the beat. Any hand-off slide can also be skipped with one arrow press, since each is a single beat; the external session it starts then does not run.

| Slide | Beat | Card | How to skip |
|---|---|---|---|
| 7 | 3 | One function composes the layers. | It sits mid-slide: press through it with one sentence. |
| 11 | 3 | foreman checks the Codex protocol by hash. | It is the last beat: press the down arrow from beat 2. |
| 17 | 4 | Idle CPU was 0.67 percent of one core. | It is the last beat: press the down arrow from beat 3. |
| 23 | 2 | Agents run in parallel and read bundled docs. | It sits mid-slide: press through it with one sentence. |

Slide 21 is already hidden.

## If you are running short

Restore slide 21 by removing the `hide: true` line from `slides/21-glass-live.mdx` before the talk. It adds four beats and about one minute, which brings the total to about 29.25 minutes. Positions after it shift by one: habits plays at 23 and the close at 24. StatGlass then has to be running, as in the checklist.

## Where things live

| What | File |
|---|---|
| Speaker notes | each slide's `<Notes>` block in `slides/*.mdx`, and `SPEAKER-NOTES.md` |
| Every figure and its source | `data/*.ts` and `data-sources.md` |
| The demo recordings | `data/fixtures/06-stacks-live.json`, `14-rr-live.json`, `21-glass-live.json` |
| Slide order, click counts, hidden slides | the frontmatter of each file in `slides/` |
| The plan, timings and per-slide spec | `OUTLINE.md` |
