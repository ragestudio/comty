#!/bin/bash
set -euo pipefail

OUT_DIR=$(pwd)/dist
TSC_BIN=./node_modules/.bin/tsc
TSC_ALIAS_BIN=./node_modules/.bin/tsc-alias

APPLY_TEMP_JSON() {
    mv "$OUT_DIR/package.json.tmp" "$OUT_DIR/package.json"
}

# check if dist directory exists, if exists, remove it
if [ -d "$OUT_DIR" ]; then
  rm -rf "$OUT_DIR"
fi

# First compile and resolve paths & aliases
$TSC_BIN && printf "TypeScript build completed.\n"
$TSC_ALIAS_BIN -f && printf "TypeScript alias computed.\n"

cp package.json $OUT_DIR/package.json

jq '.main = "./lib/index.js" | .types = "./lib/index.d.ts"' "$OUT_DIR/package.json" > "$OUT_DIR/package.json.tmp"
APPLY_TEMP_JSON

jq 'del(.scripts)' "$OUT_DIR/package.json" > "$OUT_DIR/package.json.tmp"
APPLY_TEMP_JSON

jq '.exports |= map_values(sub("^\\./src/"; "./lib/") | sub("\\.ts$"; ".js"))' "$OUT_DIR/package.json" > "$OUT_DIR/package.json.tmp"
APPLY_TEMP_JSON

ls -la $OUT_DIR

printf "✅ Build & Packaged completed.\n"
