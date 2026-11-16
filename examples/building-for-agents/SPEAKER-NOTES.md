# Speaker notes: Building for agents

The full script for each slide, moved out of the slide files. The slides carry a bullet version of the same points for use on stage. Each slide has what the slide shows, the spoken script (opening, then one paragraph per click), and answers for likely questions.

Section numbers follow the slide filename prefixes. The deck has 29 slide files, and slide 25 has `hide: true`, so the default cut is 28 slides. In that cut the thread plays at position 3, habits at 27 and the close at 28; OUTLINE.md section 8 gives the full mapping.

## 1. Building for agents

Clicks: 0

### What the slide shows

The picture is steamfield.io's hero. The mountain range is the seven-day average of commits per day across the product repositories, from May 4 to November 1, 2026.

Source: data-sources.md, Slide 1.

### Say

I'm Riley. I run Steamfield, a studio that builds its own products and takes no client work. Each product started as a tool I needed for my own work, and I still use all of them every day. Tonight I'll show five of them. Most are written in TypeScript, and coding agents run some of them more often than I do, which changed how I build command line tools.

### If asked

- What are the mountains? Commits per day across the product repos, averaged over seven days. The same figure is behind the title on steamfield.io.

## 2. My tools have two users: me and a coding agent.

Clicks: 2

### What the slide shows

Both monitors are recordings of rr running OpenData's test suite on November 2. The left is the summary rr prints with the pretty flag. The right shows the bytes of that output, then the JSON events rr prints without the flag. The capture script runs the command twice, 32 minutes apart, so the totals differ: two of eight tasks failed in the pretty run and three in the JSON run.

Source: data/sources/02-two-users.md.

### Say

My tools have two users, and the first one is me. This is rr running OpenData's test suite across three machines with the pretty flag. It prints one line per task, with the host and the time, and a totals line at the end. I read the totals, see that two tasks failed, and scroll up to those two. Designing this view is developer experience.

**[click]** The second user is a coding agent, and it receives the whole stream. This pane is the same output as bytes, with the escape character written out. Each coloured value in the test log is wrapped in two escape sequences. My terminal turns them into colour, and an agent reading a pipe gets them as text that takes up room in its context.

**[click]** Without the pretty flag, rr prints JSON. It writes one event per phase to stderr and ends with one result event, which holds the status, the exit code and each failing test with its file and message. JSON is the default, and a person adds the flag. Designing this output is agent experience.

### If asked

- Why do the two sides show different totals? The capture script runs the suite twice, once per format, 32 minutes apart. The end-to-end task failed in the first run and passed in the second.

## 3. I ship a change with five tools I built.

Clicks: 2

### What the slide shows

A schematic. The five stations are the five products in the order I use them on one change, which is also the order of the rail along the bottom of every later slide.

Source: data/sources/03-thread.md.

### Say

These are the five tools, in the order I use them on one change. I start a project with Stacks, delegate work with foreman, run the tests on other machines with rr and watch those machines with StatGlass. I present the change with Decks. I built each one for my own work, and most of them started inside OpenData, whose test suite is about fourteen thousand tests.

**[click]** Four of the five use TypeScript. Stacks and foreman are TypeScript with Effect, and rr is Go. StatGlass samples the system in Rust and draws its interface in TypeScript.

**[click]** Stacks, foreman and StatGlass get several slides tonight, with the source code on screen. The other two, rr and Decks, get about ninety seconds each. The same five are listed along the bottom of every slide, with the current one marked.

### If asked

- Where does fourteen thousand come from? It is the figure published on rr's site and in the Steamfield launch post.

## 4. Stacks starts a project an agent can finish.

Clicks: 0

### What the slide shows

A section title: the verb Start, the name Stacks, one sentence, and a pixel-art picture of the tool that plays once on arrival. The rail marks Stacks. Nothing on it is a figure.

### Say

- Stacks starts a project from a Markdown stack recipe.
- The next slides show the brief it writes and the checks the agent must pass.
- Let the audience picture finish before advancing.

## 5. Stacks briefs the agent and checks its work.

Clicks: 4

### What the slide shows

The top half is a diagram of how Stacks works. The monitor underneath shows the verify runs of tea-dashboard, a SvelteKit project scaffolded with stacks 0.5.0 on October 29, 2026 and built by Claude Code. Times are seconds since the scaffold command. The failed run and the passing run each get their own click.

Source: data-sources.md, Slide 5.

### Say

Stacks starts a project. I pick a stack, which is a Markdown recipe, and run one command. It writes a few starter files, the instruction files a coding agent reads, and a brief. This brief is about forty-five hundred words: what to install, how the project is laid out, and which checks have to pass. Stacks makes no model calls and runs nothing from the recipe.

**[click]** Stacks then starts the agent with a two-sentence prompt: read the brief and carry it out, and you're done when stacks verify passes. The brief is a file in the repo, so I can review it and change it like any other file.

