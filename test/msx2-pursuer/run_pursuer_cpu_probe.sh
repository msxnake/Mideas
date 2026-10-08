#!/usr/bin/env bash
# CPU cost of the pursuer soldier tick + lost frames with the soldier visible (pursuer_cpu_probe.tcl).
#
#   run_pursuer_cpu_probe.sh <gen-dir> <work-dir> [frames] [sabotage]     (sabotage: a mode of sabotage_pursuer_asm.mjs, e.g. slow-tick; the probe must FAIL)
#
# Builds the lab ROM that starts in room C, then makes a COPY of its ASM with a local label right after the main loop's
# `call bitmap_pursuer_tick` (the end of the timed section), assembles it and proves with cmp that the ROM of the copy is
# byte-identical to the original (a label costs no bytes), and runs the probe on that copy. Stops only its own OpenMSX process.
set -u
GEN=${1:-}; WORK=${2:-}; FRAMES=${3:-800}; SAB=${4:-none}
[ -n "$GEN" ] && [ -n "$WORK" ] || { sed -n '2,8p' "$0"; exit 2; }
HERE="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
REPO="$(cd "$(dirname "$0")/../.." && pwd -W 2>/dev/null || pwd)"
LAB=${MIDEAS_LAB:-$HERE/pursuer_lab.json}
mkdir -p "$WORK"
P="$WORK/cpu_C"
node "$HERE/make_pursuer_alert_lab.mjs" --lab "$LAB" --start-room C --out "$P.json" >/dev/null || exit 2
node --max-old-space-size=8192 "$HERE/build_pursuer_rom.mjs" --project "$P.json" --gen "$GEN" --out "$P" --repo "$REPO" >/dev/null || exit 2
if [ "$SAB" != "none" ]; then
  mv "$P.asm" "${P}_orig.asm"
  node "$HERE/sabotage_pursuer_asm.mjs" "${P}_orig.asm" "$P.asm" "$SAB" || exit 3
  node "$HERE/build_pursuer_rom.mjs" --asm "$P.asm" --out "$P" --repo "$REPO" >/dev/null || exit 2
fi
# the label goes right after the call, inside the main loop
node -e "
const fs=require('fs');const t=fs.readFileSync('$P.asm','utf8').split(/\r?\n/);
const i=t.findIndex(l=>/^\s*call bitmap_pursuer_tick\s*$/.test(l));
if(i<0||t.filter(l=>/^\s*call bitmap_pursuer_tick\s*$/.test(l)).length!==1){console.error('expected exactly one call bitmap_pursuer_tick');process.exit(3);}
t.splice(i+1,0,'.pursuer_tick_done:');
fs.writeFileSync('${P}_lbl.asm',t.join('\n'));" || exit 3
node "$HERE/build_pursuer_rom.mjs" --asm "${P}_lbl.asm" --out "${P}_lbl" --repo "$REPO" >/dev/null || exit 2
if cmp "$P.rom" "${P}_lbl.rom"; then echo "cmp: the ROM with the timing label is byte-identical to the original ($(stat -c %s "$P.rom") bytes)"; else echo "FAIL: the label changed the ROM"; exit 4; fi
OUT="$WORK/cpu_result.txt"
export MIDEAS_SYM="${P}_lbl.sym" MIDEAS_OUT="$OUT" MIDEAS_FRAMES="$FRAMES"
rm -f "$OUT"
TCL="$HERE/pursuer_cpu_probe.tcl"
powershell -NoProfile -Command "\$p = Start-Process -FilePath 'C:\Program Files\openMSX\openmsx.exe' -ArgumentList '-machine','Philips_NMS_8250','-cart','${P}_lbl.rom','-romtype','KonamiSCC','-script','$TCL' -PassThru; \$p | Wait-Process -Timeout 240 -ErrorAction SilentlyContinue; if (-not \$p.HasExited) { Stop-Process -Id \$p.Id -Force; Write-Output 'exit=KILLED-TIMEOUT' } else { Write-Output \"exit=\$(\$p.ExitCode)\" }"
cat "$OUT" 2>/dev/null || echo "(no output file)"
grep -q "^RESULT PASS" "$OUT"
