<!--
SLIDE 17 · DECKS: the slide shows its own source, a recorded hook denial, and a count of the deck's sourced figures
-->

<DecksStage />

<!--
ABOUT THIS SLIDE
The code on the left is this slide's own source, read from the component file at build time. The terminal that replaces it replays site/fixtures/hook-denial.json: a test line sent to the write hook, and the hook's answer. The pattern counts come from the lint's pattern file and the figure count from this deck's source tables, all computed at build time.
Source: data/sources/17-decks.md.

SAY (opening)
Decks is the tool these slides are built with. It is an addon for Slidev, and each slide is a Vue component that drives a GSAP timeline. The code on the left is this slide's own source, read from its file when the deck was built. Each beat call marks a point on the timeline, and a click seeks to the next one. The three dots on the right are this slide's beats, and the ring is on the beat the timeline is at. Stepping back plays the same tweens in reverse, so every beat can be reached from either side.

[click] Decks also has a hook that runs before an agent writes a file. The terminal shows a recorded run of it. The input was a test sentence containing two stock phrases, and the hook denied the write and printed the two pattern ids. The lint has twenty-seven patterns. Five are errors, which the hook refuses, and twenty-two are warnings that appear only in the lint report.

[click] Each figure in this deck has a row in a sources file that names the file or command it came from. The number on the right is the count of those rows, computed when the deck was built. The outline for this talk gave the OpenChart engine as fifty thousand and ninety-seven lines. The command returned fifty thousand three hundred and sixty-nine when the slide was built, and the slide uses that.

IF ASKED
Where do the patterns come from? A TSV file in the Decks package, with one regular expression per row.
-->