**[click]** This is tea-dashboard, a SvelteKit dashboard Claude Code built from a Stacks brief. The first verify ran at 393 seconds. Five of fifteen steps failed: lint, plus four checks for the README and agent docs. The result goes back to the agent.

**[click]** Claude Code fixes the failures and runs verify again. At 501 seconds, all fifteen steps pass. That is the completion rule from the prompt: keep working until these checks pass.

**[click]** An agent that can't get a check to pass can edit the check instead. Stacks stores a hash of the verify steps outside the project. If a step changes, verify exits without running anything until a person accepts the change, and it refuses the accept flag when the caller is an agent.

### If asked

- What is in the brief? The stack's guidance, a section for each add-on, the ground rules, and a table of every verify step. A composed brief is capped at six thousand words.
- Which agents does it start? Claude Code, Codex, OpenCode, Cursor and Copilot. When it is already running inside an agent, or in CI, it prints the prompt and starts nothing.
- Which doc checks failed? readme-filled, agents-md-filled, claude-readme-filled and harness-doc-filled.

## 6. One prompt scaffolds a deck and writes it.

Clicks: 0

### What the slide shows

A prompt for Claude Code in VS Code, with a Copy button. It is a hand-off slide: no clicks, and nothing runs in the deck. The prompt text is in `data/handoffs.ts`.

Source: data-sources.md, Demo hand-offs.

### Say

- Copy this, switch to VS Code, paste into Claude Code, come back.
- The prompt names the tool and the job, nothing else. Claude finds the decks stack, and Stacks tells it what to do next.
- It is done when stacks verify passes. We leave it running.
- We look at the result when we reach Decks.

### If asked

- The fifteen-minute timebox is an instruction to the agent, not a limit the tool enforces.
- The prompt has no commands in it. The scaffold's brief carries the steps and the finish line.

## 7. Stacks gives a failed check an exit code.

Clicks: 3

### What the slide shows

One terminal pane fills the width under the headline. Each beat's one-line caption sits in the pane's bottom band, and three command cards sit above the thread rail. Each card has a play button, and the button on the next command advances the slide one click, the same as the arrow key. By default the pane plays a recording made on November 16 with stacks 0.12.0 in an empty temp directory. When the deck runs from `DECKS_LIVE_TERM=1 bun run decks dev agents`, the same pane runs the commands in a real shell and its tag reads Live. If the live connection fails, the tag says so and the recording plays.

The second command discards verify's progress lines, which go to stderr; the report text is unchanged.

Source: data-sources.md, Slide 7.

### Say

Let's run those commands. This pane uses a shell when the live connection is available, and a recording of the same commands otherwise. Watch the exit code when I check the fresh project.

**[click]** That command wrote the project and its brief. The last line is the hand-off to the agent: read the brief, carry it out, and keep running verify until it passes. I have not built anything yet.

**[click]** Verify fails on the fresh scaffold because the work in the brief is still waiting for the agent. The final line says exit equals five. That gives a caller a result it can branch on, alongside the report.

**[click]** Here is the same failed check through JSON. A script can read the outcome, the totals and the gate state from named fields. The terminal text and the structured output describe the same unfinished project.

### If asked

- Why the pipestatus? The second command pipes verify through tail, and zsh's pipestatus keeps verify's exit code.
- What does the JSON command drop? It sends stderr away from the pane and uses jq to select the four fields shown.
- Is the output trimmed? The second command sends verify's ten progress lines to /dev/null. The report text is unchanged.

## 8. The Stacks CLI is written with Effect.

Clicks: 5

### What the slide shows

The left side is the layout of the Stacks CLI's source. The right side is code from the file named above it. A line that reads only as three dots marks lines left out.

Source: data-sources.md, Slide 8.

### Say

This is the source of that CLI: 203 files and about twenty-four thousand lines of TypeScript, written with Effect. I'll show four Effect ideas in real files, starting with where a run begins. bin.ts is the only file that imports from Node, and a lint rule fails the build if another file does. main.ts converts errors into exit codes. cli.ts assembles the commands.

**[click]** This is the whole runs command. The handler gets two services with yield star, calls a function in core, and passes the result to the Output service. Output formats it for a person or for an agent, so the command itself prints nothing. The help text lists the exit codes because agents read the help.

**[click]** A service is a named interface. Host provides facts about the running process, such as the platform and the working directory. The class has two constructors: layer wraps the real process, and memory builds a fake with defaults for tests.

**[click]** A layer builds a service, and this function composes all of them: config, then output, then logging and processes. Production and the tests both call it, and the tests pass a fake environment. If a command needs a service that no layer provides, the code fails to compile.

**[click]** Errors are tagged values. Each tag has a row in this table with its exit code, whether a retry can work, and whether the command keeps its report on stdout. The satisfies clause on the last line makes the compiler require a row for every error class.

**[click]** This test builds an HTTP client that returns 503 and provides it as a layer. It then runs the real update command and compares the JSON error with the expected one, including the next field that tells an agent what to do. The repo has no module mocks.

