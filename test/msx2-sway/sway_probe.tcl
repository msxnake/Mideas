# Grass-sway runtime probe.
#
# The fixture plants 9 swaying cells on row 10 (cols 4..12) of the boot room, on
# top of a solid row-11 floor, with the player standing to their left. Frames are
# three visibly different bricks: green = at rest, red = bent left, cyan = bent right.
#
# What this asserts, reading the pool at bitmap_sway_pool:
#   1. Nothing is bent while the player has not reached the strip.
#   2. Walking RIGHT into the strip claims slots with drawn = 2 (bent right).
#   3. Walking LEFT flips the same cells to 1 (bent left).
#   4. Standing clear again releases every slot within the hold window, i.e. the
#      grass springs back up on its own instead of staying flattened.

set dir "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-sway"
set f [open "$dir/_sway_probe.txt" "w"]
proc L {m} { global f; puts $f $m; flush $f }

# Addresses are EXTRACTED from the built ASM by run_probe.sh, never hardcoded:
# the sway RAM block is sized from the player hitbox, so a fixture with a taller
# player moves the pool and a stale constant would silently probe garbage.
source "$dir/_sway_addrs.tcl"
set STRIDE   5
set SLOTS    8

proc rb {a} { debug read memory $a }
proc slot {i o} { global POOL STRIDE; return [rb [expr {$POOL + $i * $STRIDE + $o}]] }

# One line per non-free slot: cell (col,row), set, want, drawn, timer.
proc dump {tag} {
    global SLOTS PLAYER_X PLAYER_Y FACING COMPOSE
    set live {}
    for {set i 0} {$i < $SLOTS} {incr i} {
        set cell [slot $i 0]
        if {$cell == 255} continue
        lappend live [format "slot%d cell=%d(c%d,r%d) set=%d want=%d drawn=%d t=%d" \
            $i $cell [expr {$cell & 15}] [expr {$cell >> 4}] \
            [slot $i 1] [slot $i 2] [slot $i 3] [slot $i 4]]
    }
    L "$tag player=([rb $PLAYER_X],[rb $PLAYER_Y]) facing=[rb $FACING] compose=[rb $COMPOSE] live=[llength $live]"
    foreach line $live { L "    $line" }
    return $live
}

# Count live slots showing a given drawn frame.
proc count_drawn {want} {
    global SLOTS
    set n 0
    for {set i 0} {$i < $SLOTS} {incr i} {
        if {[slot $i 0] != 255 && [slot $i 3] == $want} { incr n }
    }
    return $n
}

set ::fails 0
proc check {label ok} {
    if {$ok} { L "PASS  $label" } else { L "FAIL  $label"; incr ::fails }
}

# --- Phases, chained so each starts from a KNOWN state instead of a guessed
# --- wall-clock offset (boot time varies with the machine/BIOS).
proc phase3 {} {
    L "=== phase 3: left the strip, hold window elapsed ==="
    set live [dump "  "]
    check "every slot released: the grass stood back up" [expr {[llength $live] == 0}]
    L ""
    if {$::fails == 0} { L "RESULT ALL PASS" } else { L "RESULT $::fails CHECK(S) FAILED" }
    catch {screenshot -raw "[set ::dir]/_sway_probe.png"}
    close $::f
    exit
}

proc phase2 {} {
    L "=== phase 2: turned and walked LEFT inside the grass ==="
    dump "  "
    check "bent cells flipped to the LEFT frame (drawn=1)" [expr {[count_drawn 1] > 0}]
    # Keep walking left, clear of the strip, then let the hold timers expire.
    keymatrixdown 8 0x10
    after time 1.2 { keymatrixup 8 0x10 ; after time 1.5 phase3 }
}

proc phase1 {} {
    L "=== phase 1: walked RIGHT into the grass ==="
    set live [dump "  "]
    check "at least one cell is bent" [expr {[llength $live] > 0}]
    check "bent cells show the RIGHT frame (drawn=2)" [expr {[count_drawn 2] > 0}]
    check "no cell shows the LEFT frame yet" [expr {[count_drawn 1] == 0}]
    catch {screenshot -raw "[set ::dir]/_sway_right.png"}
    # Turn around inside the strip.
    keymatrixdown 8 0x10
    after time 0.4 { keymatrixup 8 0x10 ; after time 0.3 phase2 }
}

proc phase0 {} {
    L "=== phase 0: booted, player still left of the strip ==="
    set live [dump "  "]
    check "nothing bent before the player reaches the grass" [expr {[llength $live] == 0}]
    catch {screenshot -raw "[set ::dir]/_sway_rest.png"}
    # 0.8 s of RIGHT is ~96 px at 2 px/frame: from x=16 that lands mid-strip.
    # (3 s walked 360 px, straight out of the room through the east exit.)
    keymatrixdown 8 0x80
    after time 0.8 { keymatrixup 8 0x80 ; after time 0.3 phase1 }
}

# Wait for the game (not the BIOS) to be up: init writes #FF into every pool slot.
set ::waited 0
proc wait_boot {} {
    incr ::waited
    if {[slot 0 0] == 255} {
        L "game up after ~[expr {$::waited * 0.5 + 3}]s"
        phase0
        return
    }
    if {$::waited > 40} {
        L "FAIL  the sway pool never initialised (slot0=[slot 0 0]) - did the ROM boot?"
        incr ::fails
        close $::f
        exit
    }
    after time 0.5 wait_boot
}
after time 3 wait_boot
