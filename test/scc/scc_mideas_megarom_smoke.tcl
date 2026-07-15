# Integrated Mideas SCC MegaROM smoke. Addresses come from the paired .sym
# generated from scc_mideas_screen2_megarom.json.
set result_path "C:/tmp/Mideas-scc-konami-editor/test/scc/out/scc_mideas_megarom_smoke.txt"
set fh [open $result_path "w"]
set reset_hits 0
catch { set throttle off }

proc mem8 {addr} { return [debug read memory $addr] }
proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}
proc logline {line} {
    global fh
    puts $fh $line
    flush $fh
}
proc state {tag} {
    set saved_p2 [mem8 0xC154]
    logline [format "%s pc=%04X p2=%02X common_active=%d common_muted=%d scc_active=%d loop_count=%d row=%d mixer=%02X vol1=%d irq_frames=%d" \
        $tag [reg PC] $saved_p2 [mem8 0xE8DE] [mem8 0xE8DF] [mem8 0xE90B] [mem8 0xE90D] [mem8 0xE913] [mem8 0xE91F] [mem8 0xE948] [mem16 0xE8D0]]
}
proc waveform_probe {} {
    set saved_p2 [mem8 0xC154]
    debug write memory 0x9000 0x3F
    set wave {}
    foreach off {0 1 2 3} {
        lappend wave [format %02X [mem8 [expr {0x9800 + $off}]]]
    }
    debug write memory 0x9000 $saved_p2
    logline "wave_ch1_first4=$wave restored_p2=$saved_p2"
}
proc tap_space {} {
    keymatrixdown 8 1
    after time 0.18 { keymatrixup 8 1 }
}

debug set_bp 0x4010 {} {
    incr reset_hits
    logline [format "boot_or_reset hit=%d pc=%04X" $reset_hits [reg PC]]
    if {$reset_hits == 1} {
        after time 3.0 { state "t3"; waveform_probe }
        after time 6.0 { state "t6_before_space"; tap_space }
        after time 8.0 { state "t8_after_space"; waveform_probe }
        after time 11.0 {
            state "t11_final"
            logline "reset_hits=$reset_hits (expect 1)"
            close $fh
            exit
        }
    }
    debug cont
}
