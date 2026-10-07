#!/usr/bin/env bash
# Run sight_left_hang.tcl against one ROM with a hard wall-clock stop.
#
#   usage: run_sight_left_hang.sh <rom> <sym> <out.txt> [label] [frames] [wall-seconds]
#
# Unlike test/run_openmsx_probe.sh this does NOT `taskkill //IM openmsx.exe`: it
# only ever stops the process it started, so it cannot shoot another agent's or
# the user's emulator. Same machine and mapper as that runner (Philips_NMS_8250,
# KonamiSCC; -romtype goes AFTER -cart, -script needs an absolute /-path).
set -u
ROM=$1
SYM=$2
OUT=$3
LABEL=${4:-?}
FRAMES=${5:-600}
WALL=${6:-90}
HERE="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
TCL="$HERE/sight_left_hang.tcl"

export MIDEAS_SYM="$SYM" MIDEAS_OUT="$OUT" MIDEAS_FRAMES="$FRAMES" MIDEAS_LABEL="$LABEL"
rm -f "$OUT"
powershell -NoProfile -Command "\$p = Start-Process -FilePath 'C:\Program Files\openMSX\openmsx.exe' -ArgumentList '-machine','Philips_NMS_8250','-cart','$ROM','-romtype','KonamiSCC','-script','$TCL' -PassThru; \$p | Wait-Process -Timeout $WALL -ErrorAction SilentlyContinue; if (-not \$p.HasExited) { Stop-Process -Id \$p.Id -Force; Write-Output 'exit=KILLED-TIMEOUT' } else { Write-Output \"exit=\$(\$p.ExitCode)\" }"
echo "---- $OUT"
cat "$OUT" 2>/dev/null || echo "(no output file)"
