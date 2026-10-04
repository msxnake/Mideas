# C2 integration probe (restore timing + full integrity per transition).
# STEM: msx2_bitmap_room_smoke_fg_fastcopy_post256_unified
# ROM sha256: 2555925911ef986caa1b164543bf13d6c557f4e8d4586e08b25fc4c50a002257
# patternsOff=62888 len=256; attrsOff=8596 len=12 satBase=62984
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-c2trans/measure2_msx2_bitmap_room_smoke_fg_fastcopy_post256_unified.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
set throttle off
proc mem8 {a} { return [debug read memory $a] }
proc vram8 {a} { return [debug read VRAM $a] }
proc rombyte {off} { binary scan [string index $::romdata $off] c v; if {$v < 0} { incr v 256 }; return $v }
set chan [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/msx2_bitmap_room_smoke_fg_fastcopy_post256_unified.rom" rb]
fconfigure $chan -translation binary
set romdata [read $chan]
close $chan

set boot_hits 0
set tickErrors 0
set frames 0
set phaseFrames 0
set phase 0
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
set lastBC 0
set integBad 0
set patChecks 0
set satChecks 0

debug set_bp 0x4010 {} { incr ::boot_hits ; debug cont }
debug set_bp 0x464A {} { on_frame ; debug cont }
debug set_bp 0x4409 {} {
    if {$::phase >= 1 && !$::transActive} {
        set ::transActive 1
        set ::transStartFrame $::frames
    }
    debug cont
}
debug set_bp 0x44DC {} {
    if {$::transActive} {
        set ::transActive 0
        incr ::transCount
        logline "TRANS-COMMIT #$::transCount frame=$::frames idx=[mem8 0xC00B]"
    }
    debug cont
}
debug set_bp 0x45D8 {} {
    set ::lastBC [expr {[reg b]*256 + [reg c]}]
    set ::restoreBytesTotal [expr {$::restoreBytesTotal + $::lastBC}]
    set ::satSnap {}
    for {set j 0} {$j < 16} {incr j} { lappend ::satSnap [vram8 [expr {62984+$j}]] }
    debug cont
}
debug set_bp 0x45CA {} {
    set ::restoreT0 [machine_info time]
    incr ::restoreCalls
    if {!$::exitBpSet} {
        set ::exitBpSet 1
        debug set_bp 0x45A0 {} {
            if {$::restoreT0 ne ""} {
                set us [expr {int(([machine_info time] - $::restoreT0)*1000000)}]
                set ::restoreUsecTotal [expr {$::restoreUsecTotal + $us}]
                set ::restoreT0 ""
                # --- integrity after this restore ---
                incr ::integBad [integrity $::restoreCalls $us]
            }
            debug cont
        }
    }
    debug cont
}
debug set_bp 0x447F {} {
    if {$::phase >= 1 && !$::composing} {
        set ::composing 1
        set ::composeStart $::frames
    }
    debug cont
}

proc integrity {id us} {
    set bad 0
    set n $::lastBC
    for {set k 0} {$k < $n} {incr k} {
        incr ::patChecks
        if {[vram8 [expr {0xF800+$k}]] != [rombyte [expr {62888+$k}]]} {
            incr bad
            if {$bad <= 5} { logline "INTEG #$id pattern byte $k vram=[vram8 [expr {0xF800+$k}]] rom=[rombyte [expr {62888+$k}]]" }
        }
    }
    # SAT coherence: the restore call must not touch the SAT at all. The SAT
    # snapshot was taken at the copySite breakpoint (registers already loaded,
    # copy not started); walking-related updates happen outside the call, so
    # SAT must be byte-identical on return. (Entries also get logged.)
    set dump {}
    for {set j 0} {$j < 16} {incr j} {
        set v [vram8 [expr {62984+$j}]]
        lappend dump $v
        incr ::satChecks
        if {$v != [lindex $::satSnap $j]} {
            incr bad
            if {$bad <= 5} { logline "INTEG #$id sat byte $j changed inside restore: [lindex $::satSnap $j] -> $v" }
        }
    }
    logline "SAT-DUMP #$id [join $dump { }]"
    # openMSX MapperIO indexes Konami registers in REVERSE address order:
    # i0 = #A000-#BFFF (P3), i1 = #8000-#9FFF (P2), i2 = #6000, i3 = #4000.
    set m3 [debug read {MapperIO} 0]
    set m2 [debug read {MapperIO} 1]
    if {$m2 != 2 || $m3 != 3} {
        incr bad
        logline "INTEG #$id mapper P2=$m2 P3=$m3 want 2/3"
    }
    logline "RESTORE-END #$id usec=$us bytes=$n integBadHere=$bad mapper=$m2/$m3"
    return $bad
}

proc on_frame {} {
    global phase frames phaseFrames lastIdx transActive tickErrors
    if {[catch {
        incr frames
        incr phaseFrames
        set idx [mem8 0xC00B]
        if {$idx != $lastIdx} { set lastIdx $idx }
        if {$phase == 0} {
            if {$phaseFrames >= 600} {
                set phase 1 ; set phaseFrames 0
                logline "--- walking RIGHT (cycle 1)"
                keymatrixdown 8 0x80
            }
        } elseif {$phase >= 1 && $phase <= 6} {
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
    global f frames boot_hits tickErrors transCount restoreCalls restoreBytesTotal restoreUsecTotal integBad patChecks satChecks
    logline "TOTAL frames=$frames boots=$boot_hits tickErrors=$tickErrors transitions=$transCount restores=$restoreCalls bytes=$restoreBytesTotal usecTotal=$restoreUsecTotal integBad=$integBad patChecks=$patChecks satChecks=$satChecks"
    logline [expr {($boot_hits == 1 && $tickErrors == 0 && $transCount >= 6 && $restoreCalls >= 6 && $integBad == 0) ? "INTEGRITY: OK" : "INTEGRITY: FAILED"}]
    logline "MEASUREMENT-COMPLETE"
    close $f
    exit
}

logline "measure2 start STEM=msx2_bitmap_room_smoke_fg_fastcopy_post256_unified INIT=0x4010 restore=0x45CA copySite=0x45D8 ret=0x45A0 patternsOff=62888 satBase=62984"
