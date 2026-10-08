#!/usr/bin/env bash
# Pursuer soldier appearance probe (pursuer_spawn_probe.tcl).
#
#   one:  run_pursuer_spawn_probe.sh one <case a|b|c|d|e> <rom> <sym> <out.txt> [wall-seconds]
#           one OpenMSX run of one case against a ROM that was built from pursuer_alert_lab.json with the matching --start-room
#           (a, b, e: A    c: D    d: C). For the long-delay run use a ROM built with --delay 5 and MIDEAS_DELAY_FRAMES=300.
#   all:  run_pursuer_spawn_probe.sh all <gen-dir> <work-dir> [sabotage]
#           builds the four lab ROMs (start A, D, C with the 2 s lab, and start A with the 5 s lab) with the compiled generator in
#           <gen-dir> (tsc output, see build_pursuer_rom.mjs), optionally breaks the ASM first (sabotage_pursuer_asm.mjs mode), runs
#           a, b, c, d, e and L (= case a on the 5 s lab with MIDEAS_DELAY_FRAMES=300: the long countdown, above 255 frames) and prints
#           the verdicts. Exit code 0 only when every run that had to pass passed and every run that had to fail failed:
#             sabotage none                    a b c d e L must PASS
#             sabotage no-boot-init            d must FAIL, the rest PASS
#             sabotage no-commit-init          a b c e L must FAIL, d must PASS
#             sabotage leader-only             all must FAIL
#             sabotage ignore-guard            b must FAIL, the rest PASS
#             sabotage no-tick                 all must FAIL
#             sabotage boot-init-before-place  d must FAIL, the rest PASS
#             sabotage timer-low-byte          L must FAIL, the rest PASS (a byte-wide countdown works for 2 s, never ends for 5 s)
#             sabotage no-park                 all must FAIL (the hidden soldier is not parked below the room)
#
# Paths: Windows style (C:/...) or MSYS style (/c/...). Both are converted with `cygpath -am` to the mixed form OpenMSX and Tcl need;
# a path that cannot be converted aborts with a message instead of failing silently inside OpenMSX.
#
# Like test/msx2-pursuer/run_sight_left_hang.sh this stops ONLY the OpenMSX process it started (never `taskkill //IM openmsx.exe`),
# on the same machine and mapper as test/run_openmsx_probe.sh (Philips_NMS_8250, KonamiSCC; -romtype goes AFTER -cart, -script needs
# an absolute path with forward slashes).
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
REPO="$(cd "$(dirname "$0")/../.." && pwd -W 2>/dev/null || pwd)"
TCL="$HERE/pursuer_spawn_probe.tcl"
MODE=${1:-}

