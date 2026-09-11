# Enemy colour cache probe v6 (CONTRATO B) — build pre.
# Independent oracle at .color_slot_N_done: expected block = (colorOff + animFrame) mod 256
# (this fixture has no slime/darkEyes terms). Verifies key, valid and the 16
# VRAM colour bytes against the ROM colours table on EVERY done hit.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-enemy-cache/probe_pre_v6.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
proc mem8 {addr} { return [debug read memory $addr] }
proc vram8 {addr} { return [debug read VRAM $addr] }

set COLROM 0x98A2
set COLTABLE {15 15 15 15 15 8 8 8 8 15 15 15 8 8 8 8 15 15 15 15 15 2 2 2 2 15 15 15 2 2 2 2 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15 15}
set COLBASE 0xF420
array set up {0 0 1 0 2 0 3 0}
set evals 0
set doneHits 0
set boot_hits 0
debug set_bp 0x4010 {} { incr ::boot_hits ; debug cont }

debug set_bp 0x5BD2 {} { incr ::evals ; debug cont }
debug set_bp 0x6151 {} { done_slot 0 ; debug cont }
debug set_bp 0x616F {} { done_slot 1 ; debug cont }
debug set_bp 0x618D {} { done_slot 2 ; debug cont }
debug set_bp 0x61AB {} { done_slot 3 ; debug cont }

set IDX 0xC00B
set COUNT 0xD000
set POOL 0xD001
set STRIDE 30
set NSLOTS 4
set DURATION 5400
set n 0
set stale 0
set verified 0
set keyErrors 0
set vramFails 0
set anomalies {}
set lastIdx -1
set idxChanges 0
set done 0
set seenValid 0
set tickerr 0
set injected 0

proc done_slot {s} {
    global f n verified stale keyErrors vramFails COLTABLE COLBASE POOL STRIDE COUNT injected NSLOTS
    set cnt [mem8 $COUNT]
    if {$s >= $cnt} { return }
    if {[catch {
        if {$cnt > $NSLOTS} { error "invalid active count $cnt" }
        set base [expr {$POOL + $s * $STRIDE}]
        set a [expr {([mem8 [expr {$base + 12}]] + [mem8 [expr {$base + 9}]]) % 256}]
        
        
        set ok 1
        for {set k 0} {$k < 16} {incr k} {
            set want [lindex $COLTABLE [expr {$a * 16 + $k}]]
            set got [vram8 [expr {$COLBASE + $s * 16 + $k}]]
            if {$want != $got} { set ok 0 ; break }
        }
        incr verified
        if {!$ok} {
            incr stale
            if {$stale <= 3} {
                set vh {}
                set wh {}
                for {set k 0} {$k < 16} {incr k} {
                    lappend vh [format %02X [vram8 [expr {$COLBASE + $s * 16 + $k}]]]
                    lappend wh [format %02X [mem8 [expr {$COLROM + $a * 16 + $k}]]]
                }
                logline "STALE frame=$n slot=$s expectedA=$a vram=[join $vh] romWanted=[join $wh]"
            }
        }
    } e]} { incr keyErrors ; logline "DONE-ERROR slot=$s: $e" }
}

proc tick {} {
    global f tickerr injected n verified stale keyErrors vramFails anomalies IDX COUNT NSLOTS DURATION done boot_hits up evals lastIdx idxChanges seenValid COLBASE COLTABLE POOL STRIDE
    after frame tick
    incr n
    if {[catch {
        if {$n >= $DURATION && !$done} {
            set done 1
            set upTotal 0
            foreach s {0 1 2 3} { incr upTotal $up($s) }
            logline "frames=$n boot=$boot_hits stale=$stale verified=$verified keyErrors=$keyErrors vramFails=$vramFails tickerr=$tickerr evals=$evals uploads=$upTotal idxChanges=$idxChanges anomalies=[llength $anomalies] injected=$injected"
            logline [expr {($boot_hits == 1 && $stale == 0 && $verified > 0 && $keyErrors == 0 && $vramFails == 0 && $tickerr == 0 && [llength $anomalies] == 0) ? "VERDICT: PASS" : "VERDICT: FAIL"}]
            logline "RUN-COMPLETE"
            close $f
            exit
        }
        set cnt [mem8 $COUNT]
        set idx [mem8 $IDX]
        if {$idx != $lastIdx} {
            if {$lastIdx != -1} { incr idxChanges ; logline "room change: $lastIdx -> $idx at frame $n" }
            set lastIdx $idx
        }
        if {$cnt <= $NSLOTS} {
            if {!$seenValid} { set seenValid 1 ; logline "game initialised at frame $n (count=$cnt)" }
        } elseif {$seenValid} {
            lappend anomalies "frame=$n cnt=$cnt (post-init out-of-range)"
        }
    } e]} { incr tickerr ; logline "TICK-ERROR($n): $e" ; if {$done} { catch {close $f} ; exit } }
}
logline "probe v6 start (build=pre, INIT bp=0x4010, slots=4, colorBase=#F420, oracle=pool-derived expected colour block)"
after frame tick
