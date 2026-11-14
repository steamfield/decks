<!--
SLIDE 9 · FOREMAN QUESTION: how a question is held and how Claude finds out, with the code for each step
-->

<ForemanQuestionStage />

<!--
ABOUT THIS SLIDE
A sequence diagram with four participants: Claude, a foreman wait running as a background task, the daemon, and Codex. The pane under it shows code from foreman, a different file on each beat. The two terminal lines at the lower left are the example in foreman's design doc.
Source: data/sources/09-foreman-question.md.

SAY (opening)
A delegate asks a question by calling a tool. foreman registers one tool with Codex, named ask_orchestrator, and Codex sends the daemon a JSON-RPC request when the model calls it. This code is the daemon receiving that request. It stores the request id, records a QuestionAsked event and sets the run's state to waiting. It sends no response, and Codex blocks the turn until the tool call gets one.

[click] Claude learns about the question from a background task. Claude started foreman wait in the background when it started the delegates, and that process stays connected to the daemon until a run changes. The daemon's wake function is these six lines. It replaces a Deferred and resolves the old one, which releases every waiting foreman wait. The wait process prints the question and the command that answers it, then exits. Claude Code reports a finished background task to Claude for any command, and I used that report to deliver the question.

[click] Claude runs foreman answer with the question id and the answer text. The daemon finds the stored request id and sends the JSON-RPC response, with the answer as the tool's result, and Codex continues the same turn. If 15 minutes pass with no answer, the daemon sends a response telling the delegate to continue with the work that does not depend on the question. An answer that arrives later is sent to the delegate as a new message.

[click] This test covers the timeout. It starts a run with a one-second question timeout and waits for the run to reach the waiting state. TestClock.adjust moves Effect's clock forward one second, and the test checks that the question log ends with a Deferred entry marked timeout. Codex in these tests is a 117-line Node script that replays a scripted scenario over stdin and stdout.

IF ASKED
What if Claude is busy when the question arrives? The question stays pending in the run's question log, and foreman status lists it.
-->