### If asked

- Why Effect? Its errors are typed and the compiler checks its dependencies. The CLI's output is a contract with the agents that call it, and typed errors let me list every way a command can fail.
- Which Effect? Effect 4, with the CLI module that ships inside the effect package. The published CLI runs on Node 22 or newer, and Bun builds and bundles it.

## 9. Stacks output differs for people and agents.

Clicks: 3

### What the slide shows

Three recordings of the same failed stacks verify, made on November 13 with stacks 0.7.0 in a scratch project that had not been built: on a terminal, with an agent marker in the environment, and with the JSON flag. The tiles on the last beat are the exit table from the CLI's output reference.

Source: data/sources/09-stacks-output.md.

### Say

This is a failed stacks verify on my terminal. Passed steps are green and failed steps are pink, each failed step is followed by the lines that broke, and the last line says what to do next. Stacks prints this format only when stdout is a terminal, no agent is detected and CI is not set.

**[click]** This is the same command with CLAUDECODE set, which is the variable Claude Code puts in the environment. The report has no colour codes, and stderr gets one short line as each step starts in place of the step's live output. Stacks picks this format without a flag, by checking the environment for the variables each agent sets and for AI_AGENT, the cross-agent convention. It also prints this format when stdout is a pipe or CI is set.

**[click]** With the JSON flag, stdout is one JSON object, and stacks schema prints the JSON Schema for it. When the command fails, the last line of stderr is an error envelope with a tag, a message, a retryable flag and a next field. The next field is a sentence for the caller. For a failed verify it says to fix the code or config the steps exercise and to leave the steps alone.

**[click]** Each exit code has one meaning, and the table is in the docs. 2 means fix the input, 4 means retry later, 5 means read the verify report on stdout, and 6 means ask a person. An agent can branch on the number without parsing the text, and the docs say a published code never changes meaning.

### If asked

- Why not always print JSON? People run these commands too. All three formats are rendered from the same result value.
- What exits 6? A write the CLI refuses, a failed update, or an agent passing the flag that accepts changed verify steps.

## 10. foreman delegates the coding to Codex agents.

Clicks: 0

### What the slide shows

A section title: the verb Delegate, the name foreman, one sentence, and a pixel-art picture of the tool that plays once on arrival. The rail marks foreman. Nothing on it is a figure.

### Say

- foreman is a CLI that lets Claude Code delegate coding work to Codex models.
- The next slides show the worktrees, a delegate's question and the answer that lets it continue.
- Let the audience picture finish before advancing.

## 11. foreman runs each Codex task in its own worktree.

Clicks: 4

### What the slide shows

foreman's landing-page session, redrawn. Claude is on the left, the daemon's board is the monitor in the middle, and each card on the right is one Codex delegate in its worktree. The commands, file writes, question and answer come from three runs recorded on November 6 while building foreman's own site. The timeline they are spread over is shortened and scripted.

Source: data/sources/11-foreman-session.md.

### Say

foreman is a CLI that lets Claude Code delegate coding work to Codex models. This session is from November 6, when Claude built foreman's own landing page. Claude split the page into three tasks and wrote a contract for each one. A contract is a Markdown file with the goal, the definition of done and the files the delegate may edit. foreman parses one line of it, the line that starts with May change.

**[click]** Claude starts each task with foreman start. foreman creates a git worktree under .claude/worktrees and a branch named foreman slash the task name, then starts a Codex turn in that directory with the contract. The delegates are Codex models running under my Codex CLI login, so foreman needs no API key. Claude then runs foreman wait --all as a background task. The counters on each card are that delegate's recorded commands and file writes.

**[click]** The site-commands delegate asked a question, and the text on the board is its question from the recording. Its contract required a test that compares the install command on the page with the one in the README. The two commands differed, and the contract did not allow the delegate to edit either file. It called the ask_orchestrator tool, and the daemon is holding that call open while the other two delegates keep running.

**[click]** The background wait exited with the question, and Claude answered it with foreman answer. Claude told the delegate its test was correct and allowed it to change one line of the page's data file. The recording shows 18 seconds between the question and the answer. The answer is returned inside the same Codex turn, so the delegate keeps its context.

**[click]** When a delegate finishes, foreman wait exits again and prints a digest that lists the files the delegate wrote and any file it changed outside May change. foreman leaves the work uncommitted in the worktree. Claude reads the diff, runs the repo's checks and commits, so Claude is accountable for every commit.

### If asked

- Does every delegate ask a question? The site-e2e run finished without one. The contract tells a delegate to ask only when it is blocked by something the contract and the repo do not settle.
- Is the timeline real? The commands, file writes, question and answer are recorded. The timing is compressed, and the third run started 23 minutes after the first two.

## 12. One prompt has three Codex agents build an app in parallel.

Clicks: 0

### What the slide shows

