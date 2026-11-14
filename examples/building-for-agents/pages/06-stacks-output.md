<!--
SLIDE 6 · STACKS OUTPUT: one failed verify recorded for a person, an agent and a script, then the exit table
-->

<StacksOutputStage />

<!--
ABOUT THIS SLIDE
Three recordings of the same failed stacks verify, made on November 13 with stacks 0.7.0 in a scratch project that had not been built: on a terminal, with an agent marker in the environment, and with the JSON flag. The tiles on the last beat are the exit table from the CLI's output reference.
Source: data/sources/06-stacks-output.md.

SAY (opening)
This is a failed stacks verify on my terminal. Passed steps are green and failed steps are pink, each failed step is followed by the lines that broke, and the last line says what to do next. Stacks prints this format only when stdout is a terminal, no agent is detected and CI is not set.

[click] This is the same command with CLAUDECODE set, which is the variable Claude Code puts in the environment. The report has no colour codes, and stderr gets one short line as each step starts in place of the step's live output. Stacks picks this format without a flag, by checking the environment for the variables each agent sets and for AI_AGENT, the cross-agent convention. It also prints this format when stdout is a pipe or CI is set.

[click] With the JSON flag, stdout is one JSON object, and stacks schema prints the JSON Schema for it. When the command fails, the last line of stderr is an error envelope with a tag, a message, a retryable flag and a next field. The next field is a sentence for the caller. For a failed verify it says to fix the code or config the steps exercise and to leave the steps alone.

[click] Each exit code has one meaning, and the table is in the docs. 2 means fix the input, 4 means retry later, 5 means read the verify report on stdout, and 6 means ask a person. An agent can branch on the number without parsing the text, and the docs say a published code never changes meaning.

IF ASKED
Why not always print JSON? People run these commands too. All three formats are rendered from the same result value.
What exits 6? A write the CLI refuses, a failed update, or an agent passing the flag that accepts changed verify steps.
-->
