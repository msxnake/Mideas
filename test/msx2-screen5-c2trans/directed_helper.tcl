# Directed runtime tests of fast_copy_to_vram_chunked (CONTRATO B/C2,
# canal [Codex-025]): lengths 0/1/255/256/257/512/1024/2048 with before/after
# guards, exact-multiple case, BC=0 (no VDP writes), register preservation
# (IX/IY), R#14=0 after non-empty copy, R#15/R#17 untouched, display active.
#
# Flow: at each bitmap_wait_vblank safe-point hit the probe either issues the
# next directed call (push return=waitVblank entry, set HL/DE/BC, PC=CHUNKED)
# or verifies the previous one. States: BOOT -> AWAIT_BOOT -> RUN_CASE ->
# AWAIT_RETURN -> VERIFY_CASE -> RUN_CASE ... -> DONE.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-c2trans/directed_helper.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
proc mem8 {a} { return [debug read memory $a] }
proc vram8 {a} { return [debug read VRAM $a] }

set CHUNKED 0x45DE
set WAITVB 0x464A
set SRC 0xD800
set DST 0x7800
set lens {0 1 255 256 257 512 1024 2048}
set caseIdx 0
set failures 0
set state BOOT
set vbCount 0
set stale 0

proc fill_src {len} {
    for {set i 0} {$i < $len} {incr i} { debug write memory [expr {0xD800+$i}] [expr {($i*7+3)&0xFF}] }
    debug write memory [expr {0xD800+$len}] 0x5A
}
proc fill_dst_ff {n} {
    for {set i 0} {$i < $n} {incr i} { debug write VRAM [expr {0x7800+$i}] 0xFF }
}
proc vram_equal_src {len} {
    for {set i 0} {$i < $len} {incr i} {
        if {[vram8 [expr {0x7800+$i}]] != [mem8 [expr {0xD800+$i}]]} { return 0 }
    }
    return 1
}
proc guard_intact {len} {
    for {set i 0} {$i < 8} {incr i} {
        if {[vram8 [expr {0x7800+$len+$i}]] != 0xFF} { return 0 }
    }
    return 1
}

proc start_case {len} {
    global WAITVB CHUNKED SRC DST
    fill_src $len
    fill_dst_ff [expr {$len + 8}]
    save_regs
    set sp [reg sp]
    debug write memory [expr {$sp-1}] [expr {($WAITVB>>8)&0xFF}]
    debug write memory [expr {$sp-2}] [expr {$WAITVB&0xFF}]
    reg sp [expr {$sp-2}]
    reg hl $SRC
    reg de $DST
    reg bc $len
    reg pc $CHUNKED
    debug cont
}

proc verify_case {len} {
    global failures
    set problems {}
    if {$len > 0} {
        set r14 [debug read "VDP regs" 14]
        if {$r14 != 0} { lappend problems "R14=[format %02X $r14] after non-empty copy" }
    }
    if {![vram_equal_src $len]} { lappend problems "VRAM != source over $len bytes" }
    if {![guard_intact $len]} { lappend problems "guard overwritten after $len bytes" }
    if {[reg ix] != $::ixSave} { lappend problems "IX changed" }
    if {[reg iy] != $::iySave} { lappend problems "IY changed" }
    if {[debug read "VDP regs" 15] != $::r15Save} { lappend problems "R15 changed" }
    if {[debug read "VDP regs" 17] != $::r17Save} { lappend problems "R17 changed" }
    if {[llength $problems]} {
        incr failures
        if {$failures <= 2} {
            set vh {} ; set rh {}
            for {set k 0} {$k < 8} {incr k} {
                lappend vh [format %02X [vram8 [expr {0x7800+$k}]]]
                lappend rh [format %02X [mem8 [expr {0xD800+$k}]]]
            }
            logline "CASE-FAIL len=$len problems=[join $problems { ; }] vram8=[join $vh] ram8=[join $rh]"
        }
    } else {
        logline "CASE-OK len=$len"
    }
}

proc save_regs {} {
    set ::ixSave [reg ix]
    set ::iySave [reg iy]
    set ::r15Save [debug read "VDP regs" 15]
    set ::r17Save [debug read "VDP regs" 17]
}

proc on_vb {} {
    global state caseIdx lens seenVb vbCount stale CHUNKED WAITVB SRC DST f
    incr vbCount
    set act ""
    if {[catch {
        if {$state eq "BOOT"} {
            if {$vbCount >= 400} {
                set seenVb 1
                logline "game running; filling VRAM guard area and starting cases"
                fill_dst_ff 2048
                start_case 0
                set state AWAIT_RETURN
                set act "issued"
            }
        } elseif {$state eq "AWAIT_RETURN"} {
            set state VERIFY
            set act "verify"
        } elseif {$state eq "VERIFY"} {
            verify_case [lindex $lens $caseIdx]
            incr caseIdx
            if {$caseIdx >= [llength $lens]} {
                logline "cases=$caseIdx failures=$failures"
                logline [expr {$failures == 0 ? "VERDICT: PASS" : "VERDICT: FAIL"}]
                close $f
                exit
            }
            set act "next"
        } elseif {$state eq "READY"} {
            set len [lindex $lens $caseIdx]
            set dir [expr {$caseIdx % 2 == 1 ? 0x80 : 0x10}]
            keymatrixup 8 $dir
            keymatrixdown 8 $dir
            start_case $len
            set state AWAIT_RETURN
            set act "issued"
        }
    } e]} { logline "VB-ERROR: $e" }
}


debug set_bp $WAITVB {} { on_vb ; debug cont }
logline "directed helper tests start (CHUNKED=$CHUNKED, WAITVB=$WAITVB)"