A prompt for a second Claude Code session in VS Code, with a Copy button. Hand-off slide: no clicks, nothing runs in the deck. The prompt runs under /ce:build with a 15-minute timebox and asks for Horse Tinder, a full-stack web app (Effect backend, React frontend) in ~/demo/horse-tinder. The text is in `data/handoffs.ts`.

Source: data-sources.md, Demo hand-offs.

### Say

- Copy this, paste into a second Claude Code session, come back.
- Claude picks the stack with the stacks CLI, then uses the foreman skill to run three Codex agents in parallel.
- One builds the API, one the swipe screen, one the horse profiles and photos.
- Claude first writes a short RFC with the endpoints and shared types, so the API and the screen are built to one spec. It owns the merge.

### If asked

- Each run has its own worktree, so the three never edit the same files at once.
- The fifteen-minute timebox is an instruction to the agent, not a limit the tool enforces.

## 13. foreman is a short-lived CLI and a daemon.

Clicks: 3

### What the slide shows

A schematic of foreman's processes, left to right: Claude Code, the foreman CLI, a Unix socket, the daemon, one codex app-server, and a thread per run. The tree on the right is foreman's src folder, and the highlighted row is the folder that implements the lit box.

Source: data/sources/13-foreman-daemon.md.

### Say

foreman has two processes of its own. The foreman CLI runs once per command and exits. The daemon supervises the runs, because a Codex turn lasts minutes and the command that started it has already exited. The daemon exits by itself after 30 idle minutes. The source is about nine thousand lines of TypeScript in the same Effect layout as Stacks, because I scaffolded foreman from the Stacks typescript-cli stack.

**[click]** The CLI connects to the daemon over a Unix socket at foreman.sock in foreman's home directory. Each message is one line of JSON. A request carries an id and a body, and the response carries the same id. When the socket is missing, the CLI starts the daemon and connects again. Each home directory gets one daemon, which holds an exclusive SQLite transaction on a guard file for as long as it runs.

**[click]** The daemon starts one process, codex app-server, and exchanges JSON-RPC with it over stdin and stdout. This is the app-server protocol that ships in the Codex CLI, and foreman's client speaks it without an SDK. foreman calls thread/start for a new run, turn/start for each turn and turn/steer to change a running turn. Each run is one thread, and the supervisor routes every message to its run by thread id.

**[click]** foreman was written against Codex 0.166.0. That version's protocol is 467 JSON schema files, and foreman stores a SHA-256 hash of them. At startup the daemon asks Codex to generate the schemas again and hashes them, and foreman doctor prints whether the hash matches. The CLI ships as a compiled binary for four platforms, built with bun build --compile.

### If asked

- Why a daemon? A held question and a running turn both have to outlive the command that started them.
- How long did foreman take to build? The repo has 111 commits, dated November 5 to 7.

## 14. Codex waits until Claude answers its question.

Clicks: 3

### What the slide shows

A sequence diagram with four participants: Claude, a foreman wait running as a background task, the daemon, and Codex. The pane under it shows code from foreman, a different file on each beat. The two terminal lines at the lower left are the example in foreman's design doc.

Source: data/sources/14-foreman-question.md.

### Say

A delegate asks a question by calling a tool. foreman registers one tool with Codex, named ask_orchestrator, and Codex sends the daemon a JSON-RPC request when the model calls it. This code is the daemon receiving that request. It stores the request id, records a QuestionAsked event and sets the run's state to waiting. It sends no response, and Codex blocks the turn until the tool call gets one.

**[click]** Claude learns about the question from a background task. Claude started foreman wait in the background when it started the delegates, and that process stays connected to the daemon until a run changes. The daemon's wake function is these six lines. It replaces a Deferred and resolves the old one, which releases every waiting foreman wait. The wait process prints the question and the command that answers it, then exits. Claude Code reports a finished background task to Claude for any command, and I used that report to deliver the question.

**[click]** Claude runs foreman answer with the question id and the answer text. The daemon finds the stored request id and sends the JSON-RPC response, with the answer as the tool's result, and Codex continues the same turn. If 15 minutes pass with no answer, the daemon sends a response telling the delegate to continue with the work that does not depend on the question. An answer that arrives later is sent to the delegate as a new message.

**[click]** This test covers the timeout. It starts a run with a one-second question timeout and waits for the run to reach the waiting state. TestClock.adjust moves Effect's clock forward one second, and the test checks that the question log ends with a Deferred entry marked timeout. Codex in these tests is a 117-line Node script that replays a scripted scenario over stdin and stdout.

### If asked

- What if Claude is busy when the question arrives? The question stays pending in the run's question log, and foreman status lists it.

## 15. rr runs the tests on machines that sit idle.

Clicks: 0

### What the slide shows

A section title: the verb Test, the name rr, one sentence, and a pixel-art picture of the tool that plays once on arrival. The rail marks rr. Nothing on it is a figure.

### Say

- rr copies the working tree to another machine and runs the command over SSH.
- The next slides show how host locks keep agents' test runs apart.
- Let the audience picture finish before advancing.

## 16. rr runs each agent's tests on its own machine.

