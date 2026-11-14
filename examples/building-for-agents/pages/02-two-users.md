<!--
SLIDE 2 · TWO USERS: one rr command on two monitors, as a person sees it and as an agent reads it
-->

<TwoUsersStage />

<!--
ABOUT THIS SLIDE
Both monitors are recordings of rr running OpenData's test suite on November 2. The left is the summary rr prints with the pretty flag. The right shows the bytes of that output, then the JSON events rr prints without the flag. The capture script runs the command twice, 32 minutes apart, so the totals differ: two of eight tasks failed in the pretty run and three in the JSON run.
Source: data/sources/02-two-users.md.

SAY (opening)
My tools have two users, and the first one is me. This is rr running OpenData's test suite across three machines with the pretty flag. It prints one line per task, with the host and the time, and a totals line at the end. I read the totals, see that two tasks failed, and scroll up to those two. Designing this view is developer experience.

[click] The second user is a coding agent, and it receives the whole stream. This pane is the same output as bytes, with the escape character written out. Each coloured value in the test log is wrapped in two escape sequences. My terminal turns them into colour, and an agent reading a pipe gets them as text that takes up room in its context.

[click] Without the pretty flag, rr prints JSON. It writes one event per phase to stderr and ends with one result event, which holds the status, the exit code and each failing test with its file and message. JSON is the default, and a person adds the flag. Designing this output is agent experience.

IF ASKED
Why do the two sides show different totals? The capture script runs the suite twice, once per format, 32 minutes apart. The end-to-end task failed in the first run and passed in the second.
-->
