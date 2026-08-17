# Counts what the halo actually costs per frame while the player walks:
# calls to bitmap_light_rect (each one is a V9938 fill: ~0,27 ms of fixed cost
# plus 5,94 us/px, measured in lmmv_bench) against main-loop iterations.
#
# Run twice with the same window, once per ROM, and compare rects/frame:
#   openmsx -machine C-BIOS_MSX2 -cart mina_base.rom -script halo_cost_probe.tcl
#   openmsx -machine C-BIOS_MSX2 -cart mina_opt.rom  -script halo_cost_probe.tcl
# The label is read from the environment so both runs write different logs.

set tag $env(HALO_TAG)
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-lighting/halo_cost_$tag.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }

set ::n_rect 0
set ::n_loop 0

# Same addresses in both ROMs (checked in the .sym files).
set addr_rect 0x4EAE
set addr_loop 0x414E

after time 9 {
    debug set_bp $::addr_rect {} {incr ::n_rect}
    debug set_bp $::addr_loop {} {incr ::n_loop}
    keymatrixdown 8 0x80            ; hold RIGHT
}

# 3 emulated seconds of walking.
after time 12 {
    keymatrixup 8 0x80
    set frames $::n_loop
    set rects $::n_rect
    logline "tag=$tag  window=3 s walking right"
    logline "main-loop iterations : $frames  ([format %.1f [expr {$frames / 3.0}]] fps)"
    logline "bitmap_light_rect    : $rects"
    if {$frames > 0} {
        logline [format "rectangles / frame   : %.2f" [expr {$rects / double($frames)}]]
        # 0.27 ms fixed per rectangle (lmmv_bench: wall - vdp on a thin strip)
        logline [format "fixed cost / frame   : %.2f ms = %.1f %% of a frame" \
            [expr {$rects * 0.27 / $frames}] \
            [expr {$rects * 0.27 / $frames / 16.667 * 100.0}]]
    }
    screenshot -prefix halo_${tag}_
    after time 1 { exit }
}
