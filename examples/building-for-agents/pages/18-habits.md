<!--
SLIDE 18 · SIX HABITS: a matrix of six habits by seven products, each lit cell backed by a file
-->

<HabitsStage />

<!--
ABOUT THIS SLIDE
Six habits down the side and the seven products across the top. A cell is lit where a file in that product's repo shows the habit, and the word in the cell is the flag, field or command. Cells with no file behind them are dark.
Source: data/sources/18-habits.md, one row per lit cell.

SAY (opening)
This matrix lists six habits and shows which of the seven tools has each one. I lit a cell only where I could point to a file in that product's repo. The first two rows are about output. Six of the tools print JSON that a program can parse, behind a flag or by default, and the same six print the next step. Stacks and StatGlass put a next field in the error, foreman ends a result with the next command, and OpenChart's validation errors suggest the field name you probably meant.

[click] The next two rows are about finishing. Stacks, foreman and StatGlass document their exit codes so that each code means one action. Three tools have a command that checks the work: Stacks has verify, a foreman contract lists the commands that must pass, and Decks has check and lint.

[click] The last two rows are about several agents and about docs. I run two to four agents at a time. rr locks a host for each run, foreman starts each task in its own worktree, and Decks picks a free port for each screenshot run. Five of the tools ship their own instructions. Stacks, foreman and StatGlass print a guide and install a skill from the binary, so the text matches the installed version.

[click] Any CLI or library can adopt these habits, because none of them calls a model. They are output formats, exit codes, locks and bundled docs. A JSON flag, a next field on errors and a documented exit table can be added to a tool you already maintain.

IF ASKED
Why are some cells dark? I lit a cell only where I could point to a file. rr returns the remote command's exit code, so it has no exit table. OpenChart's validator is a function with no command around it.
-->
