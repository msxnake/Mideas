set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/tales7_generic_long.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/tales7_generic_long_shots"
file mkdir $shot_dir
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

proc state {tag} {
    set pc [reg PC]
    set sp [reg SP]
    set p1 [mem8 0xC053]
    set p2 [mem8 0xC054]
    set p3 [mem8 0xC055]
    set p4 [mem8 0xC056]
    set flow [mem8 0xC03B]
    set screen [mem8 0xE531]
    set px [mem16 0xE53B]
    set py [mem16 0xE53D]
    set irq [mem16 0xC047]
    logline [format "%s pc=%04X sp=%04X bank=%02X/%02X/%02X/%02X flow=%02X screen=%02X irq=%04X pos=%d,%d" $tag $pc $sp $p1 $p2 $p3 $p4 $flow $screen $irq $px $py]
}

proc shot {name tag} {
    global shot_dir
    state $tag
    if {[catch {screenshot "$shot_dir/$name"} err]} {
        logline "SHOTERR $err"
    } else {
        logline "SHOTOK $name"
    }
}

debug set_bp 0x4010 {} {
    state "BP_4010"
    debug cont
}

after time 1.0  { shot "tales7_generic_t01.png" "t01" }
after time 3.0  { shot "tales7_generic_t03.png" "t03" }
after time 6.0  { shot "tales7_generic_t06.png" "t06" }
after time 10.0 { shot "tales7_generic_t10.png" "t10" }
after time 20.0 { shot "tales7_generic_t20.png" "t20" }
after time 40.0 { shot "tales7_generic_t40.png" "t40" }
after time 60.0 { shot "tales7_generic_t60.png" "t60"; close $f; exit }
