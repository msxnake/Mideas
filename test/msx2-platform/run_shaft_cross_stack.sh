#!/usr/bin/env bash
# Dynamic acceptance of the lift (platform_shaft) hand-over: the game loop must survive the player riding the cabin across a room
# boundary, with a balanced stack in bitmap_shaft_ride_detect (probe: shaft_cross_stack_probe.tcl, project: make_shaft_cross_lab.mjs).
#
#   one:  run_shaft_cross_stack.sh one <up|down> <rom> <sym> <out.txt> [wall-seconds]
#           one OpenMSX run of the probe against a ROM built from make_shaft_cross_lab.mjs --dir <up|down>.
#   all:  run_shaft_cross_stack.sh all <gen-dir> <work-dir> [sabotage]
#           builds both labs (up: the cabin climbs out of room A into B; down: it descends into B) with the compiled generator in
#           <gen-dir> (tsc output, see test/msx2-pursuer/build_pursuer_rom.mjs), optionally breaks the ASM first, runs both probes
#           and prints the verdicts. Exit code 0 only when every run gave the verdict it had to give:
#             sabotage none            up and down must PASS
#             sabotage revert-skip     up and down must FAIL: the rider==2 skip of ride_detect jumps to .shaft_detect_next (before
#                                      the pop bc that this path never pushed for) again - the defect this test was written for.
#
#   tsc --module commonjs --target ES2020 --moduleResolution node --skipLibCheck --noEmitOnError false --outDir <gen> utils/msxGenerator/index.ts
#   echo '{"type":"commonjs"}' > <gen>/package.json
#
# Paths: Windows style (C:/...) or MSYS style (/c/...), converted with `cygpath -am`. Like run_pursuer_spawn_probe.sh this stops ONLY
# the OpenMSX process it started, on Philips_NMS_8250 with -romtype KonamiSCC given AFTER -cart and -script as an absolute path with
# forward slashes (anything else exits 1 silently).
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
REPO="$(cd "$(dirname "$0")/../.." && pwd -W 2>/dev/null || pwd)"
TCL="$HERE/shaft_cross_stack_probe.tcl"
MODE=${1:-}

winpath() { # label path -> absolute mixed-form path, or exit 2
  local label=$1 p=$2 out
  if [ -z "$p" ]; then echo "error: $label is empty" >&2; exit 2; fi
  if command -v cygpath >/dev/null 2>&1; then
    out=$(cygpath -am "$p" 2>/dev/null) || { echo "error: cygpath cannot convert $label '$p'" >&2; exit 2; }
  else
    out=$p
  fi
  case "$out" in
    [A-Za-z]:/*) printf '%s' "$out" ;;
    *) echo "error: $label '$p' is not an absolute Windows path" >&2; exit 2 ;;
  esac
}

run_one() { # dir rom sym out wall
  local D=$1 ROM=$2 SYM=$3 OUT=$4 WALL=${5:-120}
  export MIDEAS_SYM="$SYM" MIDEAS_OUT="$OUT" MIDEAS_DIR="$D"
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
  run_one "$2" "$ROM1" "$SYM1" "$OUT1" "${6:-120}"
  grep -q "^RESULT PASS" "$OUT1"
  exit $?
fi

if [ "$MODE" != "all" ] || [ $# -lt 3 ]; then sed -n '2,14p' "$0"; exit 2; fi
GEN=$(winpath "gen-dir" "$2") || exit 2
WORK=$(winpath "work-dir" "$3") || exit 2
SAB=${4:-none}
case "$SAB" in none|revert-skip) ;; *) echo "error: unknown sabotage '$SAB'" >&2; exit 2 ;; esac
mkdir -p "$WORK"
FAILS=0
for D in up down; do
  P="$WORK/lift_$D"
  node "$HERE/make_shaft_cross_lab.mjs" --dir "$D" --out "$P.json" >/dev/null || exit 2
  node --max-old-space-size=8192 "$REPO/test/msx2-pursuer/build_pursuer_rom.mjs" --project "$P.json" --gen "$GEN" --out "$P" --repo "$REPO" >/dev/null || exit 2
  SUF=""
  if [ "$SAB" = "revert-skip" ]; then
    # exactly one `jp z, .shaft_detect_advance` must exist, or the sabotage did not apply and a "red" would prove nothing
    node -e "
      const fs=require('fs'); const [i,o]=process.argv.slice(1);
      const s=fs.readFileSync(i,'utf8'); const re=/^(\s*)jp z, \.shaft_detect_advance\b/m;
      const n=s.split(/\r?\n/).filter(l=>/^\s*jp z, \.shaft_detect_advance\b/.test(l)).length;
      if(n!==1){console.error('sabotage NOT applied: found '+n+' skip jumps');process.exit(3);}
      fs.writeFileSync(o,s.replace(re,'\$1jp z, .shaft_detect_next      ; SABOTAGE: the old, unbalanced skip'));
    " "$P.asm" "${P}_sab.asm" || exit 3
    node "$REPO/test/msx2-pursuer/build_pursuer_rom.mjs" --asm "${P}_sab.asm" --out "${P}_sab" --repo "$REPO" >/dev/null || exit 2
    SUF="_sab"
  fi
  # cheap static twin of the probe, on the same real JSON -> ASM build: the stack-depth walk of every lift routine
  node "$REPO/scripts/check_msx2_shaft_stack_contract.mjs" --asm "$P$SUF.asm" > "$WORK/contract_${SAB}_$D.txt" 2>&1
  CRC=$?
  CGOT=PASS; [ $CRC -ne 0 ] && CGOT=FAIL
  CWANT=PASS; [ "$SAB" = "revert-skip" ] && CWANT=FAIL
  if [ "$CGOT" = "$CWANT" ]; then CV=ok; else CV=UNEXPECTED; FAILS=$((FAILS+1)); fi
  echo "[$SAB] lift $D static contract wants $CWANT got $CGOT ($CV)  <- $(grep -m1 -E '^(FAIL|SHAFT)' "$WORK/contract_${SAB}_$D.txt")"
  run_one "$D" "$P$SUF.rom" "$P$SUF.sym" "$WORK/result_${SAB}_$D.txt" 150 > "$WORK/log_${SAB}_$D.txt"
  RES=$(grep "^RESULT" "$WORK/result_${SAB}_$D.txt" 2>/dev/null | tail -1)
  [ -n "$RES" ] || RES="RESULT FAIL (no result line)"
  WANT=PASS; [ "$SAB" = "revert-skip" ] && WANT=FAIL
  GOT=$(echo "$RES" | sed -E 's/^RESULT (PASS|FAIL).*/\1/')
  if [ "$GOT" = "$WANT" ]; then V=ok; else V=UNEXPECTED; FAILS=$((FAILS+1)); fi
  echo "[$SAB] lift $D wants $WANT got $GOT ($V)  <- $RES"
  grep -E "^(CHECK .*FAIL|UNBALANCED|RETURNED_TO_END|SP_DEVIATION)" "$WORK/result_${SAB}_$D.txt" | sed 's/^/    /'
done
[ "$SAB" = "none" ] && echo "PROBE $([ $FAILS -eq 0 ] && echo PASS || echo FAIL)" || echo "SABOTAGE $SAB $([ $FAILS -eq 0 ] && echo 'went RED as required' || echo 'DID NOT behave as required')"
exit $FAILS