Clicks: 7

### What the slide shows

The diagram is a schematic. It is the simulation of rr's lock rules from rr's own site, and its agents, host names and timings are made up. Each click moves the simulation to the next event and stops there. The strip on the last beat is a recording of the result event from one rr test run in OpenData on November 2.

The simulation's hosts are m4-mini, m1-linux and m1-mini. OpenData's config lists mbp, m4-mini and m1-mini and sets worktree_isolation to false, so the card on beat 5 describes rr's default.

Source: data-sources.md, Slide 16.

### Say

rr is written in Go. My agents use it all day to run tests. It copies the working tree to another machine with rsync and runs a command there over SSH. This diagram is the simulation from rr's own site, with four agents on one laptop and three hosts. Each rr call is a separate process. rr has no server, and the only state those processes share is a lock directory on each host.

**[click]** Agent 1 runs rr test, which is a parallel task. I define each shard as a task in the config and list them under parallel, because rr does not split a suite on its own. In OpenData, rr test runs eight of those tasks.

**[click]** A parallel run locks every host and copies the files to each one with rsync. SSH starts each configured task when rsync finishes. The parallel run holds every lock until all its subtasks finish.

**[click]** Agents 2 and 3 start their own runs while agent 1 holds all three locks. A plain run tries the hosts in config order and takes the first one it can lock. When every host is locked, it waits on the laptop and retries every two seconds.

**[click]** This retry finds every lock still held. Before it waits, it prints one JSON event with the status waiting and the command that holds each lock. An agent reading the output can see its run is queued behind rr test.

**[click]** Agent 1's run ends and all three locks are released. Agent 2 retries first and locks m4-mini. Agent 3 finds m4-mini locked and takes m1-linux. By default rr syncs each git worktree to its own directory on the host, so two agents' files stay apart.

**[click]** Agent 4 starts later and takes m1-mini without waiting. It tries the occupied hosts in config order before it locks m1-mini. I usually have two to four agents running at once.

**[click]** This is the result event from an rr test run in OpenData on November 2. Five of the eight tasks passed and three failed. rr parses the output of pytest, Go test, Jest and Vitest, and for each failed test it reports the file, the line and the error message. The highlighted line is a Vitest failure at charts-json.test.ts, line 74, and the message under it says a tooltip field named share is missing from the chart's data.

### If asked

- Is it faster? I have not measured a speedup. rr runs one job per host at a time, so two agents' suites do not compete for the same CPU and ports.
- Is this load balancing? rr takes the first host it can lock, in config order. It does not measure load.
- Are those your hosts? The names are the simulation's. OpenData's config lists mbp, m4-mini and m1-mini, and it sets worktree_isolation to false so all worktrees share one remote copy.

## 17. rr runs this task across my machines.

Clicks: 2

### What the slide shows

One terminal pane fills the width under the headline, built the same way as slide 7, with the beat's caption in its bottom band and two command cards above the thread rail. The commands run at the root of this repo against the four hosts in its `.rr.yaml`: m1-linux, m1-mini and m4-mini over the network, and mbp, the laptop I present from. By default the pane plays a recording made on November 16 with rr 0.30.0. When the deck runs from `DECKS_LIVE_TERM=1 bun run decks dev agents`, the same pane runs the commands in a real shell and its tag reads Live. If the live connection fails, the tag says so and the recording plays.

The recording drops the second command's four leading progress lines and its blank lines. The Parallel Execution Summary is complete and its text is unchanged.

Source: data-sources.md, Slide 17.

### Say

The previous slide simulated the locks. Here are the machines configured for this repo, including the laptop I am presenting from. I'll query their status, then run the demo task across them.

**[click]** The snapshot reports the lock on each host. These are live machines, so another task can hold a host while this demo is running. The table shows that state before I start the run.

**[click]** The repo's config defines demo as a parallel task. rr locked and synced the hosts, then ran a shard on each. The summary names the host each shard ran on.

### If asked

- Why the no-color flag? rr 0.30.0 truncates coloured table cells in a terminal, and the flag avoids that.
- Why the pretty flag? rr prints JSON by default, and pretty asks for the display meant for a person.
- Did rr split the test suite? The config defines four tasks, demo-1 to demo-4, each running one shard of the core package's tests, and lists them under demo's parallel key. rr does not split a suite on its own.
- Is the recording trimmed? It leaves out blank lines and the progress lines printed before the complete summary.
- Why is a host locked? A locked host is already doing other work. The snapshot reflects the machines at this moment; the recorded fallback reflects the earlier capture.

## 18. One prompt shards the app's tests across three hosts.

Clicks: 0

### What the slide shows

A prompt for the Claude Code session that is building Horse Tinder, with a Copy button. Hand-off slide: no clicks, nothing runs in the deck. The prompt asks for integration tests for the API, rr set up for that repo with one parallel task of three shards, one on each remote host, and the command back. The text is in `data/handoffs.ts`.

