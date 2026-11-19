# Working with an agent

Decks is built for coding agents: you describe a talk, the agent writes it as MDX and React files in your repo, checks its own work, and you refine it by asking. This page covers setup, the loop, how to prompt for four common jobs, and what keeps the result honest. The examples are turns from one scripted session, played on the repo's `examples/agent-hero` deck, whose team and figures are illustrative.

## Set up

Run `decks init` once in the project, then have each collaborator install the plugin:

```sh
bunx -p @steamfield/decks decks init
claude plugin install decks@steamfield --scope project
```

`decks init` enables the Decks Claude Code plugin, copies its skills to `.agents/skills/` for Codex, and adds a Decks section to `AGENTS.md`. The same skills work in Claude Code and Codex. See [`decks init`](cli.md#decks-init---force) for what it writes.

The plugin's skills load as the agent needs them: `working-with-decks` first, `building-a-deck` to scaffold and structure a talk, `writing-slides` for slide prose, `deck-data` for any figure, `deck-motion` for builds and transitions, `deck-design` and `visualization` for layout and charts.

## The loop

1. Describe the talk: who it is for, what it has to show, and the data it comes from.
2. Watch it with `decks dev <deck>` while the agent works. Slides reload as files change.
3. Ask for changes in plain sentences, one at a time. Name the slide and the result you want.
4. Before you present, check the figures: every number on a slide traces to a row in `data-sources.md` and a constant in `data/`, which `deck-data` requires.

## Create a deck from data

Hand the agent the data file and say what the talk has to show. A target slide count and the audience keep the first draft short.

```text transcript="agent-hero/draft"
> Turn build-times.csv into a 5-slide talk for Thursday's all-hands: our builds went from 14 minutes to 4.
Skill building-a-deck, deck-data
Read data/build-times.csv
Write data-sources.md, slides/02-cover.mdx … 06-close.mdx
Bash decks check
  ✓
Done. Five slides from the CSV: a cover, the weekly trend in three steps, the drop, the three changes and a close.
```

The agent records where each figure came from in `data-sources.md` before it writes a slide that shows one. A real first draft from your own data takes longer than this scripted turn: the agent reads the data, plans the story and checks each slide.

## Add a reel graphic

Quote the exact words you want on screen. The agent picks a motion template for the effect and keeps your words verbatim.

```text transcript="agent-hero/reel"
> Open with a reel: 'Builds were slow.', then 'flaky.', then 'fast.'
Write slides/07-reel.mdx (word-swap)
Bash decks check
  ✓
Done. The talk opens on a reel that swaps in slow., flaky. and fast.
```

```mdx demo="agent-hero/reel"
<MotionTemplate template="word-swap" accent="amber" lead={["Builds were"]} words={["slow.", "flaky.", "fast."]} />
```

See [motion templates](motion-templates.md) for every template and its limits.

## Refine an animation

Say what the slide should do differently and name a style if you have one in mind. "Scoreboard style" lands on `bar-board`; a word swap lands on `word-swap`.

```text transcript="agent-hero/chart"
> Make the drop hit harder: show what each change saved, scoreboard style.
Read data/changes.csv
Write slides/08-saved.mdx (bar-board)
Bash decks check
  ✓
Done. A scoreboard of the minutes each change saved, with cached deps leading at 5 of the 10.
```

```mdx demo="agent-hero/saved"
<MotionTemplate template="bar-board" accent="amber" rows={SAVED_ROWS} suffix=" min" source={SAVED_SOURCE} />
```

## Ask the agent to check its own work

Ask for a check at presenter size before you rehearse. `decks inspect` reports content that overflows the canvas or its own box at 1920x1080, `decks shot` screenshots a slide so the agent can look at the fix, and `decks lint` reports AI-rhetoric patterns in the prose. For a build, `decks film` captures one click's motion as a contact sheet.

```text transcript="agent-hero/check"
> Check every slide at presenter size.
Bash decks inspect agent-hero
  slide 6: clipped at the bottom
Edit slides/06-close.mdx
Bash decks shot agent-hero 6
Bash decks lint agent-hero
  ✓
Done. The close was clipped at the bottom, so it keeps three bullets and the rest moved to the notes.
```

```mdx demo="agent-hero/close-fitted"
<ul>
    <li>Pin new dependencies so the cache stays warm.</li>
    <li>Give slow tests their own shard.</li>
    <li>Build on the slim base image.</li>
  </ul>
```

## What keeps it honest

| Check | What it catches |
| --- | --- |
| `decks check` | The deck registry, configs, slide names and error-level prose |
| `decks lint` | AI-rhetoric patterns in slide prose, components and story cards |
| `decks shot`, `decks film` | What a slide looks like at presenter size, and the motion of one click |
| `decks inspect` | Content that overflows the canvas or its own box |
| The prose hooks | `decks init` wires a write hook that denies an edit adding an error-level pattern to deck prose, so the agent rewrites the sentence before it lands |
| `data-sources.md` | Every figure on a slide, with its source, query and date, as `deck-data` requires |

See the [CLI reference](cli.md) for each command's flags.
