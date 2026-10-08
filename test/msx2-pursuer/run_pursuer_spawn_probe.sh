#!/usr/bin/env bash
# Pursuer soldier appearance probe (pursuer_spawn_probe.tcl).
#
#   one:  run_pursuer_spawn_probe.sh one <case a|b|c|d> <rom> <sym> <out.txt> [wall-seconds]
#           one OpenMSX run of one case against a ROM that was built from pursuer_alert_lab.json with the matching --start-room
#           (a, b: A    c: D    d: C).
#   all:  run_pursuer_spawn_probe.sh all <gen-dir> <work-dir> [sabotage]
#           builds the three lab ROMs (start A, D, C) with the compiled generator in <gen-dir> (tsc output, see build_pursuer_rom.mjs),
#           optionally breaks the ASM first (sabotage_pursuer_asm.mjs mode), runs a, b, c, d and prints the verdicts.
#           Exit code 0 only when every case that had to pass passed and every case that had to fail failed:
#             sabotage none           a b c d must PASS
#             sabotage no-boot-init   d must FAIL, a b c must PASS
#             sabotage no-commit-init a b c must FAIL, d must PASS
#             sabotage leader-only    a b c d must FAIL
#             sabotage ignore-guard   b must FAIL
#             sabotage no-tick        a b c d must FAIL
#
# Like test/msx2-pursuer/run_sight_left_hang.sh this stops ONLY the OpenMSX process it started (never `taskkill //IM openmsx.exe`),
# on the same machine and mapper as test/run_openmsx_probe.sh (Philips_NMS_8250, KonamiSCC; -romtype goes AFTER -cart, -script needs
# an absolute path with forward slashes).
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
REPO="$(cd "$(dirname "$0")/../.." && pwd -W 2>/dev/null || pwd)"
TCL="$HERE/pursuer_spawn_probe.tcl"
MODE=${1:-}

run_one() { # case rom sym out wall
  local C=$1 ROM=$2 SYM=$3 OUT=$4 WALL=${5:-120}
  export MIDEAS_SYM="$SYM" MIDEAS_OUT="$OUT" MIDEAS_CASE="$C"
  rm -f "$OUT"
  powershell -NoProfile -Command "\$p = Start-Process -FilePath 'C:\Program Files\openMSX\openmsx.exe' -ArgumentList '-machine','Philips_NMS_8250','-cart','$ROM','-romtype','KonamiSCC','-script','$TCL' -PassThru; \$p | Wait-Process -Timeout $WALL -ErrorAction SilentlyContinue; if (-not \$p.HasExited) { Stop-Process -Id \$p.Id -Force; Write-Output 'exit=KILLED-TIMEOUT' } else { Write-Output \"exit=\$(\$p.ExitCode)\" }" | sed 's/^/  openmsx /'
  echo "---- $OUT"
  cat "$OUT" 2>/dev/null || echo "(no output file)"
}

if [ "$MODE" = "one" ]; then
  [ $# -ge 5 ] || { sed -n '2,20p' "$0"; exit 2; }
  run_one "$2" "$3" "$4" "$5" "${6:-120}"
  grep -q "^RESULT case=$2 PASS" "$5"
  exit $?
fi

if [ "$MODE" != "all" ] || [ $# -lt 3 ]; then sed -n '2,20p' "$0"; exit 2; fi
GEN=$2; WORK=$3; SAB=${4:-none}
LAB=${MIDEAS_LAB:-$HERE/pursuer_lab.json}
mkdir -p "$WORK"
declare -A START=( [A]=A [D]=D [C]=C )
for S in A D C; do
  P="$WORK/alert_$S"
  node "$HERE/make_pursuer_alert_lab.mjs" --lab "$LAB" --start-room "$S" --out "$P.json" >/dev/null || exit 2
  node --max-old-space-size=8192 "$HERE/build_pursuer_rom.mjs" --project "$P.json" --gen "$GEN" --out "$P" --repo "$REPO" >/dev/null || exit 2
  if [ "$SAB" != "none" ]; then
    node "$HERE/sabotage_pursuer_asm.mjs" "$P.asm" "${P}_sab.asm" "$SAB" || exit 3
    node "$HERE/build_pursuer_rom.mjs" --asm "${P}_sab.asm" --out "${P}_sab" --repo "$REPO" >/dev/null || exit 2
  fi
done
SUF=""; [ "$SAB" != "none" ] && SUF="_sab"
declare -A ROMOF=( [a]=A [b]=A [c]=D [d]=C )
FAILS=0
for C in a b c d; do
  S=${ROMOF[$C]}
  run_one "$C" "$WORK/alert_$S$SUF.rom" "$WORK/alert_$S$SUF.sym" "$WORK/result_${SAB}_$C.txt" 150 > "$WORK/log_${SAB}_$C.txt"
  RES=$(grep "^RESULT" "$WORK/result_${SAB}_$C.txt" 2>/dev/null | tail -1)
  [ -n "$RES" ] || RES="RESULT case=$C FAIL (no result line)"
  case "$SAB:$C" in
    none:*|no-boot-init:a|no-boot-init:b|no-boot-init:c|no-commit-init:d|ignore-guard:a|ignore-guard:c|ignore-guard:d) WANT=PASS ;;
    ignore-guard:b|no-boot-init:d|no-commit-init:*|leader-only:*|no-tick:*) WANT=FAIL ;;
    *) WANT=PASS ;;
  esac
  GOT=$(echo "$RES" | sed -E 's/^RESULT case=[a-d] (PASS|FAIL).*/\1/')
  if [ "$GOT" = "$WANT" ]; then V=ok; else V="UNEXPECTED"; FAILS=$((FAILS+1)); fi
  echo "[$SAB] case $C wants $WANT got $GOT ($V)  <- $RES"
done
[ "$SAB" = "none" ] && echo "PROBE $([ $FAILS -eq 0 ] && echo PASS || echo FAIL)" || echo "SABOTAGE $SAB $([ $FAILS -eq 0 ] && echo 'went RED as required' || echo 'DID NOT behave as required')"
exit $FAILS
