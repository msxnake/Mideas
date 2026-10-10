#!/usr/bin/env bash
# Terrain body (the soldier's 9x29 descriptor 03 03 08 1C in the complete-body engine) + ANIM_CLIP probe of the pursuer soldier
# (pursuer_tall_probe.tcl).
#
#   one:  run_pursuer_tall_probe.sh one <case stand|ledge|ledgeleft|wall|ceiling|clip|t744> <rom> <sym> <out.txt> [wall-seconds] [clips.json]
#   all:  run_pursuer_tall_probe.sh all <gen-dir> <work-dir> [sabotage]
#           builds the six ROMs with the compiled generator in <gen-dir> (tsc output, see build_pursuer_rom.mjs):
#             stand  the alert lab (make_pursuer_alert_lab.mjs --start-room A, 2 s countdown)
#             ledge, ledgeleft, wall, ceiling, clip   make_pursuer_tall_lab.mjs --case <c>   (derived fixtures, see that script)
#           optionally breaks each ASM first (sabotage_pursuer_asm.mjs mode), runs the six cases and prints the verdicts. Exit code 0
#           only when every run that had to pass passed and every run that had to fail failed. The check
#           soldier_descriptor_is_the_player_hitbox is judged on its own (it must pass without sabotage and fail in every descriptor-*
#           sabotage); the behavioural verdict of a case is the verdict of ALL OTHER checks, so a descriptor sabotage is only "red" when
#           the soldier really behaves differently, not merely because its bytes changed:
#             sabotage none              every case PASS
#             sabotage descriptor-sprite stand clip PASS (the sprite is as tall as the hitbox); ledge ledgeleft wall ceiling FAIL
#             sabotage descriptor-short  stand ledge ledgeleft wall ceiling FAIL; clip PASS (the body floats 8 px above the floor)
#             sabotage descriptor-head   ceiling FAIL, the rest PASS (top = 0: the head row moves 3 px up, the feet stay)
#             sabotage feet-left-only    ledgeleft FAIL, the rest PASS (walking west, the right foot decides: the case D9 left uncovered)
#             sabotage feet-right-only   ledge FAIL, the rest PASS (walking east, the left foot decides)
#             sabotage wall-one-row      wall FAIL, the rest PASS (the wall probe sees only the top row: the one-cell block is never seen)
#             sabotage head-short        ceiling FAIL, the rest PASS (the head probe looks at y+3 instead of y+2: 1 px too far up)
#             sabotage clip-as-set-anim  clip must FAIL, the rest PASS               (ANIM_CLIP wired to SET_ANIM: frames leave the clip)
#             sabotage clip-restart      clip must FAIL, the rest PASS               (a clip re-asked every tick restarts: cycles never advance)
#             sabotage clip-late-frame   clip must FAIL, the rest PASS               (the new clip's first frame is not written in the tick that chose it)
#
# Paths: Windows style (C:/...) or MSYS style (/c/...). Both are converted with `cygpath -am` to the mixed form OpenMSX and Tcl need; a
# path that cannot be converted aborts with a message instead of failing silently inside OpenMSX.
# Like the other pursuer runners this stops ONLY the OpenMSX process it started (never `taskkill //IM openmsx.exe`), on the same machine
# and mapper (Philips_NMS_8250, KonamiSCC; -romtype goes AFTER -cart, -script needs an absolute path with forward slashes).
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
REPO="$(cd "$(dirname "$0")/../.." && pwd -W 2>/dev/null || pwd)"
TCL="$HERE/pursuer_tall_probe.tcl"
MODE=${1:-}

