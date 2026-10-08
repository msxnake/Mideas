#!/usr/bin/env bash
# Run pursuer_lab_probe.tcl against one pursuer_lab ROM with a hard wall-clock stop.
#
#   usage: run_pursuer_lab_probe.sh <rom> <sym> <out.txt> [wall-seconds] [machine]
#
# The last line of <out.txt> is "VERDICT PASS", "VERDICT FAIL: <failed assertions>" or
# "VERDICT FAIL instrument: <why>" (a missing .sym symbol, a main loop that is not where the
# .sym says, a boot that never reaches the game). The exit code is 0 only for PASS.
#
# Build the ROM from the fixture with the real generator (byte-identical to the export path for this fixture):
#   node scripts/measure_bitmap_rom_budget.mjs test/msx2-pursuer/pursuer_lab.json --keep <prefix>.rom --sym <prefix>.sym
# and pass <prefix>.rom and <prefix>.sym. MIDEAS_SHOTS=1 also saves a screenshot per room.
#
# Like run_sight_left_hang.sh it only ever stops the openMSX process it started (no
# `taskkill //IM openmsx.exe`); -romtype goes AFTER -cart, -script needs an absolute /-path.
set -u
ROM=${1:?usage: run_pursuer_lab_probe.sh <rom> <sym> <out.txt> [wall-seconds] [machine]}
SYM=${2:?missing <sym>}
OUT=${3:?missing <out.txt>}
WALL=${4:-150}
MACHINE=${5:-Philips_NMS_8250}
HERE="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
TCL="$HERE/pursuer_lab_probe.tcl"

export MIDEAS_SYM="$SYM" MIDEAS_OUT="$OUT"
rm -f "$OUT"
powershell -NoProfile -Command "\$p = Start-Process -FilePath 'C:\Program Files\openMSX\openmsx.exe' -ArgumentList '-machine','$MACHINE','-cart','$ROM','-romtype','KonamiSCC','-script','$TCL' -PassThru; \$p | Wait-Process -Timeout $WALL -ErrorAction SilentlyContinue; if (-not \$p.HasExited) { Stop-Process -Id \$p.Id -Force; Write-Output 'exit=KILLED-TIMEOUT' } else { Write-Output \"exit=\$(\$p.ExitCode)\" }"
echo "---- $OUT"
cat "$OUT" 2>/dev/null || echo "(no output file)"
# A probe that dies or is killed must not look like silence: same words as every other failure.
if ! grep -q '^VERDICT ' "$OUT" 2>/dev/null; then
  echo "VERDICT FAIL instrument: no verdict was written (openMSX killed on the ${WALL}s wall-clock stop, or the script died)" | tee -a "$OUT"
fi
grep -q '^VERDICT PASS$' "$OUT"
