set root [file normalize [file join [file dirname [info script]] ../..]]
set out [file join $root server temp pt3-50hz]
set input [open [file join $out probe.sym] r]
set symbols [read $input]
close $input
proc symbol {name} {
    global symbols
    if {![regexp -line "^${name}: equ (\[0-9A-F\]+)H" $symbols -> hex]} {
        error "Missing symbol: $name"
    }
    return [scan $hex %x]
}
array set counts {1 0 2 0 3 0}
debug set_bp [symbol PT3_PLAY] {} {
    set stage [debug read memory 0xC005]
    incr counts($stage)
    debug cont
}
debug set_bp [symbol probe_done] {} {
    set result "NTSC forced50=$counts(1), NTSC default=$counts(2), PAL forced50=$counts(3)"
    set output [open [file join $out openmsx-result.log] w]
    puts $output $result
    if {$counts(1) == 50 && $counts(2) == 60 && $counts(3) == 60} {
        puts $output "PASS"
    } else {
        puts $output "FAIL"
    }
    close $output
    debug cont
    after time 0.1 {screenshot [file join $out rom.png]; exit}
}
after realtime 30 {puts stderr "PT3 probe timed out"; exit}
set throttle off
set sound_driver null
