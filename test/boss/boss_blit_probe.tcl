set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/boss/boss_blit_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem16 {addr} {
    set lo [debug read memory $addr]
    set hi [debug read memory [expr {$addr + 1}]]
    return [expr {$lo | ($hi << 8)}]
}

# Poll-loop cost: inc bc(7) + in a,(#99)(12) + rra(5) + jr c taken(13) = 37 T
# @ 3.579545 MHz -> 10.336 us per iteration.
set us_per_iter 10.336

proc report_size {label addr} {
    global us_per_iter
    set iters [mem16 $addr]
    set ms [expr {$iters * $us_per_iter / 1000.0}]
    logline [format "%-8s iters=%5d  time=%.2f ms" $label $iters $ms]
}

after time 26 {
    set done [mem16 0xC00E]
    logline [format "done_marker=%04X (expect ABCD)" $done]
    logline "--- static HMMM copy times (display+sprites ON) ---"
    report_size "32x32"  0xC000
    report_size "48x48"  0xC002
    report_size "64x64"  0xC004
    report_size "96x96"  0xC006
    report_size "128x96" 0xC008
    logline "--- dynamic 300-frame moving-boss tests ---"
    logline [format "overruns 64x64 : %d / 300 frames" [mem16 0xC00A]]
    logline [format "overruns 96x96 : %d / 300 frames" [mem16 0xC00C]]
    screenshot -prefix boss_blit_
    after time 1 { exit }
}
