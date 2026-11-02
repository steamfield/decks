#!/bin/bash
# Payload-shape tests for the two deck hooks: lint-ai-rhetoric.sh (PreToolUse
# on Edit/Write/MultiEdit) and user-prompt-submit.sh (UserPromptSubmit).
#
# Every case feeds the hook the real payload shape (`.tool_input.file_path`,
# `.tool_input.content`, `.prompt`), so a hook that reads the wrong field fails
# here instead of silently no-oping in a session. Requires jq.
#
# Run:  bun run test:hooks   (or bash .claude/hooks/tests/run-hook-tests.sh)
# Exit: 0 = all pass, 1 = a failure.

set -uo pipefail
HOOKS_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$HOOKS_DIR/../.." || exit 1

TEST_LOG="$(mktemp -t hook-tests.XXXXXX)"
trap 'rm -f "$TEST_LOG"' EXIT

ok()  { printf '  ok   - %s\n' "$1" | tee -a "$TEST_LOG"; }
bad() { printf '  FAIL - %s\n     %s\n' "$1" "$2" | tee -a "$TEST_LOG"; }

echo "== lint-ai-rhetoric.sh =="

write_payload() { jq -n --arg p "$1" --arg c "$2" '{tool_name:"Write", hook_event_name:"PreToolUse", tool_input:{file_path:$p, content:$c}}'; }
edit_payload() { jq -n --arg p "$1" --arg s "$2" '{tool_name:"Edit", hook_event_name:"PreToolUse", tool_input:{file_path:$p, old_string:"old text", new_string:$s}}'; }
multiedit_payload() { jq -n --arg p "$1" --arg s "$2" '{tool_name:"MultiEdit", hook_event_name:"PreToolUse", tool_input:{file_path:$p, edits:[{old_string:"old", new_string:$s}]}}'; }

# run_hook_raw <json> <hook path> -> sets $OUT, $ERR, $RC
run_hook_raw() {
    local errfile; errfile=$(mktemp)
    OUT=$(echo "$1" | bash "$2" 2>"$errfile")
    RC=$?
    ERR=$(cat "$errfile"); rm -f "$errfile"
}

LINT="$HOOKS_DIR/lint-ai-rhetoric.sh"

assert_deny() {
    run_hook_raw "$1" "${3:-$LINT}"
    local d; d=$(echo "$OUT" | jq -r '.hookSpecificOutput.permissionDecision // empty' 2>/dev/null)
    [[ "$d" == "deny" ]] && ok "$2" || bad "$2" "expected deny, got decision='$d' rc=$RC out=${OUT:0:120}"
}

assert_not_deny() {
    run_hook_raw "$1" "${3:-$LINT}"
    local d; d=$(echo "$OUT" | jq -r '.hookSpecificOutput.permissionDecision // "none"' 2>/dev/null)
    [[ "$d" != "deny" && $RC -eq 0 ]] && ok "$2" || bad "$2" "expected pass, got decision='$d' rc=$RC out=${OUT:0:120}"
}

assert_deny "$(write_payload 'examples/agent-experience/pages/03-interview.md' 'This has an em — dash.')" "denies em-dash in an example page (Write)"
assert_deny "$(edit_payload 'decks/my-talk/pages/02-point.md' "Here's the thing about tides.")" "denies banned phrase in a decks/ page (Edit)"
assert_deny "$(multiedit_payload 'decks/my-talk/slides.md' 'A seamless data experience.')" "denies AI vocab in slides.md (MultiEdit)"
assert_deny "$(write_payload 'decks/my-talk/components/TideStage.vue' "<template>
  <p class=\"od-lede\">
    It's not just about water.
  </p>
</template>")" "denies not-just-reveal in a deck component's template text"
assert_deny "$(write_payload "$PWD/decks/my-talk/pages/01-cover.md" 'An em — dash.')" "denies with an absolute path"
assert_deny "$(edit_payload 'decks/my-talk/pages/01-cover.md' '  <template #lede>Tides are a seamless dance.</template>')" "denies prose inline in a one-line tag (StoryCover slot)"
assert_deny "$(edit_payload 'decks/my-talk/pages/03.md' '<h2 class="od-h2">At its core, the cache wins.</h2>')" "denies prose inline in a heading tag"
assert_not_deny "$(edit_payload 'decks/my-talk/pages/03.md' '<div class="od-twocol" style="gap: 2rem;">')" "allows a tag-only line"
assert_not_deny "$(edit_payload 'decks/my-talk/pages/03.md' '<p>Quoted — verbatim.</p> <!-- lint-allow: em-dash -->')" "honors lint-allow on a tag line"
assert_deny "$(write_payload '/Users/test/.claude/worktrees/foo/examples/x/pages/01.md' 'An em — dash.')" "denies with a worktree-prefixed path"

assert_not_deny "$(write_payload 'packages/decks/components/StoryCard.vue' 'This has an em — dash.')" "allows the addon's own components (out of scope)"
assert_not_deny "$(write_payload 'README.md' 'This has an em — dash.')" "allows files outside deck dirs"
assert_not_deny "$(write_payload 'decks/node_modules/pkg/pages/x.md' 'leverage everything — seamless')" "allows node_modules paths"
assert_not_deny "$(write_payload 'decks/my-talk/data/tides.ts' 'export const X = 1 // seamless')" "allows data modules (not prose)"

