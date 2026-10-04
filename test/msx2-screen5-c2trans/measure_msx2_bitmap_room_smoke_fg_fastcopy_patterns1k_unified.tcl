# C2 room-transition baseline measurement (ACUERDO C2-medicion).
# ROM sha256: 6de775a8335b1f4cfe8a7851213f51ecb93d13e4b66733258a90c93b45e548fc
# SYM sha256: 215e3be2aa41c925c978a7e0af57db65b3160f8adf7b21fd480de9dca6845034
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-c2trans/measure_msx2_bitmap_room_smoke_fg_fastcopy_patterns1k_unified.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
proc mem8 {a} { return [debug read memory $a] }
proc vram8 {a} { return [debug read VRAM $a] }
proc now {} { return [machine_info time] }

set boot_hits 0
set tickErrors 0
set phase 0
set frames 0
set phaseFrames 0
set lastIdx -1
set transActive 0
set transStartFrame 0
set transCount 0
set restoreCalls 0
set restoreBytesTotal 0
set restoreUsecTotal 0
set exitBpSet 0
set composing 0
set composeStart 0
set restoreT0 ""
set restoreCaller ""
set snapA1 ""
set satA1 ""

debug set_bp 0x4010 {} { incr ::boot_hits ; debug cont }
debug set_bp 0x464A {} { on_frame ; debug cont }

# Transition trigger: edge queued.
debug set_bp 0x4409 {} {
    if {$::phase >= 1 && !$::transActive} {
        set ::transActive 1
        set ::transStartFrame $::frames
        logline "TRANS-PROBE-FIRST frame=$::frames idx=[mem8 0xC00B] px=[mem8 0xC001] (per-frame probe begins)"
    }
    debug cont
}

# Commit: hidden page published.
debug set_bp 0x44DC {} {
    if {$::transActive} {
        set ::transActive 0
        incr ::transCount
        set cwin [expr {$::composing ? ($::frames - $::composeStart) : -1}]
        logline "TRANS-COMMIT #$::transCount frame=$::frames idx=[mem8 0xC00B] composeFrames=$cwin"
        set ::composing 0
    }
    debug cont
}

# Restore patterns: classify by caller, capture BC/HL/DE, time via exit bp.
# Restore entry: time the whole routine via its single return address.
debug set_bp 0x45CA {} {
    set ::restoreT0 [now]
    incr ::restoreCalls
    if {!$::exitBpSet} {
        set ::exitBpSet 1
        debug set_bp 0x45A0 {} {
            if {$::restoreT0 ne ""} {
                set us [expr {int(([now] - $::restoreT0)*1000000)}]
                set ::restoreUsecTotal [expr {$::restoreUsecTotal + $us}]
                logline "RESTORE-END usec=$us"
                set ::restoreT0 ""
            }
            debug cont
        }
    }
    debug cont
}
# The real copy: BC/HL/DE valid here (loaded immediately before).
debug set_bp 0x45D8 {} {
    set bc [expr {[reg b]*256 + [reg c]}]
    set hl [expr {[reg h]*256 + [reg l]}]
    set de [expr {[reg d]*256 + [reg e]}]
    set ::restoreBytesTotal [expr {$::restoreBytesTotal + $bc}]
    logline "COPY bytes=$bc hl=[format %04X $hl] de=[format %04X $de]"
    debug cont
}
# Composition window: first step after idle = transition work begins.
debug set_bp 0x447F {} {
    if {$::phase >= 1 && !$::composing} {
        set ::composing 1
        set ::composeStart $::frames
        logline "COMPOSE-START frame=$::frames"
    }
    debug cont
}

proc sat_dump {} {
    set out {}
    for {set i 0} {$i < 16} {incr i} { lappend out [format %02X [vram8 [expr {0xF600+$i}]]] }
    return [join $out]
}

proc on_frame {} {
    global phase frames phaseFrames lastIdx transActive tickErrors snapA1 satA1
    if {[catch {
        incr frames
        incr phaseFrames
        set idx [mem8 0xC00B]
        if {$idx != $lastIdx} { logline "IDX $lastIdx -> $idx at frame $frames" ; set lastIdx $idx }
        if {$phase == 0} {
            if {$phaseFrames == 400} {
                set snapA1 [sat_dump]
                logline "SAT stableA-start $snapA1"
            }
            if {$phaseFrames >= 600} {
                set phase 1 ; set phaseFrames 0
                logline "--- walking RIGHT (cycle 1)"
                keymatrixdown 8 0x80
            }
        } elseif {$phase >= 1 && $phase <= 6} {
            # cycles: odd phases walk RIGHT to room B, even walk LEFT to room A
            set want [expr {$phase % 2 == 1 ? 1 : 0}]
            if {$idx == $want && $phaseFrames > 30} {
                keymatrixup 8 [expr {$phase % 2 == 1 ? 0x80 : 0x10}]
                incr phase
                set phaseFrames 0
                if {$phase <= 6} {
                    set dir [expr {$phase % 2 == 1 ? "RIGHT" : "LEFT"}]
                    logline "--- walking $dir (cycle [expr {($phase+1)/2}])"
                    keymatrixdown 8 [expr {$phase % 2 == 1 ? 0x80 : 0x10}]
                }
            } else {
                set k [expr {$phase % 2 == 1 ? 0x80 : 0x10}]
                if {$phaseFrames % 30 == 0} { keymatrixdown 8 $k }
            }
        }
        if {$phase == 7} { finish }
    } e]} {
        incr tickErrors
        if {$tickErrors <= 5} { logline "FRAME-ERROR($frames): $e" }
    }
}

proc finish {} {
    global f frames boot_hits tickErrors restoreCalls restoreBytesTotal restoreUsecTotal transCount satA1
    set satA2 [sat_dump]
    logline "SAT stableA-end   $satA2"
    logline "TOTAL frames=$frames boot_hits=$boot_hits tickErrors=$tickErrors transitions=$transCount restoreCalls=$restoreCalls restoreBytes=$restoreBytesTotal restoreUsecTotal=$restoreUsecTotal"
    logline [expr {($boot_hits == 1 && $tickErrors == 0 && $transCount >= 6 && $restoreCalls > 0) ? "INSTRUMENT: CLEAN" : "INSTRUMENT: DIRTY"}]
    logline "MEASUREMENT-COMPLETE baseline (no patch applied)"
    close $f
    exit
}

logline "measure start ROM=6de775a8335b1f4c... INIT=0x4010 restore=0x45CA commit=0x44DC startTrans=0x4409"
