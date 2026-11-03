#!/bin/sh
# Written by `decks init` (slidev-addon-decks). .claude/settings.json runs it as
# `decks.sh hook lint` before Edit, Write and MultiEdit, and as
# `decks.sh hook prompt` on prompt submit; both pass the hook payload on stdin
# to the installed package's `decks hook` command.
#
# Without the package (a fresh clone before install, or after uninstalling it)
# `hook lint` refuses writes to deck prose under the deck directory, which it
# cannot lint, and allows every other write; `hook prompt` does nothing. To stop
# using Decks, remove the two decks.sh entries from .claude/settings.json.

cli="$CLAUDE_PROJECT_DIR"/{{pkg}}/scripts/deck.mjs
if [ -f "$cli" ]; then
  # Exit 2 when node itself fails: Claude Code treats any other failure as non-blocking.
  if [ "$2" = lint ]; then node "$cli" "$@" || exit 2; exit 0; fi
  exec node "$cli" "$@"
fi
[ "$2" = lint ] || exit 0

# The payload's file_path, made relative to the project, or to the worktree
# under .claude/worktrees/ it sits in (a checkout of its own).
path=$(sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n 1)
base=$CLAUDE_PROJECT_DIR
path=${path#"$base"/}
case "$path" in
  .claude/worktrees/*/*)
    rest=${path#.claude/worktrees/}
    base=$base/.claude/worktrees/${rest%%/*}
    path=${rest#*/} ;;
esac
case "$path" in
  /* | node_modules/* | */node_modules/*) exit 0 ;;
esac

# Deck prose is <root>/<deck>/slides.md, pages/*.md or components/*.vue, with
# <deck> one directory. At the project root (decksDir ".") <deck> must also
# hold a slides.md, so src/components is not a deck.
root={{decksDir}}
if [ "$root" != . ]; then
  case "$path" in
    "$root"/*) path=${path#"$root"/} ;;
    *) exit 0 ;;
  esac
fi
deck=${path%%/*}
[ "$deck" != "$path" ] || exit 0
case "${path#*/}" in
  slides.md) ;;
  pages/*.md | components/*.vue) [ "$root" != . ] || [ -f "$base/$deck/slides.md" ] || exit 0 ;;
  *) exit 0 ;;
esac
echo "BLOCKED: slidev-addon-decks is not installed; deck prose can't be linted. Install it, or remove the decks hooks from .claude/settings.json." >&2
exit 2