Source: data-sources.md, Demo hand-offs.

### Say

- Copy this, paste into the session that is building Horse Tinder, come back. The build is still running.
- The agent sets up rr for that repo with the rr skill, mid-build.
- A hook rewrites every test command to go through rr, so the agents still working use it too.
- If the build is already done, it starts two Sonnet subagents on small features. The hook covers them, so their tests go through rr.
- Three shards, one on each remote machine. This laptop stays free.
- It hands back the command, so I can run it again with rr monitor open.

### If asked

- The rr skill writes the repo's config and checks each host can run the tests before the first run.
- The shards are groups the config names. rr does not split a suite on its own.

## 19. StatGlass shows what those machines are doing.

Clicks: 0

### What the slide shows

A section title: the verb Watch, the name StatGlass, one sentence, and a pixel-art picture of the tool that plays once on arrival. The rail marks StatGlass. Nothing on it is a figure.

### Say

- StatGlass is a menu bar app that monitors Apple Silicon Macs, locally and over SSH.
- The next slides follow its start in rr monitor, its Rust and TypeScript boundary, and its CLI.
- Let the audience picture finish before advancing.

## 20. StatGlass started as the rr monitor command.

Clicks: 2

### What the slide shows

Beats 0 and 1 replay a recording of rr monitor snapshots for three hosts, taken on November 2 during one rr test run in OpenData and stopped at a frame where all three hosts hold a lock. The StatGlass cards on beat 2 are illustrative. They draw the same recording's readings in the app's layout, and StatGlass did not record them.

That StatGlass came from watching rr monitor is my own account, and no repo records it.

Source: data-sources.md, Slide 20.

### Say

rr monitor is a terminal dashboard that ships with rr. It shows one card per host with CPU, memory, latency and the command that holds the host's lock, and it reads all of that over SSH. This is a recording from November 2, taken during an rr test run in OpenData while all three hosts were running tasks. I added the monitor to rr as a debugging aid, and then I noticed it was always open.

**[click]** rr monitor keeps 600 samples per metric in a ring buffer. It samples once a second by default, so that is ten minutes, and the buffer is in memory, so it is gone when I close the terminal. The questions I kept asking were about earlier in the day, like why the fans were going at three.

**[click]** StatGlass is the app I built to answer those questions. It is a menu bar app for Apple Silicon Macs that monitors this Mac and other Macs over SSH and stores their history in SQLite. It keeps ten-second buckets for 24 hours, one-minute buckets through seven days and fifteen-minute buckets through 30 days, within a size limit. It used to be called Kelvo. It also reads rr's lock file and shows which job holds each host. The cards on screen are the rr recording drawn in StatGlass's layout.

### If asked

- Is 30 days guaranteed? History has a size limit. When it is reached, the oldest per-process detail is removed first and the resource charts after that.
- Does StatGlass need rr? It monitors any Apple Silicon Mac it can reach over SSH. The rr job is an extra reading on hosts that have an rr lock.

## 21. Rust collects the data and TypeScript draws it.

Clicks: 4

### What the slide shows

A schematic of the StatGlass repo. Rust crates are on the left, the TypeScript layers on the right, and the generated bindings file is between them. The bar is line counts at commit 5db8622a, with tests and generated code included. The chart inside the widget box uses made-up values. On beat 3 the sample reaches the widget first, and then the chart advances by one sample. The code is quoted from the files named above each pane.

Source: data-sources.md, Slide 21.

### Say

StatGlass is a Tauri app, and 58 percent of its lines are Rust. The Rust crates sample the machine, keep the last hour in a ring buffer, write history to SQLite, talk to remote hosts over SSH and draw the menu bar item. TypeScript is the React UI in the popover and the dashboard. The repo has a written rule that Rust decides what a value means and the client formats and draws it.

**[click]** The two sides share one generated file. Each Rust command carries a specta attribute, and tauri-specta writes a typed TypeScript function for it into bindings.ts. The top pane is subscribe_live in Rust. The bottom pane is the line generated from it, with the same five arguments in camel case. That file has 92 commands and 10 events, and a pre-push hook regenerates it and fails if the committed copy differs.

**[click]** Live samples reach the UI over a Tauri Channel, which is a stream that a command gives to the webview. The engine sends one frame message per tick. A frame holds a timestamp and an array of numbers, and an earlier layout message says which series each position in the array belongs to, so the series names are sent once per layout and the frames stay small.

**[click]** In TypeScript a reducer applies each message to the host's state, a zustand store holds that state, and each widget subscribes to the part it draws. A test counts renders to check that a CPU change leaves the memory card alone. The chart path is computed with d3 and rendered by React as SVG. When a tick arrives the chart is redrawn one slot over, and this animate call slides it back to its resting position, so only the transform animates.

**[click]** With no window open, Rust stops sending frames to the webview and the engine samples every two seconds. The menu bar item is the only thing still drawn, and Rust draws it as a bitmap. In that state the app used 0.67 percent of one core and about 105 megabytes. That is one 120-second run on my M3 Max in October, on a machine that was also running builds, taken before remote monitoring existed.