_fence=$(jq -n --arg p 'decks/my-talk/pages/02.md' '{tool_name:"Write", hook_event_name:"PreToolUse", tool_input:{file_path:$p, content:"Normal prose.\n```\ncode with — dashes\n```\nMore prose."}}')
assert_not_deny "$_fence" "allows em-dash inside a code fence"
_script=$(jq -n --arg p 'decks/my-talk/components/TideStage.vue' '{tool_name:"Write", hook_event_name:"PreToolUse", tool_input:{file_path:$p, content:"<script setup lang=\"ts\">\nconst COPY = [{ lead: \"seamless — tides\" }]\n</script>\n<template><div /></template>"}}')
assert_not_deny "$_script" "skips <script> (COPY is beats.test.ts's job)"
assert_not_deny "$(write_payload 'decks/my-talk/pages/02.md' 'Direct quote with — dash <!-- lint-allow: em-dash -->')" "allows em-dash with a lint-allow marker"
assert_not_deny "$(write_payload 'decks/my-talk/pages/02.md' 'In other words, the cost is high.')" "allows warn-only content (colon-reveal)"
_fm=$(jq -n --arg p 'decks/my-talk/slides.md' '{tool_name:"Write", hook_event_name:"PreToolUse", tool_input:{file_path:$p, content:"---\ntitle: \"A seamless deck\"\n---\nClean prose here."}}')
assert_not_deny "$_fm" "allows AI vocab in frontmatter (skipped)"
assert_not_deny '{"tool_name":"Read","tool_input":{"file_path":"decks/x/pages/01.md"}}' "ignores non-write tools"

# A missing scanner refuses the write instead of allowing it unlinted.
_tmp=$(mktemp -d)
mkdir -p "$_tmp/.claude/hooks"
cp "$LINT" "$_tmp/.claude/hooks/"
run_hook_raw "$(write_payload 'decks/my-talk/pages/02.md' 'Clean prose.')" "$_tmp/.claude/hooks/lint-ai-rhetoric.sh"
[[ $RC -eq 2 && "$ERR" == *"cannot find an executable scanner"* ]] && ok "blocks (exit 2) when tools/content-lint.sh is missing" \
    || bad "blocks when the scanner is missing" "rc=$RC err=${ERR:0:120}"
rm -rf "$_tmp"

echo "== user-prompt-submit.sh =="

UPS="$HOOKS_DIR/user-prompt-submit.sh"
run_ups() {
    local out
    out=$(jq -n --arg p "$1" '{hook_event_name:"UserPromptSubmit", prompt:$p}' | bash "$UPS" 2>/dev/null)
    UPS_RC=$?
    UPS_CTX=$(echo "$out" | jq -r '.hookSpecificOutput.additionalContext // empty' 2>/dev/null)
}
assert_ups_fires() {
    run_ups "$1"
    [[ $UPS_RC -eq 0 && "$UPS_CTX" == *"Deck writing reminder"* ]] && ok "$2" || bad "$2" "expected reminder, rc=$UPS_RC ctx=${UPS_CTX:0:80}"
}
assert_ups_silent() {
    run_ups "$1"
    [[ $UPS_RC -eq 0 && -z "$UPS_CTX" ]] && ok "$2" || bad "$2" "expected silence, rc=$UPS_RC ctx=${UPS_CTX:0:80}"
}

assert_ups_fires "make a 5-slide story deck about tides" "fires on make + deck"
assert_ups_fires "Draft the slides for my talk" "fires on draft + slides"
assert_ups_fires "the presentation needs a rewrite, can you revise it" "fires on noun before verb"
assert_ups_silent "why does the dev server log a warning on slide 3" "silent on a slide mention with no writing verb"
assert_ups_silent "bump vitest to the latest version" "silent on unrelated work"
assert_ups_silent "" "silent on an empty prompt"
[[ "$(run_ups 'write a deck'; echo "$UPS_CTX")" == *".claude/rules/deck-writing.md"* ]] && ok "reminder points at this repo's deck-writing rule" \
    || bad "reminder points at this repo's deck-writing rule" "ctx=${UPS_CTX:0:80}"

echo "== settings.json wiring =="

_settings=".claude/settings.json"
for _h in lint-ai-rhetoric.sh user-prompt-submit.sh; do
    if jq -e --arg h "$_h" '[.. | .command? // empty | select(contains($h))] | length > 0' "$_settings" >/dev/null 2>&1; then
        ok "$_h is wired in $_settings"
    else
        bad "$_h is wired in $_settings" "no hook command mentions it"
    fi
    [[ -x "$HOOKS_DIR/$_h" ]] && ok "$_h is executable" || bad "$_h is executable" "chmod +x it"
done

echo ""
total_pass=$(grep -c '^  ok   -' "$TEST_LOG" 2>/dev/null); total_pass=${total_pass:-0}
total_fail=$(grep -c '^  FAIL -' "$TEST_LOG" 2>/dev/null); total_fail=${total_fail:-0}
echo "Results: $total_pass passed, $total_fail failed"
[[ "$total_fail" -eq 0 ]]
