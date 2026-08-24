#!/usr/bin/env bash
# Every shipped behaviour preset, one after another, on Jordi's Area51-test
# room: build the project, build the ROM, run it in openMSX, keep the frames.
#
# Deliberately NOT parallel. Two openMSX instances fight over the same window
# and the runner kills "any stale openmsx.exe" first, so a second run would
# shoot the first one in the back and both results would be garbage.
set -u
cd "$(dirname "$0")/../.."
OUT=server/temp/behaviour_visual
mkdir -p "$OUT"
SUMMARY="$OUT/SUMMARY.txt"
: > "$SUMMARY"

PRESETS="${*:-walker chaser guard floater hopper faller bouncer shielded sentry_shooter}"

for preset in $PRESETS; do
  echo "=== $preset ===" | tee -a "$SUMMARY"
  if ! node test/msx2-behavior/make_visual_case.mjs "$preset" "$OUT/case_$preset.json" >> "$SUMMARY" 2>&1; then
    echo "  BAKE FAILED" | tee -a "$SUMMARY"; continue
  fi
  if ! python scripts/build_mideas_unified_rom.py \
        --json "$OUT/case_$preset.json" --rom-mode megarom \
        --rom-output "$OUT/$preset.rom" --sym-output "$OUT/$preset.sym" \
        > "$OUT/${preset}_build.log" 2>&1; then
    echo "  BUILD FAILED (see ${preset}_build.log)" | tee -a "$SUMMARY"; continue
  fi
  MIDEAS_CASE="$preset" bash test/run_openmsx_probe.sh \
      "$(pwd -W 2>/dev/null || pwd)/$OUT/$preset.rom" \
      "$(pwd -W 2>/dev/null || pwd)/test/claude_behaviour_visual.tcl" 45 > /dev/null 2>&1
  if [ -f "$OUT/${preset}_probe.txt" ]; then
    tail -n 20 "$OUT/${preset}_probe.txt" >> "$SUMMARY"
  else
    echo "  NO PROBE OUTPUT" >> "$SUMMARY"
  fi
  echo "" >> "$SUMMARY"
done
echo "ALL DONE" >> "$SUMMARY"
