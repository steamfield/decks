<!--
SLIDE 8 · FOREMAN DAEMON: the processes between Claude Code and Codex, with the source tree alongside
-->

<ForemanDaemonStage />

<!--
ABOUT THIS SLIDE
A schematic of foreman's processes, left to right: Claude Code, the foreman CLI, a Unix socket, the daemon, one codex app-server, and a thread per run. The tree on the right is foreman's src folder, and the highlighted row is the folder that implements the lit box.
Source: data/sources/08-foreman-daemon.md.

SAY (opening)
foreman has two processes of its own. The foreman CLI runs once per command and exits. The daemon supervises the runs, because a Codex turn lasts minutes and the command that started it has already exited. The daemon exits by itself after 30 idle minutes. The source is about nine thousand lines of TypeScript in the same Effect layout as Stacks, because I scaffolded foreman from the Stacks typescript-cli stack.

[click] The CLI connects to the daemon over a Unix socket at foreman.sock in foreman's home directory. Each message is one line of JSON. A request carries an id and a body, and the response carries the same id. When the socket is missing, the CLI starts the daemon and connects again. Each home directory gets one daemon, which holds an exclusive SQLite transaction on a guard file for as long as it runs.

[click] The daemon starts one process, codex app-server, and exchanges JSON-RPC with it over stdin and stdout. This is the app-server protocol that ships in the Codex CLI, and foreman's client speaks it without an SDK. foreman calls thread/start for a new run, turn/start for each turn and turn/steer to change a running turn. Each run is one thread, and the supervisor routes every message to its run by thread id.

[click] foreman was written against Codex 0.166.0. That version's protocol is 467 JSON schema files, and foreman stores a SHA-256 hash of them. At startup the daemon asks Codex to generate the schemas again and hashes them, and foreman doctor prints whether the hash matches. The CLI ships as a compiled binary for four platforms, built with bun build --compile.

IF ASKED
Why a daemon? A held question and a running turn both have to outlive the command that started them.
How long did foreman take to build? The repo has 111 commits, dated November 5 to 7.
-->
