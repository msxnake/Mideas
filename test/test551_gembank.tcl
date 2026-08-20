# Bank-culpability probe for the Caverna2 gem hang. Answers Codex's [005]:
#  (a) which mapper bank is mapped where when bitmap_gem_table_buf is staged,
#      vs the bank the room's gem records actually live in;
#  (b) whether the 00-FF garbage is already in table_buf at staging time (bad
#      source read) or appears later;
#  (c) after the CMD=FF launch, the R#15 selection and what the wait loops
#      actually read (stuck CE vs wrong status register).
#
# Method: write-watchpoints on the four Konami segment registers keep a bank
# history; a write-watchpoint on bitmap_gem_staged_room fires exactly when
# staging completes; the expected bytes come straight from the .rom FILE at
# bank*0x2000 so the mapped-bank contents can be diffed against the truth.
set ROMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.rom"
set SYMFILE "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551_boss_claude.sym"
set LOG [open "C:/Users/salam/AppData/Local/Temp/mideas-test551/test551-gembank.log" w]
proc say {m} { global LOG; puts $LOG $m; flush $LOG }

set SYM [dict create]
set fh [open $SYMFILE r]
set symtext [read $fh]
close $fh
foreach line [split $symtext "\n"] {
    if {[regexp {^([A-Za-z_][A-Za-z0-9_]*): equ ([0-9A-Fa-f]+)H} [string trim $line] -> name hex]} {
        scan $hex %x addr
        dict set SYM $name $addr
    }
}
proc sym {n} { global SYM ; return [dict get $SYM $n] }

set R_table   [sym bitmap_gem_table_buf]
set R_staged  [sym bitmap_gem_staged_room]
set R_ptrtab  [sym bitmap_gem_ptr_table]
set R_banktab [sym bitmap_gem_bank_table]
set R_block   [sym bitmap_gem_cmd_block]
set A_launch  [sym bitmap_gem_launch_cmd]
say [format "SYMS table=%04X staged=%04X ptrtab=%04X banktab=%04X block=%04X launch=%04X" \
    $R_table $R_staged $R_ptrtab $R_banktab $R_block $A_launch]

proc w16 {a} { return [expr {[debug read memory $a] | ([debug read memory [expr {$a + 1}]] << 8)}] }

# ---- Konami segment registers: bank history ---------------------------------
set BANKLOG [dict create]
proc bankof {seg} {
    global BANKLOG
    if {[dict exists $BANKLOG $seg]} { return [dict get $BANKLOG $seg] }
    return "?"
}
proc seg_hit {seg} {
    global BANKLOG
    set val [debug read memory $seg]
    if {[bankof $seg] ne $val} {
        dict set BANKLOG $seg $val
        say [format "BANK t=%.3f seg %04X <- bank %d" [machine_info time] $seg $val]
    }
    debug cont
}
foreach seg {16384 24576 32768 40960} {
    if {[catch {debug set_watchpoint write_mem $seg {} [list seg_hit $seg]} err]} {
        say "WP-SETUP-FAIL seg $seg: $err"
    }
}

# ---- expected bytes straight from the ROM image ------------------------------
set ROMFH [open $ROMFILE r]
fconfigure $ROMFH -translation binary
proc rom_bytes {off n} {
    global ROMFH
    seek $ROMFH $off
    binary scan [read $ROMFH $n] H* hex
    return [string toupper $hex]
}

# ---- staging completion: dump source, bank state, table ----------------------
proc staged_wp {} {
    global R_table R_staged R_ptrtab R_banktab
    set room [debug read memory $R_staged]
    set p [expr {$R_ptrtab + 2 * $room}]
    set ptr [w16 $p]
    set bank [debug read memory [expr {$R_banktab + $room}]]
    say [format "STAGED room=%d t=%.3f: ptr=%04X expected_bank=%d" $room [machine_info time] $ptr $bank]
    say [format "BANK STATE AT STAGING seg4000=%s seg6000=%s seg8000=%s segA000=%s" \
        [bankof 16384] [bankof 24576] [bankof 32768] [bankof 40960]]
    set seg [expr {($ptr >> 13) & 3}]
    set segaddr [expr {0x4000 + $seg * 0x2000}]
    say [format "ptr lives in segment %04X; active bank there = %s, expected = %d -> %s" \
        $segaddr [bankof $segaddr] $bank [expr {[bankof $segaddr] eq $bank ? "MATCH" : "MISMATCH"}]]
    set mapped ""
    for {set i 0} {$i < 16} {incr i} {
        append mapped [format "%02X" [debug read memory [expr {$ptr + $i}]]]
    }
    set expected [rom_bytes [expr {$bank * 0x2000 + ($ptr & 0x1FFF)}] 16]
    say "SOURCE as mapped now  @$ptr: $mapped"
    say "ROM FILE at expected bank, same offset: $expected"
    set tbl ""
    for {set i 0} {$i < 16} {incr i} {
        append tbl [format "%02X" [debug read memory [expr {$R_table + $i}]]]
    }
    say "TABLE_BUF right after staging: $tbl"
    debug cont
}
if {[catch {debug set_watchpoint write_mem $R_staged {} { staged_wp }} err]} {
    say "WP-SETUP-FAIL staged_room: $err"
}

# ---- (c) after each launch: block + VDP status -------------------------------
set launches 0
proc gem_launch_bp {} {
    global launches R_block
    incr launches
    set b $R_block
    set cmd [debug read memory [expr {$b + 14}]]
    say [format "LAUNCH #%d t=%.3f CMD=%02X NX=%d NY=%d" $launches [machine_info time] \
        $cmd [w16 [expr {$b + 8}]] [w16 [expr {$b + 10}]]]
    if {$cmd == 0xFF} {
        if {[catch {debug read "VDP regs" 15} r15]} {
            say "  R#15 debuggable unavailable: $r15"
        } else {
            say [format "  R#15 (indicated status register) = %d" $r15]
        }
        set ::fseen 0
        for {set i 0} {$i < 12} {incr i} {
            after time [expr {0.002 * double($i)}] {
                if {![catch {set s0 [debug read "VDP status" 0]}] && ($s0 & 0x80)} {
                    set ::fseen 1
                }
            }
        }
        after time 0.030 {
            say "  S#0 bit7 seen during 30ms sampling after CMD=FF: $::fseen (0 = the polled register never shows VBlank)"
        }
    }
    debug cont
}
after time 0.500 {
    global A_launch
    debug set_bp $A_launch {} { gem_launch_bp }
    say "ARMED"
    debug cont
}

after time 10.000 {
    global launches
    say [format "END t=10 PC=%04X launches=%d" [reg PC] $launches]
    close $LOG
    after time 0.200 { exit }
}
debug cont
