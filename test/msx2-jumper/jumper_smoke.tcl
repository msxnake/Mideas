set logpath "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-jumper/jumper_smoke_log.txt"
set log [open $logpath w]
# RAM (from jumper_smoke.asm EQUs):
#   player_y=#C000 player_x=#C001 player_vy=#C006 player_flags=#C007
#   bitmap_jumper_timer=#C0DA bitmap_jumper_active=#C0DC/DD
set minpy 255
set maxpy 0
set fires 0
set prevtimer 0
set samples 0
proc sample {} {
    global log minpy maxpy fires prevtimer samples
    set py [debug read memory 0xC000]
    set vy [debug read memory 0xC006]
    set timer [debug read memory 0xC0DA]
    set active [expr {[debug read memory 0xC0DC] + 256 * [debug read memory 0xC0DD]}]
    if {$py < $minpy} { set minpy $py }
    if {$py > $maxpy} { set maxpy $py }
    if {$timer == 12 && $prevtimer != 12} { incr fires }
    set prevtimer $timer
    incr samples
    if {$samples % 20 == 0} {
        puts $log "s=$samples py=$py vy=$vy timer=$timer active=$active"
        flush $log
    }
    if {$samples < 600} {
        after frame sample
    } else {
        puts $log "SUMMARY min=$minpy max=$maxpy fires=$fires"
        flush $log
        screenshot -prefix jumper_smoke_
        after time 1 {
            close $log
            exit
        }
    }
}
after time 4 { sample }
