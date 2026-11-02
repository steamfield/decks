#!/bin/bash
# UserPromptSubmit hook: inject the deck-writing reminder when a prompt asks
# to write or revise a deck. Wired from .claude/settings.json. Requires jq.
#
# Deck prose rules are NOT article rules: slide headlines are claims where
# article section titles are labels, and paragraph-scoped review has no
# referent on a bullet list. See .claude/rules/deck-writing.md.
#
# The regex runs FIRST, before any subprocess work, so normal turns pay nothing.

input=$(cat)
prompt=$(echo "$input" | jq -r '.prompt // empty')
[[ -z "$prompt" ]] && exit 0

# Deck-writing-flavored prompts. Requires INTENT: a writing verb near a deck
# noun (either order), so prompts that merely mention "slides" don't fire.
deck_verbs='(write|writ|draft|revis|edit|polish|build|author|make)'
deck_nouns='(\bdeck\b|\bslides?\b|\btalk\b|\bpresentation\b|\bslidev\b)'
deck_fires=false
if echo "$prompt" | grep -qiE "\b${deck_verbs}.{0,60}${deck_nouns}|${deck_nouns}.{0,60}\b${deck_verbs}"; then
  deck_fires=true
fi

# Revision mode. Once a deck is open, revision prompts stop naming it ("tighten
# this bullet", "the headline is weak"). Same reasoning as the blog hook: scoped
# to the git status of the deck pages, so it stops firing once work is committed.
if ! $deck_fires && echo "$prompt" | grep -qiE "\b(rewrite|reword|rephras|revis|trim|tighten|shorten|cut|polish|slop|headline|bullet|eyebrow|wording|phrasing|too (long|wordy|dense))"; then
  repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
  if [[ -n "$repo_root" ]] && [[ -n "$(git -C "$repo_root" status --porcelain -- 'examples' 'decks' 2>/dev/null | grep -E '/(pages|components)/|slides\.md')" ]]; then
    deck_fires=true
  fi
fi

$deck_fires || exit 0

read -r -d '' ctx <<'EOF'
Deck writing reminder (see .claude/rules/deck-writing.md):
- Slides are NOT short articles. The audience gets one pass at reading speed while someone talks over it. The slide carries only what must be read; the speaker carries the rest.
- Word budget: ~70 visible words on a normal slide (`examples/agent-experience` is the exemplar). A story card is eight words of lead, twenty of body. 150 means split the slide. Four figures means it is a bug.
- Headlines are CLAIMS, full sentences ending in a period ("Interview the agent like you'd interview a user."), not topic labels. This deliberately INVERTS the usual article section-title rule; do not carry article habits in. Same for chart titles: findings, not labels.
- Bullets: three per slide, one sentence each, parallel grammatical shape. A bullet that only makes sense next to its neighbor is one bullet.
- NO paragraphs. `od-lede` is for a single sentence. Three connected sentences go in speaker notes or across two slides.
- Anti-slop shapes carry over unchanged (`bun run lint` covers each deck's `pages/*.md`, `slides.md`, `components/*.vue`; `bun run test` covers story-card COPY): never "X is real", never characterize a finding instead of stating it, never negation-then-assertion, never an em dash. Catalog: .claude/rules/prose-patterns.md.
- Article rules that do NOT apply here: paragraph construction, leading each paragraph with its point, prose density, and paragraph-level structural review.
- Every figure traces to a query in `<deck>/data-sources.md` and a `<deck>/data/*.ts` constant (.claude/rules/deck-data.md). Deck fact-check runs the `fact-checking-a-deck` skill.
EOF

jq -n --arg ctx "$ctx" '{
  hookSpecificOutput: {
    hookEventName: "UserPromptSubmit",
    additionalContext: $ctx
  }
}'
exit 0
