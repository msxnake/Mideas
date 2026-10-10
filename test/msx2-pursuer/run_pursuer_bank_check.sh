#!/usr/bin/env bash
# The contract of the pursuer soldier's code bank (scripts/check_msx2_pursuer_bank.mjs), proven both ways on ONE ROM:
#   1. the check PASSES on the generated ASM + .sym;
#   2. it goes RED on every sabotage below. Each sabotage edits a COPY of the ASM (sabotage_pursuer_asm.mjs refuses in === out),
#      assembles it with the real glass.jar and runs the same check on the copy's .sym, so a check that cannot see is caught here.
#
#   run_pursuer_bank_check.sh <unitedFiles.asm> <rom.sym> <work-dir> [repo-root]
#
# Run it on the lab ROM AND on the big project: the whitelist closure is only worth anything against the .sym of the ROM it will ship in
# (a routine that sits at #7F00 in the lab can sit at #8F00 in a big ROM).
#
# Sabotages (all must FAIL):
#   unlisted-call       the bank calls a resident routine (bitmap_wait_vblank) that is not on the whitelist
#   whitelist-p2-jump   bitmap_probe_solid (whitelisted) jumps to a label that lives in #8000-#9FFF of THIS ROM
#   p2-read             the bank reads a byte from a label in #8000-#9FFF
#   rom-write           the bank stores to #9000 (a mapper register)
#
# Paths: Windows (C:/...) or MSYS (/c/...) style, converted with `cygpath -am`; one that cannot be converted aborts with a message.
set -u
HERE="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
REPO_DEFAULT="$(cd "$(dirname "$0")/../.." && pwd -W 2>/dev/null || pwd)"

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
    *) echo "error: $label '$p' is not an absolute Windows path (C:/...)" >&2; exit 2 ;;
  esac
}

