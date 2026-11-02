#!/bin/sh
# Kept for callers that run the hook by this path. The hook is
# `decks hook prompt` (packages/decks/scripts/hook.mjs), which
# .claude/settings.json runs directly.
root="$(cd "$(dirname "$0")/../.." && pwd)"
exec node "$root/packages/decks/scripts/deck.mjs" hook prompt
