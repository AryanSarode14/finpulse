#!/usr/bin/env bash
# Reads the hook's JSON from stdin, extracts the edited file path,
# and runs prettier on just that one file.
input=$(cat)
file=$(printf '%s' "$input" | sed -n 's/.*"file_path" *: *"\([^"]*\)".*/\1/p')
[ -n "$file" ] && [ -f "$file" ] && pnpm exec prettier --write --ignore-unknown "$file" 2>/dev/null
exit 0
