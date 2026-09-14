# Diagnostic probe for boss path-phase smoke: log player vitals and boss continuity.
set log_path "C:/Users/salam/Documents/Programacion/Mideas/test/msx2-boss/path_phase_damage_probe.txt"
set f [open $log_path "w"]
proc logline {msg} { global f; puts $f $msg; flush $f }
proc mem8 {addr} { return [debug read memory $addr] }
set throttle off
set ACTIVE 0xD1DA
set X 0xD1DB
set Y 0xD1DC
set HP 0xD1E1
set IDX 0xD1EF
set PENDING 0xD1F1
set HPLIVE 0xD17A
set INTRO 0xD1D2
set PX 0xC001
set PY 0xC000
set PHEALTH 0xC1FD
set PLIVES 0xC1FE
set PINV 0xC1FF
set GAMEOVER 0xC1F8
set frame 0
set lastHealth -1
set lastInv -1
set lastLives -1
set lastGameOver -1
set pokeFrame -1
set swapFrame -1
set prevPath -1
proc watch {} {
    global frame ACTIVE X Y IDX PENDING PX PY PHEALTH PINV PLIVES GAMEOVER lastHealth lastInv lastLives lastGameOver prevPath swapFrame
    incr frame
    # Diagnostic isolation: keep the player alive/invulnerable so a contact
    # cannot end the loop before the route swap is observed.
    debug write memory $PHEALTH 50
    debug write memory $PLIVES 9
    debug write memory $PINV 255
    set active [mem8 $ACTIVE]
    set hp [mem8 $PHEALTH]
    set inv [mem8 $PINV]
    set lives [mem8 $PLIVES]
    set over [mem8 $GAMEOVER]
    set path [mem8 $IDX]
    if {$hp != $lastHealth || $inv != $lastInv || $lives != $lastLives || $over != $lastGameOver || ($path != $prevPath && $prevPath >= 0)} {
        logline "EVENT frame=$frame boss=[mem8 $X],[mem8 $Y] path=$path pending=[mem8 $PENDING] player=[mem8 $PX],[mem8 $PY] health=$hp inv=$inv lives=$lives gameover=$over active=$active"
        set lastHealth $hp; set lastInv $inv; set lastLives $lives; set lastGameOver $over; set prevPath $path
        if {$path == 2 && $swapFrame < 0} { set swapFrame $frame }
    }
    if {($frame % 60) == 0} {
        logline "SAMPLE frame=$frame boss=[mem8 $X],[mem8 $Y] path=$path pending=[mem8 $PENDING] player=[mem8 $PX],[mem8 $PY] health=$hp inv=$inv lives=$lives gameover=$over active=$active"
    }
    after frame watch
}
foreach t {6 8 10} {
    after time $t "keymatrixdown 8 0x01"
    after time [expr {$t + 0.5}] "keymatrixup 8 0x01"
}
after time 12 { debug write memory $INTRO 0 }
after time 13 {
    set frame 0
    set lastHealth -1; set lastInv -1; set lastLives -1; set lastGameOver -1; set prevPath -1
    debug write memory $PHEALTH 50
    debug write memory $PLIVES 9
    debug write memory $PINV 255
    debug write memory $GAMEOVER 0
    logline "START boss=[mem8 $X],[mem8 $Y] hp=[mem8 $HP] path=[mem8 $IDX] player=[mem8 $PX],[mem8 $PY] health=[mem8 $PHEALTH] inv=[mem8 $PINV] lives=[mem8 $PLIVES] gameover=[mem8 $GAMEOVER]"
    watch
}
after time 26 {
    global frame pokeFrame
    set pokeFrame $frame
    debug write memory $HP 10
    debug write memory $HPLIVE 10
    logline "POKE frame=$pokeFrame boss=[mem8 $X],[mem8 $Y] path=[mem8 $IDX] player=[mem8 $PX],[mem8 $PY] health=[mem8 $PHEALTH] inv=[mem8 $PINV] lives=[mem8 $PLIVES] gameover=[mem8 $GAMEOVER]"
}
after time 36 {
    logline "FINAL frame=$frame boss=[mem8 $X],[mem8 $Y] path=[mem8 $IDX] pending=[mem8 $PENDING] hp=[mem8 $HP] player=[mem8 $PX],[mem8 $PY] health=[mem8 $PHEALTH] inv=[mem8 $PINV] lives=[mem8 $PLIVES] gameover=[mem8 $GAMEOVER] swapFrame=$swapFrame"
    close $f
    after time 1 { exit }
}
