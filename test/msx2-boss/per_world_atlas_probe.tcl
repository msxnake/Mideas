# FASE 5 hardware probe: does crossing a WorldLink really swap the atlas in VRAM?
#
# The generator can emit a perfect dispatcher and still be wrong about which
# bytes land in VRAM, so this reads the VDP memory itself rather than looking at
# the screen.
#
# Route:
#   1. boot, let world 0 compose, dump the first atlas row (VRAM #10000)
#   2. raise bitmap_gameflow_exit_flag -- the SAME byte the "Exit World" tile
#      raises on contact. The main loop returns to the Game Flow dispatcher,
#      which follows the WorldLink's default connection into world 1, and that
#      node runs bitmap_prepare_world + upload_tileset_atlas for real.
#   3. dump the same row again, plus a row deep in the atlas that only the TALL
#      world reaches (world 1 is 48 rows, world 0 is 208).
#
# Expected: row 512 changes, row 612 does not (the short world never writes it).

set out "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/out/per_world_atlas_probe.txt"
set f [open $out "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

set EXIT_FLAG  0xC1F8
set WORLD_IDX  0xD39F

# VRAM row R starts at R * 128 bytes (SCREEN 5: 256 px * 4 bpp).
proc vram_row {row count} {
    set base [expr {$row * 128}]
    set bytes {}
    for {set i 0} {$i < $count} {incr i} {
        lappend bytes [format "%02X" [debug read "VRAM" [expr {$base + $i}]]]
    }
    return [join $bytes " "]
}

# Row 545 is where the two atlases actually disagree (found by decoding both RLE
# streams out of the ROM -- see decode_world_atlases.mjs). Sampling a row both
# worlds fill with the same flat colour would have "passed" no matter what.
#   world 0: 11 11 11 ... (flat)
#   world 1: 12 11 22 12 12 12 21 21 21 22 21 12 21 22 11 12
# Row 612 is past world 1's 48-row atlas, so it must KEEP world 0's bytes: that
# is the evidence that a short world only writes its own rows.
proc snapshot {tag} {
    global WORLD_IDX
    logline "$tag world_index=[debug read memory $WORLD_IDX]"
    logline "$tag row545 = [vram_row 545 16]"
    logline "$tag row612 = [vram_row 612 16]"
}

# Boot: skip any presentation with SPACE, then let the room compose.
for {set t 3} {$t < 12} {incr t} {
    after time $t                "keymatrixdown 8 0x01"
    after time [expr {$t + 0.4}] "keymatrixup 8 0x01"
}

after time 14 {
    snapshot "BEFORE"
    # Exit World: the flag the deadly/exit systems raise. This is the game's own
    # world-change path, not a forced call to the upload routine.
    debug write memory 0xC1F8 1
}

after time 20 {
    snapshot "AFTER"
    logline "DONE"
    exit 0
}

# Safety net: never hang a CI run.
after time 40 { logline "TIMEOUT"; exit 1 }
