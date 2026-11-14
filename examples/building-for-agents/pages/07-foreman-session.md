<!--
SLIDE 7 · FOREMAN SESSION: Claude writes contracts, Codex delegates work in worktrees, one asks, Claude answers and commits
-->

<ForemanSessionStage />

<!--
ABOUT THIS SLIDE
foreman's landing-page session, redrawn. Claude is on the left, the daemon's board is the monitor in the middle, and each card on the right is one Codex delegate in its worktree. The commands, file writes, question and answer come from three runs recorded on November 6 while building foreman's own site. The timeline they are spread over is shortened and scripted.
Source: data/sources/07-foreman-session.md.

SAY (opening)
foreman is a CLI that lets Claude Code delegate coding work to Codex models. This session is from November 6, when Claude built foreman's own landing page. Claude split the page into three tasks and wrote a contract for each one. A contract is a Markdown file with the goal, the definition of done and the files the delegate may edit. foreman parses one line of it, the line that starts with May change.

[click] Claude starts each task with foreman start. foreman creates a git worktree under .claude/worktrees and a branch named foreman slash the task name, then starts a Codex turn in that directory with the contract. The delegates are Codex models running under my Codex CLI login, so foreman needs no API key. Claude then runs foreman wait --all as a background task. The counters on each card are that delegate's recorded commands and file writes.

[click] The site-commands delegate asked a question, and the text on the board is its question from the recording. Its contract required a test that compares the install command on the page with the one in the README. The two commands differed, and the contract did not allow the delegate to edit either file. It called the ask_orchestrator tool, and the daemon is holding that call open while the other two delegates keep running.

[click] The background wait exited with the question, and Claude answered it with foreman answer. Claude told the delegate its test was correct and allowed it to change one line of the page's data file. The recording shows 18 seconds between the question and the answer. The answer is returned inside the same Codex turn, so the delegate keeps its context.

[click] When a delegate finishes, foreman wait exits again and prints a digest that lists the files the delegate wrote and any file it changed outside May change. foreman leaves the work uncommitted in the worktree. Claude reads the diff, runs the repo's checks and commits, so Claude is accountable for every commit.

IF ASKED
Does every delegate ask a question? The site-e2e run finished without one. The contract tells a delegate to ask only when it is blocked by something the contract and the repo do not settle.
Is the timeline real? The commands, file writes, question and answer are recorded. The timing is compressed, and the third run started 23 minutes after the first two.
-->
