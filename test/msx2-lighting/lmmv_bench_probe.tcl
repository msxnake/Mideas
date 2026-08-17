set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/lmmv_bench.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

proc mem16 {addr} {
    set lo [debug read memory $addr]
    set hi [debug read memory [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}
proc mem32 {addr} {
    return [expr {[mem16 $addr] | ([mem16 [expr {$addr + 2}]] << 16)}]
}

# Same poll loop as boss_blit_bench: inc bc(7) + in a,(#99)(12) + rra(5)
# + jr c taken(13) = 37 T @ 3.579545 MHz -> 10.336 us per iteration.
set us_per_iter 10.336
set frame_ms 16.667

# label, slot index, repetitions, pixels per repetition, bytes per repetition
set rows {
    {"HMMM 256x64 sprOFF"   0     8  16384  8192}
    {"HMMM 256x64 sprON"    1     8  16384  8192}
    {"HMMV 256x64"          2     8  16384  8192}
    {"LMMV IMP 256x64"      3     8  16384  8192}
    {"LMMV OR  256x64"      4     8  16384  8192}
    {"LMMV AND 256x64"      5     8  16384  8192}
    {"LMMV OR  64x64"       6    32   4096  2048}
    {"LMMV OR  2x8"         7  2048     16     8}
    {"LMMV OR  2x32"        8  2048     64    32}
    {"LMMV OR  40x2"        9  2048     80    40}
    {"LMMV OR  10x2"       10  2048     20    10}
    {"halo X pass d=2"     11   128    256   128}
    {"halo Y pass d=2"     12   128    320   160}
    {"halo X+Y pass d=8"   13    64   2304  1152}
    {"room fill 256x192"   14     2  49152 24576}
    {"room fill blanked"    15     2  49152 24576}
}

proc report {} {
    global us_per_iter frame_ms rows
    set done [mem16 0xC0C0]
    logline [format "done_marker=%04X (expect ABCD)" $done]
    logline ""
    logline "V9938 command cost, SCREEN 5, display ON, page 0 visible."
    logline "vdp_ms  = CE-busy time only (the blitter)."
    logline "wall_ms = measured with the vblank flag, includes the Z80 side"
    logline "          (only valid when one command is shorter than a frame)."
    logline ""
    logline [format "%-20s %8s %9s %9s %9s %9s" \
        "measurement" "iters" "vdp_ms" "wall_ms" "us/px" "us/byte"]
    foreach row $rows {
        lassign $row label slot k px bytes
        set addr [expr {0xC000 + $slot * 8}]
        set iters [mem32 $addr]
        set vbl [mem16 [expr {$addr + 4}]]
        set vdp_ms [expr {$iters * $us_per_iter / 1000.0 / $k}]
        set wall_ms [expr {$vbl * $frame_ms / double($k)}]
        set us_px [expr {$iters * $us_per_iter / double($k) / $px}]
        set us_byte [expr {$iters * $us_per_iter / double($k) / $bytes}]
        logline [format "%-20s %8d %9.3f %9.3f %9.3f %9.3f" \
            $label $iters $vdp_ms $wall_ms $us_px $us_byte]
    }
    logline ""
    logline "% of a 16.667 ms frame (wall clock, halo passes):"
    foreach slot {11 12 13} k {128 128 64} label {"X d=2" "Y d=2" "X+Y d=8"} {
        set addr [expr {0xC000 + $slot * 8}]
        set vbl [mem16 [expr {$addr + 4}]]
        set wall_ms [expr {$vbl * $frame_ms / double($k)}]
        logline [format "  %-10s %6.2f ms  = %5.1f %% of frame" \
            $label $wall_ms [expr {$wall_ms / $frame_ms * 100.0}]]
    }
}

after time 22 {
    if {[mem16 0xC0C0] != 0xABCD} {
        logline "not finished yet at t=22s, waiting 15 s more"
        after time 15 { report ; screenshot -prefix lmmv_bench_ ; after time 1 { exit } }
    } else {
        report
        screenshot -prefix lmmv_bench_
        after time 1 { exit }
    }
}
