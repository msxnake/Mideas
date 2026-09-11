# FG fast-copy A1 probe v3 (canal exchange.txt [Codex-008] requirements):
#   1. Full VRAM dumps of the FG pattern (32B) and colour (16B) transfers per
#      slot, compared AUTOMATICALLY against the expected bytes read back from
#      the ROM itself (bitmap_room_foreground_patterns/colors + room table).
#   2. Explicit reset detector: breakpoint on the cartridge INIT entry
#      (#4010, from the 'AB' header); exactly ONE hit allowed per run.
#   3. Real verdict: sat/dump/boot failures accumulate; PASS requires all
#      clean. RUN-COMPLETE only means the script reached the end.
#   4. Captures with throttle on + settle delay so the frame is a stable
#      render, not a mid-blanking artifact.
# Addresses from THIS build's .sym (identical in pre/post builds):
#   current_screen_index=0xC00B  player_x=0xC001
#   bitmap_room_foreground_patterns=0x6077  colors=0x60D7  ptr_table=0x6113
#   FG SAT slots = first hardware slots: #F600 (slot 0), #F604 (slot 1)
#   FG VRAM pattern group per slot = 8+slot (#F800 + group*32); colours #F400+slot*16
#   Keyboard row 8: RIGHT=0x80, LEFT=0x10, SPACE=0x01
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-fg/fg_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

set throttle off

# --- reset detector: count entries through the cartridge INIT entry ---
set boot_hits 0
debug set_bp 0x4010 {} { incr ::boot_hits ; debug cont }

proc mem8 {addr} { return [debug read memory $addr] }
proc vram8 {addr} { return [debug read VRAM $addr] }

set IDX 0xC00B
set PX 0xC001
set ROM_PAT 0x6077
set ROM_COL 0x60D7
set ROM_PTR 0x6113
set FG_COUNT 2
set GROUP_BASE 8

set SETTLE 500
set STABLE 100
set GUARD 4500
set phase 0
set phasecnt 0
set f1 -1
set f2 -1
set sat_fails 0
set dump_fails 0
set capture_errors 0
set capture_pending 0
set capture_done 1
set capture_label ""
set capture_path ""
set sawB 0
set sawAreturn 0
set done 0
set tickerr 0
set anomalies {}

proc hexrow {addr n reader} {
    set out {}
    for {set i 0} {$i < $n} {incr i} { lappend out [format %02X [$reader [expr {$addr + $i}]]] }
    return [join $out]
}

# Verify FG VRAM content of the CURRENT room against the ROM truth tables.
# Checks BOTH the SAT bytes (Y,X,pat,EC per slot) and the full pattern/colour
# transfers. Returns a text dump for the log; accumulates sat_fails and
# dump_fails on mismatch.
proc fg_verify {idx} {
    global ROM_PAT ROM_COL ROM_PTR FG_COUNT GROUP_BASE dump_fails sat_fails
    set report {}
    set tblLo [mem8 [expr {$ROM_PTR + $idx * 2}]]
    set tblHi [mem8 [expr {$ROM_PTR + $idx * 2 + 1}]]
    set tbl [expr {$tblHi * 256 + $tblLo}]
    for {set slot 0} {$slot < $FG_COUNT} {incr slot} {
        set tblY  [mem8 [expr {$tbl + $slot * 3}]]
        set tblX  [mem8 [expr {$tbl + $slot * 3 + 1}]]
        set patOff [mem8 [expr {$tbl + $slot * 3 + 2}]]
        set patNum [expr {($GROUP_BASE + $slot) * 4}]
        set satAddr [expr {0xF600 + $slot * 4}]
        set satGot [hexrow $satAddr 4 vram8]
        set patVram [expr {0xF800 + ($GROUP_BASE + $slot) * 32}]
        set colVram [expr {0xF400 + $slot * 16}]
        set patGot [hexrow $patVram 32 vram8]
        set colGot [hexrow $colVram 16 vram8]
        if {$patOff == 0xFF} {
            set satWant "[format %02X 0xD4] 00 [format %02X $patNum] 00"
            lappend report "slot$slot=EMPTY(sat:$satGot)"
            if {$satGot ne $satWant} {
                incr sat_fails
                logline "SAT-FAIL room=$idx slot=$slot EMPTY: got=$satGot want=$satWant"
            }
            continue
        }
        set satWant "[format %02X $tblY] [format %02X $tblX] [format %02X $patNum] 00"
        lappend report "slot${slot}(off=[format %02X $patOff]) sat:$satGot pat:$patGot col:$colGot"
        if {$satGot ne $satWant} {
            incr sat_fails
            logline "SAT-FAIL room=$idx slot=$slot: got=$satGot want=$satWant"
        }
        set patWant [hexrow [expr {$ROM_PAT + $patOff * 32}] 32 mem8]
        set colWant [hexrow [expr {$ROM_COL + $patOff * 16}] 16 mem8]
        if {$patGot ne $patWant} {
            incr dump_fails
            logline "DUMP-FAIL room=$idx slot=$slot PATTERN: got=$patGot want=$patWant"
        }
        if {$colGot ne $colWant} {
            incr dump_fails
            logline "DUMP-FAIL room=$idx slot=$slot COLOUR: got=$colGot want=$colWant"
        }
    }
    logline "DUMP room=$idx [join $report { }]"
}

proc sat_state {} {
    return "[hexrow 0xF600 4 vram8] | [hexrow 0xF604 4 vram8]"
}