### If asked

- Do the line counts include tests? Yes. Inline Rust tests, TypeScript tests and the generated bindings are all counted.
- Are the chart values recorded? They are made-up values from cpuAt, as the chart's Illustrative tag says.

## 22. The StatGlass UI also runs in a browser tab.

Clicks: 1

### What the slide shows

The left side is a schematic of the two Transport implementations. The code is the Transport interface from src/core/transport/contracts.ts, trimmed where a line reads only as three dots. On the second beat the frame holds the hosted StatGlass demo in an iframe: the real React app on its mock transport, with the multi-host scenario and simulated readings. It needs a network connection, and it loads only in the slide view. Clicking inside the frame moves keyboard focus into it, so click the slide outside the frame before pressing an arrow key.

Source: data-sources.md, Slide 22.

### Say

The React code under src/app calls an interface named Transport for everything it reads or writes. There are two implementations. The Tauri one calls the generated bindings and opens a Channel for each live subscription. The mock one is a fake backend written in TypeScript that produces readings in the browser. A Biome rule fails the lint if a file under src/app imports from the Tauri packages. The pane shows two of the interface's methods: getHost is a request, and subscribeLive takes a callback for the stream.

**[click]** This is the StatGlass dashboard loaded from the docs site, running on the mock transport with a scenario that has several hosts. It is the React code the native app ships, and the mock simulates the numbers. Vitest and Playwright use the mock too, and so does the dev server, so I can change a screen in a browser with hot reload without starting the native shell.

### If asked

- Is the frame live? Yes. Timeline and Hosts are in its sidebar.

## 23. Agents read StatGlass history through a CLI.

Clicks: 2

### What the slide shows

The terminal is an illustrative session that nobody recorded. The history output and the error envelope are the exact strings the CLI's tests assert. The output of now is made-up values in the real JSON shape, wrapped at 100 columns the way a terminal would wrap it. The quote on the last beat is plan/rfc-agent-cli.md, lines 106 to 109, word for word.

Source: data-sources.md, Slide 23.

### Say

StatGlass ships a command-line tool named statglass that a coding agent can run. It asks the running app for readings and recorded history over a local socket. In this session the agent runs now with the all flag and gets the latest CPU reading for both hosts as JSON. Then it runs history for cpu.total on m1-linux over the last three hours. The text output is three lines: the range and bucket size, then the minimum, mean, maximum and last value, then the gaps. CPU on that host reached 97 percent in the minute from 15:12.

**[click]** The third line of the history output says the host was offline from 14:31 to 14:37. StatGlass stores gaps explicitly, and the CLI prints each one with its cause. The command below it failed because the app was busy. With the json flag an error is one JSON object with a tag, a message, whether a retry can work, and a next field that says what to do. The Stacks CLI's errors have the same tag, retryable and next fields.

**[click]** This CLI is written in Rust, and Stacks and foreman are TypeScript. The RFC on screen gives the reasons. A TypeScript CLI compiled with bun build --compile was estimated at 55 to 60 megabytes per architecture, and the whole app is 36. It would also need the JIT entitlement under the hardened runtime, and it would repeat by hand the types Rust already defines. The same RFC defers an MCP server and says it could be a TypeScript package.

### If asked

- How big is the CLI binary? I have not measured it. The 550 KB in the quote is the helper binary next to it.
- Which commands does it have? guide, hosts, now, metrics, history, events, top, doctor, schema and skill.

## 24. An agent reads this laptop's load from StatGlass.

Clicks: 0

### What the slide shows

A prompt for Claude Code in VS Code, with a Copy button. Hand-off slide: no clicks, nothing runs in the deck.

Source: data-sources.md, Demo hand-offs.

### Say

- Copy this, paste into Claude Code, come back.
- The laptop has been busy: a deck build, three Codex agents, a test suite.
- The agent finds the CPU peak and what was running then, using the CLI from the last slide.
- Read only. It says what it would stop and stops nothing.

### If asked

- StatGlass has to be running so there is history to read.

## 25. StatGlass reports this laptop's CPU history.

Hidden in the default cut (`hide: true`). Remove that line from `slides/25-glass-live.mdx` to show it.

Clicks: 3

### What the slide shows

One terminal pane fills the width under the headline, built the same way as slide 7, with the beat's caption in its bottom band and three command cards above the thread rail. The commands run in a temp directory and ask the StatGlass app running on this laptop for its CPU history and events. By default the pane plays a recording made on November 16 with statglass 0.10.0, taken while this repo's test gate was running. When the deck runs from `DECKS_LIVE_TERM=1 bun run decks dev agents`, the same pane runs the commands in a real shell and its tag reads Live, and the readings are the laptop's own from the last half hour. If the live connection fails, the tag says so and the recording plays.

The recording keeps every output line, captured at 92 columns and wrapped for playback at the pane's 135 columns. The host name is the laptop's, as the app printed it.

