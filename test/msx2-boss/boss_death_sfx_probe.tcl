# SCREEN 5 boss death PSG probe. Boots the fixture, starts the exact death
# presentation state and samples the AY registers while each bitmap blast
# restarts the selected custom Sound FX on channel C.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_death_sfx_probe.txt"
set shot_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/boss_death_sfx.png"
set f [open $log_path "w"]
set speed 100

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    return [expr {[mem8 $addr] | ([mem8 [expr {$addr + 1}]] << 8)}]
}
proc psg {reg} {
    if {[catch {debug read "PSG regs" $reg} value]} { return 0xFF }
    return $value
}
logline "probe script loaded"

set CURRENT_SCREEN 0xC00B
set BOSS_ACTIVE    0xD08E
set DEATH_LEFT     0xD0F1
set DEATH_TICK     0xD0F2
set DEATH_SEED     0xD0F3
set SFX_ACTIVE     0xD0F4
set SFX_TIMER      0xD0F5
set SFX_PTR        0xD0F6

proc sample {tag} {
    global CURRENT_SCREEN BOSS_ACTIVE DEATH_LEFT DEATH_TICK SFX_ACTIVE SFX_TIMER SFX_PTR
    logline [format "%s screen=%d boss=%d left=%d tick=%d sfx=%d/%d ptr=%04X AY R4=%02X R5=%02X R6=%02X R7=%02X R10=%02X R11=%02X R12=%02X R13=%02X" \
        $tag [mem8 $CURRENT_SCREEN] [mem8 $BOSS_ACTIVE] [mem8 $DEATH_LEFT] \
        [mem8 $DEATH_TICK] [mem8 $SFX_ACTIVE] [mem8 $SFX_TIMER] [mem16 $SFX_PTR] \
        [psg 4] [psg 5] [psg 6] [psg 7] [psg 10] [psg 11] [psg 12] [psg 13]]
}

# Enter gameplay/boss room through the fixture's menu.
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}

after time 12.0 { sample "alive" }
after time 12.5 {
    # Same live state bitmap_boss_kill establishes before returning.
    debug write memory 0xD0F1 30
    debug write memory 0xD0F2 1
    debug write memory 0xD0F3 0xA5
    debug write memory 0xD0F4 0
    debug write memory 0xD0F5 0
    debug write memory 0xD08E 2
    sample "armed"
}

for {set i 0} {$i < 42} {incr i} {
    after time [expr {12.52 + $i * 0.0167}] "sample fx[format %02d $i]"
}
after time 12.72 { screenshot $shot_path; logline "SHOTOK $shot_path" }
after time 13.35 {
    sample "final"
    close $f
    exit
}
