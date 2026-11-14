<!--
SLIDE 4 · STACKS LOOP: a command writes a brief, the agent builds, verify decides when it is done
-->

<StacksLoopStage />

<!--
ABOUT THIS SLIDE
The top half is a diagram of how Stacks works. The monitor underneath shows the verify runs of tea-dashboard, a SvelteKit project scaffolded with stacks 0.5.0 on October 29, 2026 and built by Claude Code. Times are seconds since the scaffold command.
Source: data-sources.md, Slide 4.

SAY (opening)
Stacks starts a project. I pick a stack, which is a Markdown recipe, and run one command. It writes a few starter files, the instruction files a coding agent reads, and a brief. This brief is about forty-five hundred words: what to install, how the project is laid out, and which checks have to pass. Stacks makes no model calls and runs nothing from the recipe.

[click] Stacks then starts the agent with a two-sentence prompt: read the brief and carry it out, and you're done when stacks verify passes. The brief is a file in the repo, so I can review it and change it like any other file.

[click] These are the verify runs from tea-dashboard, a SvelteKit dashboard that Claude Code built from a Stacks brief. Claude ran verify for the first time 393 seconds after the scaffold, and five of the fifteen steps failed: lint, and four checks that the README and the agent docs had been filled in. The next run, at 501 seconds, passed all fifteen.

[click] An agent that can't get a check to pass can edit the check instead. Stacks stores a hash of the verify steps outside the project. If a step changes, verify exits without running anything until a person accepts the change, and it refuses the accept flag when the caller is an agent.

IF ASKED
What is in the brief? The stack's guidance, a section for each add-on, the ground rules, and a table of every verify step. A composed brief is capped at six thousand words.
Which agents does it start? Claude Code, Codex, OpenCode, Cursor and Copilot. When it is already running inside an agent, or in CI, it prints the prompt and starts nothing.
-->
