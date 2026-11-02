#!/bin/bash
# content-lint.sh: scan deck prose for AI-rhetoric patterns.
#
# Usage: content-lint.sh [--stdin] [--strict] [--errors-only] [files...]
#
# --stdin     Read text from stdin (for hook use). Reports line numbers
#             relative to the input fragment.
# --strict    Treat warnings as errors (exit 1 on any hit).
# --errors-only  Suppress warn-severity hits from output.
#
# Default file set (when no files given and not --stdin), under examples/ and
# decks/:
#   <deck>/slides.md  <deck>/pages/*.md  <deck>/components/*.vue
# Excludes node_modules/**.
#
# This scans prose outside <script>, so a story deck's COPY arrays (inside a
# stage component's <script setup>) are not read here; beats.test.ts runs the
# same error patterns over every card's lead and body instead.
#
# Patterns live in tools/ai-rhetoric-patterns.tsv (one source of truth).
# Lines containing "lint-allow" are exempt. Specific IDs:
#   {/* lint-allow: em-dash, parallel-reveal */}
#   <!-- lint-allow: em-dash -->
# Or bare "lint-allow" to exempt all patterns on that line.

set -uo pipefail
export LC_ALL=C.UTF-8

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PATTERNS_FILE="$SCRIPT_DIR/ai-rhetoric-patterns.tsv"

mode_stdin=false
mode_strict=false
mode_errors_only=false
files=()

while [[ $# -gt 0 ]]; do
    case "$1" in
        --stdin) mode_stdin=true; shift ;;
        --strict) mode_strict=true; shift ;;
        --errors-only) mode_errors_only=true; shift ;;
        *) files+=("$1"); shift ;;
    esac
done

if [[ ! -f "$PATTERNS_FILE" ]]; then
    echo "error: patterns file not found: $PATTERNS_FILE" >&2
    exit 2
fi

