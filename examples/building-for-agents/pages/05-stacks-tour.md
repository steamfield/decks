<!--
SLIDE 5 · STACKS TOUR: the Effect CLI's layout, one idea per click, with real code
-->

<StacksTourStage />

<!--
ABOUT THIS SLIDE
The left side is the layout of the Stacks CLI's source. The right side is code from the file named above it. A line that reads only as three dots marks lines left out.
Source: data-sources.md, Slide 5.

SAY (opening)
This is the source of that CLI: 203 files and about twenty-four thousand lines of TypeScript, written with Effect. I'll show four Effect ideas in real files, starting with where a run begins. bin.ts is the only file that imports from Node, and a lint rule fails the build if another file does. main.ts converts errors into exit codes. cli.ts assembles the commands.

[click] This is the whole runs command. The handler gets two services with yield star, calls a function in core, and passes the result to the Output service. Output formats it for a person or for an agent, so the command itself prints nothing. The help text lists the exit codes because agents read the help.

[click] A service is a named interface. Host provides facts about the running process, such as the platform and the working directory. The class has two constructors: layer wraps the real process, and memory builds a fake with defaults for tests.

[click] A layer builds a service, and this function composes all of them: config, then output, then logging and processes. Production and the tests both call it, and the tests pass a fake environment. If a command needs a service that no layer provides, the code fails to compile.

[click] Errors are tagged values. Each tag has a row in this table with its exit code, whether a retry can work, and whether the command keeps its report on stdout. The satisfies clause on the last line makes the compiler require a row for every error class.

[click] This test builds an HTTP client that returns 503 and provides it as a layer. It then runs the real update command and compares the JSON error with the expected one, including the next field that tells an agent what to do. The repo has no module mocks.

IF ASKED
Why Effect? Its errors are typed and the compiler checks its dependencies. The CLI's output is a contract with the agents that call it, and typed errors let me list every way a command can fail.
Which Effect? Effect 4, with the CLI module that ships inside the effect package. The published CLI runs on Node 22 or newer, and Bun builds and bundles it.
-->
