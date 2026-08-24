# Visual check of one authored enemy behaviour, on Jordi's Area51-test room.
#
# Symbols resolved from server/temp/behaviour_visual/<case>.sym of THIS build,
# never inherited from an earlier one:
#   bitmap_enemy_count  #D0D3    1 byte
#   bitmap_enemy_pool   #D0D4    stride 30, mode at +13, script state at +25
#   bitmap_enemy_script_step  0x60D0
#
# INSTRUMENT CHECK FIRST. The probe refuses to take a single screenshot until
# it has seen the slot report mode 14 and the interpreter actually execute a
# step. Both matter: a slot can carry mode 14 and never be reached, and a
# screenshot of an enemy standing still proves nothing about which of the two
# went wrong. If neither happens it writes FAILED-INSTRUMENT and quits, so a
# silent failure never gets reported as "the behaviour does not work".
#
# Screenshots are numbered by second so the sequence reads as motion.

set CASE [lindex $::env(MIDEAS_CASE) 0]
set OUTDIR "C:/Users/salam/Documents/Programacion/Mideas/server/temp/behaviour_visual"
set LOG [open "$OUTDIR/${CASE}_probe.txt" w]
proc say {s} { puts $::LOG $s; flush $::LOG }

set POOL   0xD0D4
set STRIDE 30
set steps 0
set shots 0
set armed 0

proc rb {a} { return [debug read memory $a] }
proc slot {i off} { return [rb [expr {$::POOL + $i * $::STRIDE + $off}]] }

debug set_bp 0x60E5 {} { incr ::steps }
say "case=$CASE"

proc finish {why} {
    say "result=$why steps=$::steps shots=$::shots"
    close $::LOG
    exit
}

# Find the slot that is actually scripted: with two slots in the pool, assuming
# slot 0 is exactly how an earlier probe in this project ended up measuring the
# wrong body for half an hour.
proc scripted_slot {} {
    set count [rb 0xD0D3]
    for {set i 0} {$i < $count} {incr i} {
        if {[slot $i 13] == 14} { return $i }
    }
    return -1
}

proc arm {} {
    set count [rb 0xD0D3]
    set i [scripted_slot]
    if {$count == 0 || $i < 0 || $::steps == 0} {
        after time 0.25 arm
        return
    }
    set ::armed 1
    set ::slotIndex $i
    say "instrument OK: count=$count scriptedSlot=$i mode=[slot $i 13] prog=[slot $i 24] speed=[slot $i 21] interval=[slot $i 22]"
    say "bounds: minX=[slot $i 4] maxX=[slot $i 5]  start x=[slot $i 0] y=[slot $i 1]"
    say ""
    say "  s |   x   y  dx state timer | steps"
    after time 0.5 tick
}

proc tick {} {
    global slotIndex
    incr ::shots
    set name [format "%s/%s_%02d.png" $::OUTDIR $::CASE $::shots]
    screenshot -raw $name
    say [format "%3d | %3d %3d %3d %4d %5d | %5d" \
        $::shots [slot $slotIndex 0] [slot $slotIndex 1] [slot $slotIndex 2] \
        [slot $slotIndex 25] [slot $slotIndex 26] $::steps]
    if {$::shots >= 30} { finish "COMPLETE" }
    after time 1.0 tick
}

after time 4.0 arm
after time 40.0 { if {!$::armed} { finish "FAILED-INSTRUMENT" } }
