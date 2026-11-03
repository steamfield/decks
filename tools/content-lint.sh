#!/bin/sh
# content-lint.sh: scan deck prose for AI-rhetoric patterns.
#
# Usage: content-lint.sh [--stdin] [--strict] [--errors-only] [alias|file...]
#
# A wrapper kept for the paths the docs name. The scanner is `decks lint`
# (packages/decks/scripts/lint.mjs over packages/decks/lint/scan.mjs), which
# reads the patterns from packages/decks/lint/ai-rhetoric-patterns.tsv. With no
# targets it scans every deck registered in decks.json: slides.md, pages/*.md,
# components/*.vue and each story stage's COPY array.
#
# Exit codes: 0 clean or warnings only, 1 an error hit (any hit with --strict),
# 2 the patterns file is missing. Relative file arguments resolve against the
# repo root, as they always did.
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT" || exit 2
exec node packages/decks/scripts/deck.mjs lint "$@"
