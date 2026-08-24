# Claude probe: dump every VDP command block issued from the moment the boss
# dies, to find which blit paints outside the 16x16 body.
#
# Addresses resolved from server/temp/claude_test567_diag.sym (THIS build):
#   bitmap_boss_update 0x5CFB  bitmap_boss_touch 0x651E  bitmap_boss_kill 0x68C9
#   bitmap_boss_launch_cmd 0x6344   boss_cmd_buf 0xD0E0
#   boss_active 0xD0D3  boss_hp 0xD0DA  boss_x 0xD0D4  boss_y 0xD0D5
#   boss_slot 0xD11A    current_screen_index 0xC00B
#   boss_instance_state 0xD11B, 0x22 bytes per slot, hp at +7
#
# boss_cmd_buf layout: +0 SX, +2 SY, +4 DX, +6 DY, +8 NX, +10 NY, +14 CMD.
#
# DECLARED INTERFERENCE: the player cannot reach the bosses (they orbit at
# y=40..60, the player shoots from the floor), so the kill is forced by
# vectoring PC to bitmap_boss_kill from bitmap_boss_touch, where IX already
# points at the room table. The whole normal death path then runs by itself:
# laser restore, death FX table, body rebuild. Nothing else is patched.

set base "C:/Users/salam/Documents/Programacion/Mideas/server/temp/claude_test567"
carta "${base}_diag.rom"

set LOG [open "${base}_vdp_dump.txt" w]
set logging 0
set nlog 0
set armed 0
set killed 0

proc rb {a} { return [debug read memory $a] }
proc rw {a} { return [expr {[debug read memory $a] | ([debug read memory [expr {$a+1}]] << 8)}] }

# Every launch while the boss is dying. These are raw VDP words: a DX over 255
# or a DY outside the game band is already the bug.
proc dumpcmd {} {
    global LOG logging nlog
    if {!$logging} return
    if {$nlog >= 400} return
    incr nlog
    set sx [rw 0xD0E0]
    set sy [rw 0xD0E2]
    set dx [rw 0xD0E4]
    set dy [rw 0xD0E6]
    set nx [rw 0xD0E8]
    set ny [rw 0xD0EA]
    set cmd [rb 0xD0EE]
    set bx [rb 0xD0D4]
    set by [rb 0xD0D5]
    set sl [rb 0xD11A]
    set flag ""
    if {$sx > 511 || $sy > 1023} { set flag "  <== BASURA" }
    # Return address on top of the stack: names the routine that issued this
    # command, which is what we actually need to fix.
    set ixr [reg ix]
    set sp [reg sp]
    set ret [expr {[debug read memory $sp] | ([debug read memory [expr {$sp+1}]] << 8)}]
    puts $LOG [format "%03d slot=%d boss=(%3d,%3d)  SX=%5d SY=%5d -> DX=%4d DY=%4d  NX=%3d NY=%3d  CMD=%02X  ret=%04X IX=%04X%s" \
        $nlog $sl $bx $by $sx $sy $dx $dy $nx $ny $cmd $ret $ixr $flag]
    flush $LOG
}

debug set_bp 0x6344 {} dumpcmd

# Force the death once the room is up and settled.
proc dokill {} {
    global LOG killed
    if {$killed} return
    set killed 1
    debug remove_bp $::killbp
    puts $LOG "== forzando muerte: slot=[rb 0xD11A] boss=([rb 0xD0D4],[rb 0xD0D5]) =="
    flush $LOG
    debug write memory 0xD0DA 0
    set ::logging 1
    reg pc 0x68C9
    set b "C:/Users/salam/Documents/Programacion/Mideas/server/temp/claude_test567_kill"
    after time 0.10 [list screenshot "${b}_t0.png"]
    after time 0.30 [list screenshot "${b}_t1.png"]
    after time 0.60 [list screenshot "${b}_t2.png"]
    after time 1.20 [list screenshot "${b}_t3.png"]
    after time 2.50 [list screenshot "${b}_t4.png"]
    after time 5.0 [list finish]
}

proc arm {} {
    global logging armed LOG killed
    if {$killed} return
    set scr [rb 0xC00B]
    set act [rb 0xD0D3]
    if {$act == 1 && $scr != 255} {
        if {!$armed} {
            set armed 1
            puts $LOG "== sala cargada: screen=$scr boss=([rb 0xD0D4],[rb 0xD0D5]) hp=[rb 0xD0DA] =="
            flush $LOG
            # Let the encounter settle (intro, first laser wave), then kill.
            set ::killbp [debug set_bp 0x651E {} dokill]
            return
        }
    }
    after time 0.05 arm
}

proc finish {} {
    global LOG nlog
    puts $LOG "== fin: $nlog comandos registrados =="
    close $LOG
    exit
}

after time 8.0 arm
after time 45 { finish }