proc begin_capture {label path} {
    global capture_pending capture_done capture_label capture_path throttle
    set capture_pending 1
    set capture_done 0
    set capture_label $label
    set capture_path $path
    set throttle on
    # Real-time settle at throttle-on so the VDP renders a stable frame.
    # openMSX overrides `after`: plain `after 600` never fires — it needs a mode.
    after time 0.5 {
        global capture_done capture_label capture_path capture_pending throttle f
        if {[catch {
            screenshot -raw $capture_path
            logline "   captured $capture_label -> $capture_path"
        } capErr]} {
        incr capture_errors
        logline "CAPTURE-ERROR: $capErr"
    }
        set throttle off
        set capture_done 1
        set capture_pending 0
    }
}

proc finish {verdict} {
    global f anomalies boot_hits sat_fails dump_fails capture_errors tickerr f1 f2 phasecnt sawB sawAreturn
    logline "transition-frames: to-B=$f1 to-A=$f2 total=$phasecnt"
    logline "boot_hits=$boot_hits sat_fails=$sat_fails dump_fails=$dump_fails capture_errors=$capture_errors tickerr=$tickerr sawB=$sawB sawAreturn=$sawAreturn"
    logline "anomalies: [expr {[llength $anomalies] ? [join $anomalies { ; }] : {none}}]"
    logline "VERDICT: $verdict"
    close $f
    exit
}

proc tick {} {
    global phase phasecnt SETTLE STABLE GUARD f1 f2 anomalies IDX PX done tickerr stuckcnt
    global capture_pending capture_done sawB sawAreturn boot_hits sat_fails dump_fails capture_errors
    # `after frame` is one-shot in openMSX: every path must re-arm itself.
    after frame tick
    if {$capture_pending} {
        incr stuckcnt
        if {$stuckcnt == 1 || $stuckcnt % 1500 == 0} { logline "CAPTURE-STUCK phase=$phase ticks=$stuckcnt" }
        return
    }
    set stuckcnt 0
    if {[catch {
        incr phasecnt
        if {$phase >= 1 && $phase <= 4} {
            set idx [mem8 $IDX]
            if {$idx != 0 && $idx != 1} { lappend anomalies "frame=$phasecnt idx-out-of-range=$idx" }
        }
        switch $phase {
            0 {
                if {$phasecnt >= $SETTLE} {
                    logline "regs: R0=[debug read {VDP regs} 0] R1=[debug read {VDP regs} 1] R2=[debug read {VDP regs} 2] border=[debug read {VDP regs} 7]"
                    begin_capture "ROOM-A-INIT" "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-fg/fg_roomA_init.png"
                    set phase 10 ; set phasecnt 0
                }
            }
            10 {
                if {$capture_done} {
                    logline "== ROOM-A-INIT: idx=[mem8 $IDX] px=[mem8 $PX]"
                    fg_verify 0
                    keymatrixdown 8 0x80
                    set phase 1 ; set phasecnt 0
                }
            }
            1 {
                set idx [mem8 $IDX]
                if {$idx == 1} {
                    set f1 $phasecnt
                    logline "reached-B at hold-frame=$phasecnt px=[mem8 $PX]"
                    set phase 2 ; set phasecnt 0
                } elseif {$phasecnt >= $GUARD} {
                    finish "FAIL no-transition-to-B in $GUARD frames (px=[mem8 $PX])"
                }
            }
            2 {
                if {$phasecnt >= $STABLE} {
                    begin_capture "ROOM-B-STABLE" "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-fg/fg_roomB_stable.png"
                    set phase 20 ; set phasecnt 0
                }
            }
            20 {
                if {$capture_done} {
                    logline "== ROOM-B-STABLE: idx=[mem8 $IDX] px=[mem8 $PX]"
                    fg_verify 1
                    set sawB 1
                    keymatrixup 8 0x80
                    keymatrixdown 8 0x10
                    set phase 3 ; set phasecnt 0
                }
            }
            3 {
                set idx [mem8 $IDX]
                if {$idx == 0} {
                    set f2 $phasecnt
                    logline "reached-A at hold-frame=$phasecnt px=[mem8 $PX]"
                    set phase 4 ; set phasecnt 0
                } elseif {$phasecnt >= $GUARD} {
                    finish "FAIL no-return-to-A in $GUARD frames (px=[mem8 $PX])"
                }
            }
            4 {
                if {$phasecnt >= $STABLE} {
                    begin_capture "ROOM-A-RETURN" "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-screen5-fg/fg_roomA_return.png"
                    set phase 30 ; set phasecnt 0
                }
            }
            30 {
                if {$capture_done} {
                    logline "== ROOM-A-RETURN: idx=[mem8 $IDX] px=[mem8 $PX]"
                    fg_verify 0
                    set sawAreturn 1
                    keymatrixup 8 0x10
                    set phase 5 ; set phasecnt 0
                }
            }
            5 {
                if {$phasecnt >= 30 && !$done} {
                    set done 1
                    logline "RUN-COMPLETE"
                    if {$boot_hits == 1 && $sat_fails == 0 && $dump_fails == 0 && $capture_errors == 0 && $tickerr == 0 && [llength $anomalies] == 0 && $sawB && $sawAreturn} {
                        finish "PASS"
                    } else {
                        finish "FAIL boot=$boot_hits sat=$sat_fails dump=$dump_fails capErr=$capture_errors tickErr=$tickerr anomalies=[llength $anomalies] sawB=$sawB sawAreturn=$sawAreturn"
                    }
                }
            }
        }
    } e]} {
        incr tickerr
        if {$tickerr <= 3 || $tickerr % 500 == 0} { logline "TICK-ERROR($tickerr): $e" }
    }
}

logline "probe v3 start (reset bp at 0x4010 armed)"
after frame tick
