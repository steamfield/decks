#!/bin/sh
# Kept for callers that run the hook by this path (site/scripts/hook.mjs). The
# hook is `decks hook lint` (packages/decks/scripts/hook.mjs), which
# .claude/settings.json runs directly. A failure to start it refuses the write
# (exit 2) rather than letting deck prose through unlinted.
root="$(cd "$(dirname "$0")/../.." && pwd)"
# The hook judges paths relative to the project, which Claude Code names in
# CLAUDE_PROJECT_DIR; a caller outside Claude Code gets this repo.
export CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$root}"
node "$root/packages/decks/scripts/deck.mjs" hook lint || exit 2
