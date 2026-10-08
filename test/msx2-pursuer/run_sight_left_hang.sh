#!/usr/bin/env bash
# Run sight_left_hang.tcl against one ROM with a hard wall-clock stop.
#
#   usage: run_sight_left_hang.sh <rom> <sym> <out.txt> [fixture|label] [frames] [wall-seconds]
#
# The fixture says what the ROM is supposed to do, and the probe judges against it
# (the last line of <out.txt> is "VERDICT PASS" or "VERDICT FAIL: <reason>"; the
# exit code is 0 for PASS, 1 for FAIL). It is taken, in this order, from
# $MIDEAS_FIXTURE, from the 4th argument when that is one of the keys below, or from
# the ROM file name (…wall15…, …_wall…, …ctrl…, …sight_left_hang…); if none of them
# identifies it the script stops with exit 2 instead of guessing. Any other 4th argument
# is just a free-text label echoed in the result header.
#
#   x104    sight_left_hang.json        guard x=104, free row      RUNNING and shots >= 10
#   ctrl    sight_left_hang_ctrl.json   guard x=96,  free row      RUNNING and shots >= 10
#   wall    sight_left_hang_wall.json   guard x=104, wall col 2    RUNNING and shots == 0
#   wall15  sight_left_hang_wall15.json guard x=104, wall col 15   RUNNING and shots >= 10
#
# (the file names without ".json" are accepted as keys too). The shot
# expression can be overridden from the environment, e.g. to assert the PRE-fix
# behaviour of wall15 on 0670cb11:  MIDEAS_EXPECT_SHOTS='==0' run_sight_left_hang.sh ...
#
# Unlike test/run_openmsx_probe.sh this does NOT `taskkill //IM openmsx.exe`: it
# only ever stops the process it started, so it cannot shoot another agent's or
# the user's emulator. Same machine and mapper as that runner (Philips_NMS_8250,
# KonamiSCC; -romtype goes AFTER -cart, -script needs an absolute /-path).
set -u
ROM=${1:?usage: run_sight_left_hang.sh <rom> <sym> <out.txt> [fixture|label] [frames] [wall-seconds]}
SYM=${2:?missing <sym>}
OUT=${3:?missing <out.txt>}
LABEL=${4:-?}
FRAMES=${5:-600}
WALL=${6:-90}
HERE="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
TCL="$HERE/sight_left_hang.tcl"

# Which fixture is this ROM?
FIXTURE=""
for cand in "${MIDEAS_FIXTURE:-}" "$LABEL"; do
  case "$cand" in
    x104|sight_left_hang)          FIXTURE=x104 ;;
    ctrl|sight_left_hang_ctrl)     FIXTURE=ctrl ;;
    wall|sight_left_hang_wall)     FIXTURE=wall ;;
    wall15|sight_left_hang_wall15) FIXTURE=wall15 ;;
  esac
  [ -n "$FIXTURE" ] && break
done
if [ -z "$FIXTURE" ]; then
  case "$(basename "$ROM")" in
    *wall15*)           FIXTURE=wall15 ;;
    *_wall*|*wall.rom)  FIXTURE=wall ;;
    *ctrl*)             FIXTURE=ctrl ;;
    *sight_left_hang*|*x104*) FIXTURE=x104 ;;
  esac
fi
if [ -z "$FIXTURE" ]; then
  echo "cannot tell which fixture this ROM is: pass x104 | ctrl | wall | wall15 as 4th argument or set MIDEAS_FIXTURE" >&2
  exit 2
fi
echo "fixture=$FIXTURE (label '$LABEL')"

# fixture -> guard x, player x, the only solid column of the ray row (or none), shot expectation
case "$FIXTURE" in
  x104|sight_left_hang)            GX=104; PX=2; WC=none; SH='>=10' ;;
  ctrl|sight_left_hang_ctrl)       GX=96;  PX=2; WC=none; SH='>=10' ;;
  wall|sight_left_hang_wall)       GX=104; PX=2; WC=2;    SH='==0'  ;;
  wall15|sight_left_hang_wall15)   GX=104; PX=2; WC=15;   SH='>=10' ;;
esac

export MIDEAS_SYM="$SYM" MIDEAS_OUT="$OUT" MIDEAS_FRAMES="$FRAMES" MIDEAS_LABEL="$FIXTURE/$LABEL"
export MIDEAS_EXPECT_GUARD_X="$GX" MIDEAS_EXPECT_PLAYER_X="$PX" MIDEAS_EXPECT_WALL_COL="$WC"
export MIDEAS_EXPECT_SHOTS="${MIDEAS_EXPECT_SHOTS:-$SH}"
rm -f "$OUT"
powershell -NoProfile -Command "\$p = Start-Process -FilePath 'C:\Program Files\openMSX\openmsx.exe' -ArgumentList '-machine','Philips_NMS_8250','-cart','$ROM','-romtype','KonamiSCC','-script','$TCL' -PassThru; \$p | Wait-Process -Timeout $WALL -ErrorAction SilentlyContinue; if (-not \$p.HasExited) { Stop-Process -Id \$p.Id -Force; Write-Output 'exit=KILLED-TIMEOUT' } else { Write-Output \"exit=\$(\$p.ExitCode)\" }"
echo "---- $OUT"
cat "$OUT" 2>/dev/null || echo "(no output file)"
# A probe that dies, is killed or never reaches its end must not look like a pass,
# nor like "nothing happened": say it in the same words as every other failure.
if ! grep -q '^VERDICT ' "$OUT" 2>/dev/null; then
  echo "VERDICT FAIL: instrument: no verdict was written (openMSX killed on the ${WALL}s wall-clock stop, or the script died)" | tee -a "$OUT"
fi
grep -q '^VERDICT PASS$' "$OUT"