# winpath <label> <path>: the absolute mixed-form (C:/dir/file) path, or exit 2 with a clear message.
winpath() {
  local label=$1 p=$2 out
  if [ -z "$p" ]; then echo "error: $label is empty" >&2; exit 2; fi
  if command -v cygpath >/dev/null 2>&1; then
    out=$(cygpath -am "$p" 2>/dev/null) || { echo "error: cygpath cannot convert $label '$p'" >&2; exit 2; }
  else
    out=$p
  fi
  case "$out" in
    [A-Za-z]:/*) printf '%s' "$out" ;;
    *) echo "error: $label '$p' is not an absolute Windows path (C:/...) and cygpath is not available to convert it" >&2; exit 2 ;;
  esac
}

run_one() { # case rom sym out wall
  local C=$1 ROM=$2 SYM=$3 OUT=$4 WALL=${5:-120}
  export MIDEAS_SYM="$SYM" MIDEAS_OUT="$OUT" MIDEAS_CASE="$C"
  rm -f "$OUT"
  powershell -NoProfile -Command "\$p = Start-Process -FilePath 'C:\Program Files\openMSX\openmsx.exe' -ArgumentList '-machine','Philips_NMS_8250','-cart','$ROM','-romtype','KonamiSCC','-script','$TCL' -PassThru; \$p | Wait-Process -Timeout $WALL -ErrorAction SilentlyContinue; if (-not \$p.HasExited) { Stop-Process -Id \$p.Id -Force; Write-Output 'exit=KILLED-TIMEOUT' } else { Write-Output \"exit=\$(\$p.ExitCode)\" }" | sed 's/^/  openmsx /'
  echo "---- $OUT"
  cat "$OUT" 2>/dev/null || echo "(no output file)"
}

if [ "$MODE" = "one" ]; then
  [ $# -ge 5 ] || { sed -n '2,26p' "$0"; exit 2; }
  ROM1=$(winpath "rom" "$3") || exit 2
  SYM1=$(winpath "sym" "$4") || exit 2
  OUT1=$(winpath "out" "$5") || exit 2
  run_one "$2" "$ROM1" "$SYM1" "$OUT1" "${6:-120}"
  grep -q "^RESULT case=$2 PASS" "$OUT1"
  exit $?
fi

if [ "$MODE" != "all" ] || [ $# -lt 3 ]; then sed -n '2,26p' "$0"; exit 2; fi
GEN=$(winpath "gen-dir" "$2") || exit 2
WORK=$(winpath "work-dir" "$3") || exit 2
SAB=${4:-none}
LAB=$(winpath "lab" "${MIDEAS_LAB:-$HERE/pursuer_lab.json}") || exit 2
mkdir -p "$WORK"
# ROM name -> make_pursuer_alert_lab.mjs arguments. A5 = start A with a 5 s countdown (300 frames > 255: the 16-bit timer).
declare -A LABARGS=( [A]="--start-room A" [D]="--start-room D" [C]="--start-room C" [A5]="--start-room A --delay 5" )
for S in A D C A5; do
  P="$WORK/alert_$S"
  # shellcheck disable=SC2086
  node "$HERE/make_pursuer_alert_lab.mjs" --lab "$LAB" ${LABARGS[$S]} --out "$P.json" >/dev/null || exit 2
  node --max-old-space-size=8192 "$HERE/build_pursuer_rom.mjs" --project "$P.json" --gen "$GEN" --out "$P" --repo "$REPO" >/dev/null || exit 2
  if [ "$SAB" != "none" ]; then
    node "$HERE/sabotage_pursuer_asm.mjs" "$P.asm" "${P}_sab.asm" "$SAB" || exit 3
    node "$HERE/build_pursuer_rom.mjs" --asm "${P}_sab.asm" --out "${P}_sab" --repo "$REPO" >/dev/null || exit 2
  fi
done
SUF=""; [ "$SAB" != "none" ] && SUF="_sab"

# The runs: name -> (case, rom). L is the long-delay run (case a on the 5 s lab).
declare -A CASEOF=( [a]=a [b]=b [c]=c [d]=d [e]=e [L]=a )
declare -A ROMOF=( [a]=A [b]=A [c]=D [d]=C [e]=A [L]=A5 )

# want <sabotage> <run> -> the verdict the run must give
want() {
  case "$1:$2" in
    none:*) echo PASS ;;
    no-boot-init:d) echo FAIL ;;
    no-commit-init:d) echo PASS ;;
    no-commit-init:*) echo FAIL ;;
    leader-only:*|no-tick:*|no-park:*) echo FAIL ;;
    ignore-guard:b) echo FAIL ;;
    boot-init-before-place:d) echo FAIL ;;
    timer-low-byte:L) echo FAIL ;;
    *) echo PASS ;;
  esac
}

FAILS=0
for R in a b c d e L; do
  C=${CASEOF[$R]}
  S=${ROMOF[$R]}
  if [ "$R" = "L" ]; then export MIDEAS_DELAY_FRAMES=300; else unset MIDEAS_DELAY_FRAMES; fi
  run_one "$C" "$WORK/alert_$S$SUF.rom" "$WORK/alert_$S$SUF.sym" "$WORK/result_${SAB}_$R.txt" 150 > "$WORK/log_${SAB}_$R.txt"
  unset MIDEAS_DELAY_FRAMES
  RES=$(grep "^RESULT" "$WORK/result_${SAB}_$R.txt" 2>/dev/null | tail -1)
  [ -n "$RES" ] || RES="RESULT case=$C FAIL (no result line)"
  WANT=$(want "$SAB" "$R")
  GOT=$(echo "$RES" | sed -E 's/^RESULT case=[a-e] (PASS|FAIL).*/\1/')
  if [ "$GOT" = "$WANT" ]; then V=ok; else V="UNEXPECTED"; FAILS=$((FAILS+1)); fi
  echo "[$SAB] run $R (case $C, rom $S) wants $WANT got $GOT ($V)  <- $RES"
done
[ "$SAB" = "none" ] && echo "PROBE $([ $FAILS -eq 0 ] && echo PASS || echo FAIL)" || echo "SABOTAGE $SAB $([ $FAILS -eq 0 ] && echo 'went RED as required' || echo 'DID NOT behave as required')"
exit $FAILS