# Prose extractor. Skips frontmatter (except description:, which is
# user-facing SEO/card copy), fences, script/style, HTML/JSX comments,
# imports. Emits "ORIGLINE\tALLOW_IDS\tTEXT" per prose line.
PROSE_AWK='
    function allowof(line,    a, rest) {
        a = ""
        if (index(line, "lint-allow") > 0) {
            if (match(line, /lint-allow[[:space:]]*([}\*]|-->|$)/))
                a = "*"
            else if (match(line, /lint-allow:[[:space:]]*/)) {
                rest = substr(line, RSTART + RLENGTH)
                gsub(/[[:space:]]*\*\/.*/, "", rest)
                gsub(/[[:space:]]*-->.*/, "", rest)
                gsub(/[[:space:]]*}.*/, "", rest)
                gsub(/[[:space:]]/, "", rest)
                a = rest
            }
        }
        return a
    }
    BEGIN { fm=0; fc=0; sc=0; cm=0; dl=0; dfm=0 }
    NR==1 && /^---[[:space:]]*$/ { fm=1; next }
    fm && /^---[[:space:]]*$/ { fm=0; next }
    fm && /^description:[[:space:]]*[>|]/ { dfm=1; next }
    fm && dfm && /^[[:space:]]/ { print NR "\t" allowof($0) "\t" $0; next }
    fm && dfm { dfm=0 }
    fm && /^description:/ { print NR "\t" allowof($0) "\t" $0; next }
    fm { next }
    /^[[:space:]]*(```|~~~)/ { fc = !fc; next }
    fc { next }
    /^[[:space:]]*<script/ { sc=1; next }
    /^[[:space:]]*<\/script>/ { sc=0; next }
    /^[[:space:]]*<style/ { sc=1; next }
    /^[[:space:]]*<\/style>/ { sc=0; next }
    sc { next }
    /\{\/\*.*\*\/\}/ && !/lint-allow/ { next }
    /<!--.*-->/ && !/lint-allow/ { next }
    /^[[:space:]]*\{\/\*/ && !/\*\/\}/ { cm=1; next }
    cm && /\*\/\}/ { cm=0; next }
    /^[[:space:]]*<!--/ && !/-->/ { cm=1; next }
    cm && /-->/ { cm=0; next }
    cm { next }
    /^[[:space:]]*(import |export )/ { next }
    /^[[:space:]]*-[[:space:]]+\[/ { next }
    /^[[:space:]]*-[[:space:]]+\[`/ { next }
    /<Disclosure/ { dl=1; next }
    /<\/Disclosure/ { dl=0; next }
    dl { next }
    # A line that opens with a tag: slide text sits inline in markup
    # (<h2 class="od-h2">Claim.</h2>, <template #lede>...</template>), so keep
    # the text between tags rather than skipping the line. Tags, an unclosed
    # trailing tag and {{ }} interpolations are dropped; allow ids are read
    # before the strip removes the comment that carries them.
    /^[[:space:]]*<[A-Za-z\/]/ {
        a = allowof($0)
        gsub(/<[^>]*>/, ""); gsub(/<[^>]*$/, ""); gsub(/\{\{[^}]*\}\}/, "")
        if ($0 !~ /[^[:space:]]/) next
        print NR "\t" a "\t" $0; next
    }
    /description=/ { next }
    /<\/a>/ { gsub(/<a( [^>]*)?>/, ""); gsub(/<\/a>/, "") }
    /^[[:space:]]*\{/ { next }
    { print NR "\t" allowof($0) "\t" $0 }
'
export PROSE_AWK

HITS_DIR="$(mktemp -d -t content-lint-hits.XXXXXX)"
trap 'rm -rf "$HITS_DIR"' EXIT

# _scan_one: self-contained per-file scanner, callable from xargs.
# Args: <filename> <patterns_file> <hits_dir> <errors_only>
# Reads file content from the resolved path (not stdin) for xargs compat.
_scan_one() {
    local filename="$1" patterns_file="$2" hits_dir="$3" errors_only="$4"
    local repo_root="$5"

    local local_path="$filename"
    if [[ "$filename" != /* ]]; then
        local_path="$repo_root/$filename"
    fi
    [[ -f "$local_path" ]] || return 0

    # Extract prose via the shared extractor (PROSE_AWK, defined at top).
    local prose
    prose="$(awk "$PROSE_AWK" < "$local_path")"

    [[ -z "$prose" ]] && return 0

    local found_sev=""
    local output=""

    while IFS=$'\t' read -r id sev ere msg; do
        [[ -z "$id" || "$id" == \#* ]] && continue
        [[ "$errors_only" == "true" && "$sev" == "warn" ]] && continue

        # Single grep per pattern across all prose lines (not per-line)
        while IFS= read -r hit_line; do
            [[ -z "$hit_line" ]] && continue

            local origline allow_ids text rest
            origline="${hit_line%%	*}"
            rest="${hit_line#*	}"
            allow_ids="${rest%%	*}"
            text="${rest#*	}"

            [[ "$allow_ids" == "*" ]] && continue
            if [[ -n "$allow_ids" ]]; then
                echo ",$allow_ids," | grep -q ",$id," && continue
            fi

            local match
            match=$(echo "$text" | grep -oE ".{0,30}($ere).{0,30}" | head -1)
            output+="$filename:$origline [$id] \"$match\" -> $msg"$'\n'
            found_sev+="$sev"$'\n'
        done < <(echo "$prose" | grep -E "$ere")
    done < "$patterns_file"

    [[ -n "$output" ]] && printf '%s' "$output"

    if [[ -n "$found_sev" ]]; then
        printf '%s' "$found_sev" > "$hits_dir/hit.$$.$RANDOM"
    fi
}
export -f _scan_one

NPROC=$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo 4)

if $mode_stdin; then
    # For stdin mode, write to temp file and scan it
    tmp_stdin="$(mktemp -t content-lint-stdin.XXXXXX)"
    cat > "$tmp_stdin"
    _scan_one "$tmp_stdin" "$PATTERNS_FILE" "$HITS_DIR" "$mode_errors_only" "$REPO_ROOT"
    rm -f "$tmp_stdin"
else
    if [[ ${#files[@]} -eq 0 ]]; then
        while IFS= read -r -d '' f; do
            files+=("$f")
        done < <(
            cd "$REPO_ROOT" || exit 1
            {
                find examples decks -mindepth 2 -maxdepth 2 -name 'slides.md' -print0 2>/dev/null
                find examples decks -path '*/pages/*.md' -not -path '*/node_modules/*' -print0 2>/dev/null
                find examples decks -path '*/components/*.vue' -not -path '*/node_modules/*' -print0 2>/dev/null
            } | sort -z
        )
    fi

    printf '%s\0' "${files[@]}" | \
        xargs -0 -P "$NPROC" -I{} \
        bash -c '_scan_one "$@"' _ {} "$PATTERNS_FILE" "$HITS_DIR" "$mode_errors_only" "$REPO_ROOT"
fi

had_error=false
had_warn=false
if ls "$HITS_DIR"/hit.* &>/dev/null; then
    cat "$HITS_DIR"/hit.* | grep -q 'error' && had_error=true
    cat "$HITS_DIR"/hit.* | grep -q 'warn' && had_warn=true
fi

if $had_error; then
    exit 1
elif $had_warn && $mode_strict; then
    exit 1
else
    exit 0
fi
