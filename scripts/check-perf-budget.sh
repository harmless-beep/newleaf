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
# Trend (used by CI, optional locally):
#   PERF_HISTORY=<file>  JSON of the previous build's numbers. If present, the
#                        summary gains a "Δ vs last build" column; this run's
#                        numbers are written back to the same file so the next
#                        build continues the trend. Written even when the
#                        budget fails — numbers are numbers.
#   GITHUB_STEP_SUMMARY  When set (CI), a markdown table is appended there.
#
# Usage:
#   scripts/check-perf-budget.sh <apk> <dist-dir>

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

headroom_pct() {
  awk -v a="$1" -v l="$2" 'BEGIN { printf "%.0f%%", (l - a) / l * 100 }'
}

# delta_line <now> <prev|empty> — humanized signed difference for the trend.
delta_line() {
  if [ -z "${2:-}" ]; then echo "—"; return; fi
  local d=$(( $1 - $2 ))
  if [ "$d" -eq 0 ]; then echo "±0"; return; fi
  if [ "$d" -gt 0 ]; then
    echo "+$(bytes_human "$d") ▲"
  else
    echo "-$(bytes_human $(( -d ))) ▼"
  fi
}

echo "Perf budget (APK: $APK, bundle: $DIST)"

# ---- APK ----
if [ ! -f "$APK" ]; then
  echo "  FAIL  APK not found: $APK"
  exit 1
fi
apk_bytes=$(wc -c < "$APK" | tr -d '[:space:]')

# ---- gzip'd bundle weights ----
js=$(ls "$DIST"/assets/index-*.js 2>/dev/null | head -1 || true)
css=$(ls "$DIST"/assets/index-*.css 2>/dev/null | head -1 || true)
js_gz=""; css_gz=""
if [ -z "$js" ]; then
  echo "  FAIL  JS bundle not found in $DIST/assets"
  fail=1
else
  js_gz=$(gzip -c "$js" | wc -c | tr -d '[:space:]')
fi
if [ -z "$css" ]; then
  echo "  FAIL  CSS bundle not found in $DIST/assets"
  fail=1
else
  css_gz=$(gzip -c "$css" | wc -c | tr -d '[:space:]')
fi

# ---- fonts ----
font_bytes=$(find "$DIST/assets" -name '*.ttf' -printf '%s\n' 2>/dev/null | awk '{s+=$1} END {print s+0}')

# ---- previous numbers (trend) ----
prev_apk=""; prev_js=""; prev_css=""; prev_fonts=""; prev_meta=""
if [ -n "${PERF_HISTORY:-}" ] && [ -f "$PERF_HISTORY" ]; then
  prev_apk=$(sed -n 's/.*"apk":\([0-9]*\).*/\1/p' "$PERF_HISTORY")
  prev_js=$(sed -n 's/.*"js":\([0-9]*\).*/\1/p' "$PERF_HISTORY")
  prev_css=$(sed -n 's/.*"css":\([0-9]*\).*/\1/p' "$PERF_HISTORY")
  prev_fonts=$(sed -n 's/.*"fonts":\([0-9]*\).*/\1/p' "$PERF_HISTORY")
  prev_meta=$(sed -n 's/.*"meta":"\([^"]*\)".*/\1/p' "$PERF_HISTORY")
fi

# ---- checks ----
check() {
  local label=$1 actual=$2 limit=$3
  if [ "$actual" -le "$limit" ]; then
    echo "  ok    $label: $(bytes_human "$actual") / budget $(bytes_human "$limit")"
  else
    local over=$((actual - limit))
    echo "  FAIL  $label: $(bytes_human "$actual") exceeds the $(bytes_human "$limit") budget by $(bytes_human "$over")"
    echo "        Trim the payload or consciously raise the budget (env vars in scripts/check-perf-budget.sh) with a note in the commit message."
    fail=1
  fi
}

check "APK size" "$apk_bytes" "${MAX_APK_BYTES:-4194304}"
[ -n "$js_gz" ] && check "JS bundle (gzip)" "$js_gz" "${MAX_JS_GZIP_BYTES:-98304}"
[ -n "$css_gz" ] && check "CSS bundle (gzip)" "$css_gz" "${MAX_CSS_GZIP_BYTES:-12288}"
[ "$font_bytes" -gt 0 ] && check "bundled fonts" "$font_bytes" "${MAX_FONT_BYTES:-1600000}"

# ---- trend history: write this run's numbers even on budget failure ----
if [ -n "${PERF_HISTORY:-}" ]; then
  meta="${PERF_SHA:-$(git rev-parse --short HEAD 2>/dev/null || echo local)} $(date -u '+%Y-%m-%d %H:%M UTC')"
  printf '{"apk":%s,"js":%s,"css":%s,"fonts":%s,"meta":"%s"}\n' \
    "$apk_bytes" "${js_gz:-0}" "${css_gz:-0}" "$font_bytes" "$meta" > "$PERF_HISTORY"
fi

# ---- step summary (CI) ----
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### 📦 Size report"
    echo
    echo "| Check | Now | Budget | Headroom | Δ vs last build |"
    echo "|---|---:|---:|---:|---:|"
    echo "| APK size | $(bytes_human "$apk_bytes") | $(bytes_human "${MAX_APK_BYTES:-4194304}") | $(headroom_pct "$apk_bytes" "${MAX_APK_BYTES:-4194304}") | $(delta_line "$apk_bytes" "$prev_apk") |"
    if [ -n "$js_gz" ]; then
      echo "| JS bundle (gzip) | $(bytes_human "$js_gz") | $(bytes_human "${MAX_JS_GZIP_BYTES:-98304}") | $(headroom_pct "$js_gz" "${MAX_JS_GZIP_BYTES:-98304}") | $(delta_line "$js_gz" "$prev_js") |"
    fi
    if [ -n "$css_gz" ]; then
      echo "| CSS bundle (gzip) | $(bytes_human "$css_gz") | $(bytes_human "${MAX_CSS_GZIP_BYTES:-12288}") | $(headroom_pct "$css_gz" "${MAX_CSS_GZIP_BYTES:-12288}") | $(delta_line "$css_gz" "$prev_css") |"
    fi
    if [ "$font_bytes" -gt 0 ]; then
      echo "| Bundled fonts | $(bytes_human "$font_bytes") | $(bytes_human "${MAX_FONT_BYTES:-1600000}") | $(headroom_pct "$font_bytes" "${MAX_FONT_BYTES:-1600000}") | $(delta_line "$font_bytes" "$prev_fonts") |"
    fi
    echo
    if [ -n "$prev_meta" ]; then
      echo "Last build: $prev_meta"
    else
      echo "First build with trend tracking — the Δ column fills in from the next run."
    fi
    if [ "$fail" -ne 0 ]; then
      echo
      echo "**Budget exceeded — see the job log for which check tripped.**"
    fi
  } >> "$GITHUB_STEP_SUMMARY"
fi

if [ "$fail" -ne 0 ]; then
  echo "perf-budget: FAILED — shrink it or raise the budget on purpose."
  exit 1
fi
echo "perf-budget: all checks passed."