winpath() { # label path
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

run_one() { # case rom sym out wall clips
  local C=$1 ROM=$2 SYM=$3 OUT=$4 WALL=${5:-120} CLIPS=${6:-}
  export MIDEAS_SYM="$SYM" MIDEAS_OUT="$OUT" MIDEAS_CASE="$C" MIDEAS_CLIPS="$CLIPS"
  rm -f "$OUT"
  powershell -NoProfile -Command "\$p = Start-Process -FilePath 'C:\Program Files\openMSX\openmsx.exe' -ArgumentList '-machine','Philips_NMS_8250','-cart','$ROM','-romtype','KonamiSCC','-script','$TCL' -PassThru; \$p | Wait-Process -Timeout $WALL -ErrorAction SilentlyContinue; if (-not \$p.HasExited) { Stop-Process -Id \$p.Id -Force; Write-Output 'exit=KILLED-TIMEOUT' } else { Write-Output \"exit=\$(\$p.ExitCode)\" }" | sed 's/^/  openmsx /'
  echo "---- $OUT"
  cat "$OUT" 2>/dev/null || echo "(no output file)"
}

if [ "$MODE" = "one" ]; then
  [ $# -ge 5 ] || { sed -n '2,10p' "$0"; exit 2; }
  ROM1=$(winpath "rom" "$3") || exit 2
  SYM1=$(winpath "sym" "$4") || exit 2
  OUT1=$(winpath "out" "$5") || exit 2
  CLIPS1=""; [ -n "${7:-}" ] && { CLIPS1=$(winpath "clips" "$7") || exit 2; }
  run_one "$2" "$ROM1" "$SYM1" "$OUT1" "${6:-120}" "$CLIPS1"
  grep -q "^RESULT case=$2 PASS" "$OUT1"
  exit $?
fi

if [ "$MODE" != "all" ] || [ $# -lt 3 ]; then sed -n '2,20p' "$0"; exit 2; fi
GEN=$(winpath "gen-dir" "$2") || exit 2
WORK=$(winpath "work-dir" "$3") || exit 2
SAB=${4:-none}
LAB=$(winpath "lab" "${MIDEAS_LAB:-$HERE/pursuer_lab.json}") || exit 2
mkdir -p "$WORK"

build() { # name
  local P="$WORK/tall_$1"
  case "$1" in
    stand) node "$HERE/make_pursuer_alert_lab.mjs" --lab "$LAB" --start-room A --delay 2 --out "$P.json" >/dev/null || exit 2 ;;
    *)     node "$HERE/make_pursuer_tall_lab.mjs" --lab "$LAB" --case "$1" --out "$P.json" >/dev/null || exit 2 ;;
  esac
  node --max-old-space-size=8192 "$HERE/build_pursuer_rom.mjs" --project "$P.json" --gen "$GEN" --out "$P" --repo "$REPO" >/dev/null || exit 2
  if [ "$SAB" != "none" ]; then
    node "$HERE/sabotage_pursuer_asm.mjs" "$P.asm" "${P}_sab.asm" "$SAB" || exit 3
    node "$HERE/build_pursuer_rom.mjs" --asm "${P}_sab.asm" --out "${P}_sab" --repo "$REPO" >/dev/null || exit 2
  fi
}
CASES="stand ledge ledgeleft wall ceiling clip"
for C in $CASES; do build $C; done
SUF=""; [ "$SAB" != "none" ] && SUF="_sab"

want() { # <sabotage> <case> -> the BEHAVIOURAL verdict the run must give (the descriptor check is judged apart)
  case "$1:$2" in
    none:*) echo PASS ;;
    descriptor-sprite:stand|descriptor-sprite:clip) echo PASS ;;
    descriptor-sprite:*) echo FAIL ;;
    descriptor-short:clip) echo PASS ;;
    descriptor-short:*) echo FAIL ;;
    descriptor-head:ceiling|head-short:ceiling) echo FAIL ;;
    feet-left-only:ledgeleft|feet-right-only:ledge|wall-one-row:wall) echo FAIL ;;
    clip-as-set-anim:clip|clip-restart:clip|clip-late-frame:clip) echo FAIL ;;
    *) echo PASS ;;
  esac
}
want_desc() { # <sabotage> -> the verdict of soldier_descriptor_is_the_player_hitbox
  case "$1" in descriptor-*) echo FAIL ;; *) echo PASS ;; esac
}

FAILS=0
for C in $CASES; do
  CL=""; [ "$C" = "clip" ] && CL="$WORK/tall_clip.json.clips.json"
  R="$WORK/result_${SAB}_$C.txt"
  run_one "$C" "$WORK/tall_$C$SUF.rom" "$WORK/tall_$C$SUF.sym" "$R" 150 "$CL" > "$WORK/log_${SAB}_$C.txt"
  RES=$(grep "^RESULT" "$R" 2>/dev/null | tail -1)
  [ -n "$RES" ] || RES="RESULT case=$C FAIL (no result line)"
  # the behavioural verdict = every check but the descriptor one; the descriptor check is read on its own
  OTHER_FAILS=$(grep -E "^CHECK name=[a-z_0-9]+ FAIL" "$R" 2>/dev/null | grep -vc "name=soldier_descriptor_is_the_player_hitbox")
  if grep -q "^CHECK name=soldier_descriptor_is_the_player_hitbox PASS" "$R" 2>/dev/null; then GOTD=PASS; else GOTD=FAIL; fi
  if ! grep -q "^CHECK name=" "$R" 2>/dev/null; then OTHER_FAILS=1; fi
  if [ "$OTHER_FAILS" -eq 0 ]; then GOT=PASS; else GOT=FAIL; fi
  WANT=$(want "$SAB" "$C"); WANTD=$(want_desc "$SAB")
  V=ok
  if [ "$GOT" != "$WANT" ] || [ "$GOTD" != "$WANTD" ]; then V="UNEXPECTED"; FAILS=$((FAILS+1)); fi
  # a run that fails on the instrument is a broken probe, not a red sabotage
  if echo "$RES" | grep -q "(instrument)"; then V="INSTRUMENT-FAILURE"; FAILS=$((FAILS+1)); fi
  echo "[$SAB] case $C behaviour wants $WANT got $GOT, descriptor check wants $WANTD got $GOTD ($V)  <- $RES"
  grep -E "^CHECK name=[a-z_0-9]+ FAIL" "$R" | cut -c1-260 | sed 's/^/        /'
done
[ "$SAB" = "none" ] && echo "PROBE $([ $FAILS -eq 0 ] && echo PASS || echo FAIL)" || echo "SABOTAGE $SAB $([ $FAILS -eq 0 ] && echo 'went RED as required' || echo 'DID NOT behave as required')"
exit $FAILS
