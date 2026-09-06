#!/usr/bin/env bash
# CI perf budget: fail the build if the app's payload outgrows its limits.
#
# Why these numbers (set 2026-09, at ~1.3 MB of code + 1.35 MB of fonts):
#   APK        limit 4 MiB   — release is 3.14 MiB / debug 3.23 MiB; ~27%
#                            headroom for real code growth, catches any new
#                            heavyweight asset before it ships.
#   JS (gzip)  limit 96 KiB  — currently 74.6 KiB; a new bundled font is worth
#                            ~120 KiB raw, so this trips the moment one lands
#                            in the JS graph or a dependency piles on.
#   CSS (gzip) limit 12 KiB  — currently 8.6 KiB; headroom for the motion
#                            system, tight enough to catch accidental bloat.
#
# Every limit can be overridden via env var for experiments:
#   MAX_APK_BYTES / MAX_JS_GZIP_BYTES / MAX_CSS_GZIP_BYTES
#
# Usage:
#   scripts/check-perf-budget.sh <apk> <dist-dir>
#   scripts/check-perf-budget.sh app-release.apk dist
# (In CI: APK = android/app/build/outputs/apk/debug/app-debug.apk, dist = dist.)

set -u

APK="${1:?usage: check-perf-budget.sh <apk> <dist-dir>}"
DIST="${2:?usage: check-perf-budget.sh <apk> <dist-dir>}"

fail=0
bytes_human() {
  local b=$1
  if [ "$b" -ge 1048576 ]; then
    awk -v b="$b" 'BEGIN { printf "%.2f MiB", b / 1048576 }'
  else
    awk -v b="$b" 'BEGIN { printf "%.1f KiB", b / 1024 }'
  fi
}

check() {
  # check <label> <actual-bytes> <limit-bytes> <human-extra>
  local label=$1 actual=$2 limit=$3
  if [ "$actual" -le "$limit" ]; then
    echo "  ok    $label: $(bytes_human "$actual") / budget $(bytes_human "$limit")"
  else
    local over=$((actual - limit))
    echo "  FAIL  $label: $(bytes_human "$actual") exceeds the $(bytes_human "$limit") budget by $(bytes_human "$over")"
    echo "        Trim the payload or consciously raise the budget (env var in scripts/check-perf-budget.sh) with a note in the commit message."
    fail=1
  fi
}

echo "Perf budget (APK: $APK, bundle: $DIST)"

# ---- APK ----
if [ ! -f "$APK" ]; then
  echo "  FAIL  APK not found: $APK"
  exit 1
fi
apk_bytes=$(wc -c < "$APK" | tr -d '[:space:]')
check "APK size" "$apk_bytes" "${MAX_APK_BYTES:-4194304}"

# ---- gzip'd bundle weights ----
js=$(ls "$DIST"/assets/index-*.js 2>/dev/null | head -1 || true)
css=$(ls "$DIST"/assets/index-*.css 2>/dev/null | head -1 || true)
if [ -z "$js" ]; then
  echo "  FAIL  JS bundle not found in $DIST/assets"
  fail=1
else
  js_gz=$(gzip -c "$js" | wc -c | tr -d '[:space:]')
  check "JS bundle (gzip)" "$js_gz" "${MAX_JS_GZIP_BYTES:-98304}"
fi
if [ -z "$css" ]; then
  echo "  FAIL  CSS bundle not found in $DIST/assets"
  fail=1
else
  css_gz=$(gzip -c "$css" | wc -c | tr -d '[:space:]')
  check "CSS bundle (gzip)" "$css_gz" "${MAX_CSS_GZIP_BYTES:-12288}"
fi

# ---- fonts: the 1.35 MB we consciously ship; a 4th font must be a decision ----
font_bytes=$(find "$DIST/assets" -name '*.ttf' -printf '%s\n' 2>/dev/null | awk '{s+=$1} END {print s+0}')
if [ "$font_bytes" -gt 0 ]; then
  check "bundled fonts" "$font_bytes" "${MAX_FONT_BYTES:-1600000}"
fi

if [ "$fail" -ne 0 ]; then
  echo "perf-budget: FAILED — shrink it or raise the budget on purpose."
  exit 1
fi
echo "perf-budget: all checks passed."
