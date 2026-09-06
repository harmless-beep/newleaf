#!/usr/bin/env bash
# Guard: fail if a built APK ever loses the code that makes New Leaf feel
# alive. Checks the web bundle packaged inside the APK for the welcome
# breathing demo, the milestone leaf burst, the bottom-tab animation and the
# first-paint splash handshake; and the dex for the native bridge methods
# that drive the splash reveal and haptics.
#
# Usage: verify-apk-motion.sh <path-to.apk>

set -euo pipefail

APK="${1:?usage: verify-apk-motion.sh <path-to.apk>}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Extract fully (rather than by wildcard) so the same script works with every
# unzip build on Linux and Git Bash.
unzip -q -o "$APK" -d "$tmp" || {
  echo "verify-apk-motion: cannot read $APK (not an APK?)"
  exit 1
}

js="$(ls "$tmp"/assets/www/assets/index-*.js 2>/dev/null | head -1 || true)"
css="$(ls "$tmp"/assets/www/assets/index-*.css 2>/dev/null | head -1 || true)"
# App code may live in classes.dex, classes2.dex, ... (debug builds split), so
# keep every dex file and search them all below.
dexfiles="$(ls "$tmp"/classes*.dex 2>/dev/null || true)"

fails=0
check() {
  # check <file> <needle> <what>
  if [ -z "$1" ]; then
    echo "  FAIL  $3 — bundled asset not found in $APK"
    fails=$((fails + 1))
    return
  fi
  if grep -a -q -F -- "$2" "$1"; then
    echo "  ok    $3"
  else
    echo "  FAIL  $3 — '$2' missing from $(basename "$1")"
    fails=$((fails + 1))
  fi
}

check_dex() {
  # check_dex <needle> <what> — searches every classes*.dex
  if [ -z "$dexfiles" ]; then
    echo "  FAIL  $2 — no classes*.dex found in $APK"
    fails=$((fails + 1))
    return
  fi
  # shellcheck disable=SC2086 -- intentional word-splitting across dex paths
  if grep -a -q -F -- "$1" $dexfiles; then
    echo "  ok    $2"
  else
    echo "  FAIL  $2 — '$1' missing from the dex"
    fails=$((fails + 1))
  fi
}

echo "verify-apk-motion: $(basename "$APK")"

echo "Web bundle (JS):"
check "$js" 'Breathe in'               'welcome breathing demo'
check "$js" 'Breathe again'            'breathing demo completion state'
check "$js" 'celebrated'               'milestone leaf-burst logic'
check "$js" 'prefers-reduced-motion'   'reduced-motion respect'
check "$js" 'nl-splash-hold'           'splash-aware entrance hold'
check "$js" 'contains("nl-splash-hold")' 'entrance-hold self-heal watchdog'
check "$js" 'pageReadyAt'              'first-paint splash handshake'

echo "Web bundle (CSS):"
check "$css" '@keyframes burst'        'milestone burst animation'
check "$css" '@keyframes leaf'         'leaf motion animation'
check "$css" '@keyframes tab'          'bottom tab bar animation'
check "$css" '@keyframes card'         'card entrance animation'
check "$css" '@keyframes sheetIn'      'overlay/sheet entrance animation'
check "$css" '@keyframes gridIn'       'journey grid paging animation'
check "$css" '@keyframes nl-sway'      'growth plant sway animation'
check "$css" 'Fraunces'             'display font face declared'

echo "Bundled premium assets:"
fonts=$(ls "$tmp"/assets/www/assets/Fraunces-Variable-*.ttf "$tmp"/assets/www/assets/NunitoSans-Variable-*.ttf 2>/dev/null || true)
if [ -n "$fonts" ]; then
  echo "  ok    bundled display + body fonts (Fraunces, Nunito Sans)"
else
  echo "  FAIL  bundled fonts missing — typography fell back to system fonts"
  fails=$((fails + 1))
fi
chime=$(ls "$tmp"/assets/www/assets/chime-*.mp3 2>/dev/null | head -1 || true)
if [ -n "$chime" ]; then
  echo "  ok    milestone chime audio"
else
  echo "  FAIL  milestone chime audio missing"
  fails=$((fails + 1))
fi
if grep -a -q -F 'Growth:' "$js"; then
  echo "  ok    growth-stage plant artwork"
else
  echo "  FAIL  growth-stage plant artwork missing"
  fails=$((fails + 1))
fi

echo "Native wrapper (dex):"
check_dex 'pageReadyAt'             'native splash flight bridge'
check_dex 'noteCheckin'             'native check-in haptics bridge'
check_dex 'AndroidNative'           'JS<->native bridge object'

if [ "$fails" -gt 0 ]; then
  echo "verify-apk-motion: $fails check(s) failed — a future build dropped part of the motion/UI code."
  exit 1
fi
echo "verify-apk-motion: all checks passed."