Source: data-sources.md, Slide 25.

### Say

The last slide showed how the CLI talks to the app. Here I'll ask the running app about this laptop. The app has been sampling since I opened the laptop, so there is some CPU activity to inspect.

**[click]** History asks for the recent CPU total. The first line gives the time range, bucket size and measurement coverage. The next reports the average and peak, including which bucket contained that peak.

**[click]** The fans ramped while bun and editor processes were running. A sustained-process event records bun holding more than a core. Each event names the processes running then, so an agent can see what was active.

**[click]** The history command asks for JSON, and jq selects the summary. A script gets named fields for the same readings, including the peak's bucket size. Measured fraction says how much of the window was observed.

### If asked

- Whose machine is that? The laptop I am presenting from. The host name is exactly what the app printed.
- Did bun cause the fan ramp? The events list the processes running around each event. They do not show which process caused it.
- What does the jq filter leave out? The full JSON response also holds the series. jq selects only its summary.

## 26. Decks made the Horse Tinder pitch we started with.

Clicks: 0

### What the slide shows

A section title: the verb Present, the name Decks, one sentence, and a pixel-art picture of the tool that plays once on arrival. The rail marks Decks. Nothing on it is a figure.

### Say

- The first prompt tonight asked for an investor pitch for Horse Tinder.
- That deck was built with Decks. Switch to the browser and show it.
- Decks also built these slides. The next slide shows its own source and a recorded prose-hook denial.
- Let the audience picture finish before advancing.

## 27. A Decks hook blocks AI-sounding sentences.

Clicks: 2

### What the slide shows

The code on the left is this slide's own source, read from the component file at build time. The terminal that replaces it replays site/fixtures/hook-denial.json: a test line sent to the write hook, and the hook's answer. The pattern counts come from the lint's pattern file and the figure count from this deck's source tables, all computed at build time.

Source: data/sources/27-decks.md.

### Say

Decks is the tool these slides are built with. Each slide is a React component whose stage drives a GSAP timeline. The code on the left is this slide's own source, read from its file when the deck was built. Each beat call marks a point on the timeline, and a click seeks to the next one. The three dots on the right are this slide's beats, and the ring is on the beat the timeline is at. Stepping back plays the same tweens in reverse, so every beat can be reached from either side.

**[click]** Decks also has a hook that runs before an agent writes a file. The terminal shows a recorded run of it. The input was a test sentence containing two stock phrases, and the hook denied the write and printed the two pattern ids. The lint has twenty-seven patterns. Five are errors, which the hook refuses, and twenty-two are warnings that appear only in the lint report.

**[click]** Each figure in this deck has a row in a sources file that names the file or command it came from. The number on the right is the count of those rows, computed when the deck was built.

### If asked

- Where do the patterns come from? A TSV file in the Decks package, with one regular expression per row.

## 28. Each tool has some of the same six habits.

Clicks: 3

### What the slide shows

Six habits down the side and the five products across the top. A cell is lit where a file in that product's repo shows the habit, and the word in the cell is the flag, field or command. Cells with no file behind them are dark.

Source: data/sources/28-habits.md, one row per lit cell.

### Say

This matrix lists six habits and shows which of the five tools has each one. I lit a cell only where I could point to a file in that product's repo. The first two rows are about output. Four of the tools print JSON that a program can parse, behind a flag or by default, and the same four print the next step. Stacks and StatGlass put a next field in the error, foreman ends a result with the next command.

**[click]** The next two rows are about finishing. Stacks, foreman and StatGlass document their exit codes so that each code means one action. Three tools have a command that checks the work: Stacks has verify, a foreman contract lists the commands that must pass, and Decks has check and lint.

**[click]** The last two rows are about several agents and about docs. I run two to four agents at a time. rr locks a host for each run, foreman starts each task in its own worktree, and Decks picks a free port for each screenshot run. Five of the tools ship their own instructions. Stacks, foreman and StatGlass print a guide and install a skill from the binary, so the text matches the installed version.

**[click]** Any CLI or library can adopt these habits, because none of them calls a model. They are output formats, exit codes, locks and bundled docs. A JSON flag, a next field on errors and a documented exit table can be added to a tool you already maintain.

### If asked

- Why are some cells dark? I lit a cell only where I could point to a file. rr returns the remote command's exit code, so it has no exit table.

## 29. The five tools are at steamfield.io.

Clicks: 0

### What the slide shows

The cover's picture with the sun lower. It shows the site's address, the install commands for three of the tools and a QR code to steamfield.io, and it stays up during questions.

Source: data/sources/29-close.md.

### Say

The five products are at steamfield.io. These three install with one command each. Stacks starts a project, foreman delegates work to Codex, and rr runs tests on another machine. The QR code opens steamfield.io.

### If asked

- Does any of this need Claude? Stacks writes adapter files for Claude Code, Codex, OpenCode and Cursor. foreman is specific to Claude Code delegating to Codex.
