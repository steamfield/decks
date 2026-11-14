## Slide 17: A Decks hook blocks AI-sounding sentences.

Everything on this slide is computed at build time from files in this repository (read 2026-11-13, commit 811fe91).

| Figure | Value | Source |
|---|---|---|
| The code on beat 0 | this stage's `useStage` call | `components/DecksStage.vue`, the lines between its `excerpt:start` and `excerpt:end` comments, read with a `?raw` import of the file itself |
| DENIAL | the write, the hook command, `deny`, and the hook's lines | `site/fixtures/hook-denial.json`, imported directly. `site/scripts/capture-hook.mjs` wrote it by sending the write hook one planted line; `site/src/content-drift.test.ts` reruns the hook and fails if the answer changes. The pane's tag says "test input" |
| DENIAL_RECORDED | 2026-11-02 | `git log -1 --format=%ad --date=short -- site/fixtures/hook-denial.json` (commit 09198b7). The fixture itself carries no date |
| DENIAL_RULES | banned-phrase, ai-vocab | the fixture's `rules` |
| PATTERNS | 27 | rows of `packages/decks/lint/ai-rhetoric-patterns.tsv`, parsed as `loadPatterns` in `packages/decks/lint/scan.mjs` parses them; computed at build |
| DENIED | 5 | the rows whose severity is `error`: em-dash, banned-phrase, not-just-reveal, ai-vocab, inflated-significance. The file's header says the write hook denies an error row |
| Notes: 22 warnings | 22 | PATTERNS minus DENIED |
| SOURCED_FIGURES | computed at build | distinct table rows (header and separator rows left out) in `data-sources.md` and `data/sources/*.md`. It counts every table row, including claim rows and the banned-content table once that exists |
| "a Vue component on a GSAP timeline" | claim | `packages/decks/story/easings.ts` exports `gsap`; `useStage` in `packages/decks/story/stage.ts` |
| Notes: the engine count in the outline against the derived one | 50,097 and 50,369 | `OUTLINE.md` line 545; `data/16-openchart.ts` PACKAGES |

Left out: the outline's note that the drafting agent "was refused more than once". No denial was recorded during this build.
