set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/tales7_dump_runtime_buffers_mega.log"
set f [open $log_path "w"]

proc logline {msg} {
    global f
    puts $f $msg
    flush $f
    puts $msg
}

proc mem8 {addr} {
    if {[catch {debug read memory $addr} value]} {
        return 0
    }
    return $value
}

proc mem16 {addr} {
    set lo [mem8 $addr]
    set hi [mem8 [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

proc dumpbytes {tag addr count} {
    set out ""
    for {set i 0} {$i < $count} {incr i} {
        append out [format "%02X" [mem8 [expr {$addr + $i}]]]
        if {$i + 1 < $count} { append out " " }
    }
    logline "$tag $out"
}

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set flow [mem8 0xC03B]
    set screen [mem8 0xE531]
    set px [mem16 0xE53B]
    set py [mem16 0xE53D]
    logline [format "%s pc=%04X sp=%04X flow=%02X screen=%02X pos=%d,%d" $tag $pc $sp $flow $screen $px $py]
}

after time 10.0 {
    state "t10"
    dumpbytes "runtime_background_layout_000" 0xC152 96
    dumpbytes "runtime_background_layout_640" 0xC3D2 96
    dumpbytes "runtime_screen_layout_000" 0xC452 96
    dumpbytes "runtime_screen_layout_640" 0xC6D2 96
    dumpbytes "runtime_effects_layout_000" 0xD452 32
    close $f
    exit
}

