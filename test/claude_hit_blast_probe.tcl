# Claude probe: where does the HIT BLAST land relative to the boss?
#
# Symbols from server/temp/claude_test567_diag.sym (THIS build):
#   bitmap_boss_hit_blast_draw 0x64B3   bitmap_boss_launch_cmd 0x6344
#   boss_blast_timer 0xD10D  boss_blast_len 0xD10E
#   boss_blast_x 0xD10F      boss_blast_y 0xD110
#   boss_x 0xD0D4  boss_y 0xD0D5  boss_active 0xD0D3  boss_slot 0xD11A
#   boss_cmd_buf 0xD0E0      current_screen_index 0xC00B
#
# The player cannot reach the bosses by shooting (they orbit at y=40..60), so
# the blast is armed directly in RAM with the zone centre Jordi authored
# (zone_1 x=1 y=2 w=13 h=13 -> centre 7,8). That exercises the REAL draw path;
# only the trigger is shortcut.

set base "C:/Users/salam/Documents/Programacion/Mideas/server/temp/claude_hit_blast"
carta "C:/Users/salam/Documents/Programacion/Mideas/server/temp/claude_test567_diag.rom"

set LOG [open "${base}.txt" w]
set armed 0
set shots 0

proc rb {a} { return [debug read memory $a] }
proc rw {a} { return [expr {[debug read memory $a] | ([debug read memory [expr {$a+1}]] << 8)}] }

# Dump the command the blast produced, next to where the boss actually is.
proc onblast {} {
    global LOG shots
    set cmdb [rb 0xD0EE]
    if {$cmdb != 152} return
    if {$shots >= 40} return
    incr shots
    set bx [rb 0xD0D4]
    set by [rb 0xD0D5]
    set dx [rw 0xD0E4]
    set dy [rw 0xD0E6]
    set nx [rw 0xD0E8]
    set ny [rw 0xD0EA]
    set cmd [rb 0xD0EE]
    # The body occupies boss_x..boss_x+15 and boss_y+gameY..+15 on screen.
    puts $LOG [format "blast slot=%d boss=(%3d,%3d) cuerpo_en_pantalla=(%d..%d, %d..%d)  ->  DX=%3d DY=%3d NX=%3d NY=%3d CMD=%02X" \
        [rb 0xD11A] $bx $by $bx [expr {$bx+15}] [expr {$by+20}] [expr {$by+35}] $dx $dy $nx $ny $cmd]
    flush $LOG
}

debug set_bp 0x6344 {} onblast

proc arm {} {
    global LOG armed
    set scr [rb 0xC00B]
    set act [rb 0xD0D3]
    if {$act == 1 && $scr != 255 && !$armed} {
        set armed 1
        puts $LOG "== sala cargada: slot=[rb 0xD11A] boss=([rb 0xD0D4],[rb 0xD0D5]) =="
        # Read the borrowed stamp fields the draw uses: room table +21..+26.
        # bitmap_boss_table_ix stages the table in RAM; grab IX by breaking on
        # the blast draw itself instead of guessing the address.
        puts $LOG "== armando blast en el centro de zone_1 (7,8) =="
        flush $LOG
        debug write memory 0xD10F 7      ;# boss_blast_x
        debug write memory 0xD110 8      ;# boss_blast_y
        debug write memory 0xD10E 30     ;# boss_blast_len
        debug write memory 0xD10D 30     ;# boss_blast_timer -> draw fires
        rearm
        after time 1.0 [list screenshot "${::base}_a.png"]
        after time 6.0 [list finish]
        return
    }
    after time 0.05 arm
}

# Slot 1 keeps its own saved copy of the blast fields (instance state block at
# 0xD13D, blast_timer at +18), so writing only the live vars never reaches it.
proc rearm {} {
    debug write memory 0xD10F 7
    debug write memory 0xD110 8
    debug write memory 0xD10E 30
    debug write memory 0xD10D 30
    debug write memory 0xD151 7      ;# slot1 blast_x
    debug write memory 0xD152 8      ;# slot1 blast_y
    debug write memory 0xD150 30     ;# slot1 blast_len
    debug write memory 0xD14F 30     ;# slot1 blast_timer
    after time 0.10 rearm
}

proc finish {} {
    global LOG shots
    puts $LOG "== fin: $shots comandos capturados =="
    close $LOG
    exit
}

after time 8.0 arm
after time 40 { finish }
