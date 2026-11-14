# Prose rules for this deck

Riley flagged the first drafts of these slides as AI slop (2026-11-13). These rules
apply to every string an audience member or the speaker reads: titles, card leads and
bodies, labels, chips, tags, figure captions, and the presenter notes. They are distilled
from two sources, which you should read in full before writing:

- the `ce:writer` skill and its `references/forbidden-patterns.md`
  (`~/.claude/plugins/cache/claude-essentials/ce/<newest>/skills/writer/`);
- `~/Projects/opendata/blog/.claude/rules/blog-writing.md`, sections "Two different
  defects both get called AI slop" and "Say it plainly", and the Phase 3b tests in
  `~/Projects/opendata/blog/.claude/skills/content-pipeline/SKILL.md`.

A clean `bun run lint` is not evidence the prose is good. The linter matches words. The
defects below are sentence shapes, and it cannot see them.

## Titles

Riley's rule: a title states what the slide is there to communicate, plainly. It does
not speak in metaphor and it does not approach the point sideways.

Test a title by asking what the slide teaches, then checking that the title says exactly
that in the words you would use to tell a colleague. If the title needs the slide to
explain it, it fails.

| Rejected | Why | Use |
| --- | --- | --- |
| Stacks hands the agent a brief and a finish line. | "finish line" is a metaphor for a verify command | Stacks briefs the agent and checks its work. |
| A held question is an unanswered request. | a riddle; names the mechanism without saying what happens | Codex waits until Claude answers its question. |
| rr gives every run its own machine. | "gives" personifies; vague about who and what | rr runs each agent's tests on its own machine. |
| I kept rr monitor open all day. | an anecdote standing in for the claim | StatGlass started as the rr monitor command. |
| A daemon sits between the two agents. | "sits between" is a spatial metaphor | foreman is a short-lived CLI and a daemon. |
| Decks rejects a sentence before it lands. | "lands" is a metaphor | A Decks hook blocks AI-sounding sentences. |
| Agents ask StatGlass what happened at 3pm. | coy; the slide is about a CLI | Agents read StatGlass history through a CLI. |
| Every tool I ship has two users. | withholds who the users are | My tools have two users: me and a coding agent. |
| Stacks prints one result three ways. | Riley: "pure AI slop". A tidy count contrast ("one X, three Y") that sounds clever and says nothing about what differs or for whom | Stacks output differs for people and agents. |
| One change passes through seven tools. | the same count contrast, plus "passes through" as a metaphor | I ship a change with seven tools I built. |
| Six habits carry across all seven tools. | count contrast again; "carry across" is a metaphor | All seven tools share the same six habits. |

Number play is its own tell: "one X, three Y", "two users, one tool", "then 8". A number
goes in a title only when the number is the fact being taught.

No wordplay, no callbacks, no rhetorical questions, no "the X that Y" constructions, no
abstract nouns where a product or a command has a name. One sentence, a period, 50
characters at most.

## Cards

A card lead is a plain statement of one fact. A card body adds the second fact a reader
needs, or the number. It never describes the picture, never repeats the title, and never
ends on a line that sums up or sounds wise.

| Rejected | Why | Use |
| --- | --- | --- |
| The agent cannot move the finish line. | metaphor | Stacks refuses to verify edited checks. ("The agent cannot change the checks" was also rejected: the agent can edit them, and verify then refuses to run.) |
| Layers wire it together once. | "wire" is a metaphor; "it" has no noun | One function composes the layers. |
| None of these tools calls a model. They are ordinary CLIs and one app. The agent support is in how they print. | negation opener, then a slogan | These are ordinary CLIs and one app. Agents can use them because of what they print. |
| If done is a feeling, the agent will feel done. | aphorism | (cut; say what the verify command checks) |

## Sentence shapes that are not allowed

Each of these has shipped in a draft of this deck or of the blog and been flagged.

- **Negation, then assertion.** "The agent did not decide it was finished. A command
  did." Nobody claimed the agent decided. Write the assertion: "A command decided when
  the work was finished."
- **Not X but Y, in any form.** "less about X, more about Y", "X, not Y" as a closing
  beat, "rather than". Say Y.
- **Setup, then reveal.** A first sentence that exists to make the second sound earned.
  "The last line is the part I like." Cut it and say the thing.
- **Clipped pairs.** Two short sentences that set up and resolve one idea ("The CLI
  exits. The daemon stays."). Join them: "The CLI exits and the daemon keeps running."
- **Characterizing instead of stating.** "the technical heart", "the payoff", "the part
  that matters", "the real question", "that is the whole prompt" when the prompt was
  just shown. State the fact or cut the sentence.
- **Triads.** Three parallel items for rhythm. Use the number of items there are.
- **Aphorisms and kickers.** A closing line that compresses the slide into a saying.
  End on the last fact.
- **Metaphor where a noun exists.** finish line, gate, wire, land, sit, hand off, heart,
  spine, lever. Name the command, the file, the process.
- **Personifying a tool.** A tool "knows", "decides", "wants", "tells you". Say what it
  prints, returns or checks.
- **Rhetorical questions.** None.
- **Colon reveals.** "That is the trick: ..." Say the fact after the colon as its own
  sentence, without the announcement.
- **Em dashes.** None.
- **Marketing words.** powerful, seamless, robust, simple, just, real (as praise),
  modern, magic, effortless.

## Presenter notes

Notes are what Riley says aloud, in first person. Write them the way he would explain
the slide to another engineer across a table.

- Every sentence adds a fact. Apply the deletion test to each one: name the specific fact
  it adds, and cut it if you cannot.
- Open each beat's paragraph on the point. No "So", "Now", "Here is where", "Let me show
  you", "What I want you to notice".
- Read each paragraph aloud. If a sentence sounds like a keynote or an advert, rewrite it
  as a plain statement.
- No recap of the previous slide and no preview of the next.
- Vary sentence length. A run of short declaratives of the same length reads as a machine.
- First person is for things Riley did or decided ("I built", "I run"). Do not invent
  feelings, anecdotes or opinions for him. If the outline marks something
  `FLAG: author-reported`, keep it to what the outline says.

## Before you report

List every visible string and every note paragraph you wrote, and for each one say which
of the shapes above you checked it against and what you changed. A string that survives
unchanged needs a reason. A fresh reviewer who did not write the deck will run the same
tests afterward, so the cheapest time to fix a sentence is now.
