#!/usr/bin/env bash
# Reads the hook's JSON from stdin, extracts the edited file path,
# and runs prettier on just that one file.
# `pnpm exec` needs to run from inside the workspace, so cd there using this
# script's own location -- don't rely on the invoking shell's cwd.
cd "$(dirname "$0")/.." || exit 0
input=$(cat)
file=$(printf '%s' "$input" | sed -n 's/.*"file_path" *: *"\([^"]*\)".*/\1/p')
[ -n "$file" ] && [ -f "$file" ] && pnpm exec prettier --write --ignore-unknown "$file" 2>/dev/null
exit 0
