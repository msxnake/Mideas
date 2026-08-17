# Boot -> skip the GameFlow intro with SPACE -> confirm the game runs.
# A ROM that lost a data bank under a reader shows up as a frozen player, a
# corrupted bitmap or garbage sprite colours.
set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-resident"
set f [open "$dir/_boot.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }
proc rb {a} { debug read memory $a }
set PX 0xC001
set PY 0xC000
set ROOM 0xC00B
# Tap SPACE/fire for a while to walk through every intro node.
for {set t 8} {$t < 26} {set t [expr {$t + 1.5}]} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.3}] "keymatrixup 8 0x01"
}
after time 28 {
    L "en juego? player=([rb $PX],[rb $PY]) room=[rb $ROOM]"
    catch {screenshot -raw "$dir/_boot_a.png"}
    set ::x0 [rb $PX]
    set ::room [rb $ROOM]
    keymatrixdown 8 0x80
}
after time 30 {
    keymatrixup 8 0x80
    after time 0.5 {
        set x1 [rb $PX]
        L "tras andar 2s: player=($x1,[rb $PY]) room=[rb $ROOM]  (antes x=$::x0)"
        if {$::room != 255 && $x1 != $::x0} { L "PASS  el juego corre y el player se mueve" } else { L "FAIL  no se llego al juego o el player no responde" }
        catch {screenshot -raw "$dir/_boot_b.png"}
        close $f
        exit
    }
}
