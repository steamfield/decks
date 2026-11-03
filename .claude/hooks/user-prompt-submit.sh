#!/bin/sh
# Kept for callers that run the hook by this path. The hook is
# `decks hook prompt` (packages/decks/scripts/hook.mjs), which
# .claude/settings.json runs directly.
root="$(cd "$(dirname "$0")/../.." && pwd)"
# The hook judges paths relative to the project, which Claude Code names in
# CLAUDE_PROJECT_DIR; a caller outside Claude Code gets this repo.
export CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$root}"
exec node "$root/packages/decks/scripts/deck.mjs" hook prompt