[ $# -ge 3 ] || { sed -n '2,19p' "$0"; exit 2; }
ASM=$(winpath asm "$1") || exit 2
SYM=$(winpath sym "$2") || exit 2
WORK=$(winpath work-dir "$3") || exit 2
REPO=$(winpath repo-root "${4:-$REPO_DEFAULT}") || exit 2
CHECK="$REPO/scripts/check_msx2_pursuer_bank.mjs"
mkdir -p "$WORK"

FAILS=0
verdict() { # name wanted got detail
  if [ "$2" = "$3" ]; then echo "[bank-check] $1: wants $2 got $3 (ok)  $4"; else echo "[bank-check] $1: wants $2 got $3 (UNEXPECTED)  $4"; FAILS=$((FAILS+1)); fi
}

# 1. clean ROM
node "$CHECK" "$ASM" "$SYM" > "$WORK/bank_clean.txt" 2>&1; RC=$?
grep -E "^whitelist|^  bitmap_probe|^closure of|^  by zone|^  highest|^summary|^PASS|^FAIL" "$WORK/bank_clean.txt" | sed 's/^/    /'
[ $RC -eq 0 ] && G=PASS || G=FAIL
verdict "clean ROM" PASS $G "(exit $RC)"

# 2. a label that lives in the P2 window of this ROM and does not look like a P2 mover by name: the jump targets of the sabotages
P2T=$(node -e "
const fs=require('fs');
const sym=[...fs.readFileSync('$SYM','utf8').matchAll(/^(\S+):\s*equ\s+([0-9A-Fa-f]+)H/gm)].map(m=>[m[1],parseInt(m[2],16)]);
const bad=[/^music_/,/^mapper_set_bank/,/select_data_bank/,/restore_resident_banks/,/copy_banked/,/^load_room\$/,/^bitmap_.*_boss_/,/^bitmap_boss_/,/pursuerb/i,/_ROM_START\$/,/_USED_END\$/];
// the target must lie OUTSIDE the soldier's own bank, whose used bytes end at BITMAP_PURSUER_CODE_BANK_USED_END (#8155 in a big ROM:
// a label at #8108 is the bank itself and a read of it is not a foreign reference)
const usedEnd=(sym.find(([n])=>n==='BITMAP_PURSUER_CODE_BANK_USED_END')||[0,0x8100])[1];
const pick=sym.filter(([n,a])=>a>=usedEnd+0x40&&a<0x9F00&&!bad.some(re=>re.test(n))).sort((a,b)=>a[1]-b[1])[0];
console.log(pick?pick[0]:'');
")
[ -n "$P2T" ] || { echo "error: no label between the end of the soldier's bank and #9EFF of $SYM to aim the sabotages at"; exit 2; }
P2ADDR=$(grep -m1 -E "^${P2T//./\\.}:" "$SYM" | sed -E 's/.*equ ([0-9A-Fa-f]+)H.*/\1/')
echo "    sabotage jump/read target in the P2 window: $P2T at #$P2ADDR"

run_sab() { # name mode expected-message-regex [extra sabotage args...]
  local name=$1 mode=$2 want=$3; shift 3
  local P="$WORK/bank_sab_$name"
  if ! node "$HERE/sabotage_pursuer_asm.mjs" "$ASM" "$P.asm" "$mode" "$@" > "$P.sab.log" 2>&1; then verdict "$name" FAIL "SABOTAGE-NOT-APPLIED" "$(tail -1 "$P.sab.log")"; return; fi
  if ! node "$HERE/build_pursuer_rom.mjs" --asm "$P.asm" --out "$P" --repo "$REPO" > "$P.build.log" 2>&1; then verdict "$name" FAIL "DID-NOT-ASSEMBLE" "$(tail -1 "$P.build.log")"; return; fi
  node "$CHECK" "$P.asm" "$P.sym" --quiet > "$P.check.txt" 2>&1; local rc=$?
  local msg; msg=$(grep -E "$want" "$P.check.txt" | head -1 | cut -c1-200)
  [ $rc -eq 1 ] && [ -n "$msg" ] && local got=FAIL || local got="exit $rc / message '$want' missing"
  verdict "$name" FAIL "$got" "${msg:-$(tail -1 "$P.check.txt" | cut -c1-160)}"
}
run_sab unlisted-call unlisted-call "is not on the whitelist" --target bitmap_wait_vblank
run_sab whitelist-p2-jump whitelist-p2-jump "whitelist closure" --target "$P2T"
run_sab p2-read p2-read "reference into P2 outside the bank" --target "$P2T"
run_sab rom-write rom-write "store into ROM space"

# The ROM-size effect the lab cannot show: in a bigger project the resident code grows past #8000 and a whitelisted routine can land
# inside the P2 window. Simulated on a COPY of the .sym (the ASM is untouched): bitmap_probe_solid moved to #8F00.
SYMP="$WORK/bank_sab_probe_in_p2.sym"
node -e "
const fs=require('fs');
const text=fs.readFileSync('$SYM','utf8').replace(/^(bitmap_probe_solid:\s*equ\s+)[0-9A-Fa-f]+H/m,'\$18F00H');
if(text===fs.readFileSync('$SYM','utf8')) { console.error('bitmap_probe_solid not found in the sym'); process.exit(3); }
fs.writeFileSync('$SYMP',text);" || { echo "error: could not build the moved-symbol copy"; exit 2; }
node "$CHECK" "$ASM" "$SYMP" --quiet > "$WORK/bank_sab_probe_in_p2.check.txt" 2>&1; RCP=$?
MSGP=$(grep -E "lives at #8F00|lives at" "$WORK/bank_sab_probe_in_p2.check.txt" | head -1 | cut -c1-200)
[ $RCP -eq 1 ] && [ -n "$MSGP" ] && GP=FAIL || GP="exit $RCP / message missing"
verdict "probe-in-p2 (sym copy)" FAIL "$GP" "$MSGP"

[ $FAILS -eq 0 ] && echo "BANK CHECK PASS (clean ROM green, every sabotage red)" || echo "BANK CHECK FAIL ($FAILS unexpected)"
exit $FAILS
