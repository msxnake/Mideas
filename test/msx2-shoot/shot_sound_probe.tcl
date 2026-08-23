# Authored shot sound, probed on hardware timing.
#
# The fire key is PPI row 4, bit 3 (from bitmap_shoot_pressed in the build).
# Claims:
#   - firing arms the sequencer (bitmap_shoot_sfx_active goes 1)
#   - it walks the three compiled records (the frame countdown reloads twice)
#   - PSG channel C volume actually changes: the sound reaches the chip
#   - it ends by itself (active back to 0, volume silenced)
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-shoot/shot_sound_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
proc psg {reg} { return [debug read "PSG regs" $reg] }
set throttle off

set ACTIVE 0xC0E9
set TIMER  0xC0EA

set seen {}
set volseen {}
set watching 0
set activeframes 0

proc watch {} {
    global ACTIVE TIMER seen volseen watching activeframes
    if {$watching} {
        set a [mem8 $ACTIVE]
        set t [mem8 $TIMER]
        set v [psg 10]
        set key "a=$a t=$t volC=$v"
        if {[lsearch $seen $key] < 0} { lappend seen $key }
        if {$a} { incr activeframes }
        if {[lsearch $volseen $v] < 0} { lappend volseen $v }
    }
    after frame watch
}

foreach t {6 8 10} { after time $t "keymatrixdown 8 0x01" ; after time [expr {$t + 0.5}] "keymatrixup 8 0x01" }
after time 13 {
    watch
    logline "before fire: active=[mem8 $ACTIVE] volC=[psg 10] mixer=[psg 7]"
}
after time 14 { set watching 1 ; keymatrixdown 4 0x08 }
after time 14.2 { keymatrixup 4 0x08 }
after time 16 {
    global seen volseen activeframes
    logline "states seen after firing: $seen"
    logline "distinct channel-C volumes: $volseen"
    logline "frames with the sequencer active: $activeframes"
    logline "after it ends: active=[mem8 $ACTIVE] volC=[psg 10] mixer=[psg 7]"
    after time 1 { exit }
}
