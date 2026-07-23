#!/bin/sh
set -eu

temp_file="$(mktemp)"
trap 'rm -f "$temp_file"' EXIT

./node_modules/.bin/supabase gen types typescript --linked > "$temp_file"
mv "$temp_file" lib/supabase/database.types.ts
trap - EXIT
