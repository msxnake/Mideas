#!/usr/bin/env bash
# Runs the grass-sway OpenMSX probe against the built fixture ROM.
#
#   node test/msx2-sway/make_fixture.mjs
#   python -B scripts/build_mideas_unified_rom.py --json test/msx2-sway/fixture_sway.json \
#       --project-root . --asm-output test/msx2-sway/sway.asm \
#       --rom-output test/msx2-sway/sway.rom --allow-tsc-errors
#   bash test/msx2-sway/run_probe.sh
#
# The RAM addresses come out of the generated ASM, so the probe follows the
# generator instead of drifting behind it.
set -euo pipefail
dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
asm="$dir/sway.asm"
rom="$dir/sway.rom"
openmsx="${OPENMSX:-/c/Program Files/openMSX/openmsx.exe}"

[ -f "$asm" ] || { echo "Missing $asm - build the fixture ROM first" >&2; exit 1; }
[ -f "$rom" ] || { echo "Missing $rom - build the fixture ROM first" >&2; exit 1; }

emit_addr() {
  # emit_addr <tcl var> <asm label>
  local value
  value="$(awk -v label="$2" '$1 == label && $2 == "EQU" { sub(/^#/, "", $3); print $3; exit }' "$asm")"
  [ -n "$value" ] || { echo "Label $2 not found in $asm" >&2; exit 1; }
  echo "set $1 0x$value"
}

{
  emit_addr POOL     bitmap_sway_pool
  emit_addr PLAYER_Y player_y
  emit_addr PLAYER_X player_x
  emit_addr FACING   player_facing
  emit_addr COMPOSE  bitmap_composition_state
} > "$dir/_sway_addrs.tcl"

cat "$dir/_sway_addrs.tcl"
rm -f "$dir/_sway_probe.txt" "$dir"/_sway_*.png
"$openmsx" -machine Boosted_MSX2_EN -cart "$rom" -romtype konami -script "$dir/sway_probe.tcl" >/dev/null 2>&1 || true
cat "$dir/_sway_probe.txt"
grep -q "RESULT ALL PASS" "$dir/_sway_probe.txt"
