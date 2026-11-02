#!/bin/bash
# PreToolUse hook: deny Edit/Write/MultiEdit of deck prose containing
# AI-rhetoric patterns (error severity only).
#
# Denies via the standard permissionDecision JSON. Warns are not blocked (they
# show up in `bun run lint` only). Requires jq.
#
# Edit fragments lose fence/frontmatter context (accepted risk). Use lint-allow
# on the offending line if a false positive occurs.
#
# A story deck's card copy lives in <script> (COPY arrays), which the scanner
# skips; beats.test.ts runs the same error patterns over it instead.

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // empty')
case "$tool_name" in
    Edit|Write|MultiEdit) ;;
    *) exit 0 ;;
esac

# Extract file path
file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
[[ -z "$file_path" ]] && exit 0

# Scope: deck pages, slides.md and deck-local components under examples/ and
# decks/, as absolute or repo-relative paths. Never node_modules.
in_scope=false
case "$file_path" in
    */node_modules/*|node_modules/*) ;;
    */examples/*/pages/*.md|examples/*/pages/*.md) in_scope=true ;;
    */examples/*/slides.md|examples/*/slides.md) in_scope=true ;;
    */examples/*/components/*.vue|examples/*/components/*.vue) in_scope=true ;;
    */decks/*/pages/*.md|decks/*/pages/*.md) in_scope=true ;;
    */decks/*/slides.md|decks/*/slides.md) in_scope=true ;;
    */decks/*/components/*.vue|decks/*/components/*.vue) in_scope=true ;;
esac
$in_scope || exit 0

# Extract the text being written
if [[ "$tool_name" == "Edit" ]]; then
    text=$(echo "$input" | jq -r '.tool_input.new_string // empty')
elif [[ "$tool_name" == "Write" ]]; then
    text=$(echo "$input" | jq -r '.tool_input.content // empty')
elif [[ "$tool_name" == "MultiEdit" ]]; then
    text=$(echo "$input" | jq -r '[.tool_input.edits[]?.new_string // empty] | join("\n")')
fi
[[ -z "$text" ]] && exit 0

# Run scanner (errors only). The scanner sits at tools/ relative to the repo
# root, two levels above this file. A missing scanner blocks the write rather
# than letting unlinted prose through.
scanner="$(cd "$(dirname "$0")/../.." && pwd)/tools/content-lint.sh"
if [[ ! -x "$scanner" ]]; then
    echo "BLOCKED: lint-ai-rhetoric.sh cannot find an executable scanner at $scanner, so this write to deck prose is refused rather than allowed unlinted. Restore tools/content-lint.sh (chmod +x)." >&2
    exit 2
fi
hits=$(printf '%s' "$text" | "$scanner" --stdin --errors-only 2>/dev/null)
[[ -z "$hits" ]] && exit 0

reason="BLOCKED: AI-rhetoric patterns found in prose.

$hits

Line numbers refer to the NEW text being written. Rewrite the flagged
phrasing (don't synonym-swap). A rewrite that keeps the same sentence
skeleton with new words still reads as AI; change the structure, or
just state the fact plainly. If a hit is a legitimate direct quote,
append the lint-allow marker to that exact line:
  md/vue: <!-- lint-allow: pattern-id -->
  ts: // lint-allow: pattern-id"

jq -n --arg r "$reason" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: $r
  }
}'
exit 0
