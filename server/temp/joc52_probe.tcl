set f [open "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_unknown_probe.log" "w"]
puts $f "start"
flush $f

proc log {msg} {
    global f
    puts $f $msg
    flush $f
}

proc mem8 {addr} {
    if {[catch {debug read memory $addr} v]} {
        return "ERR"
    }
    return $v
}

proc state {tag} {
    if {[catch {reg PC} pc]} { set pc "ERR" }
    if {[catch {reg SP} sp]} { set sp "ERR" }
    set p1 [mem8 49235]
    set p2 [mem8 49236]
    set p3 [mem8 49237]
    set p4 [mem8 49238]
    set flow [mem8 49211]
    set exit [mem8 49213]
    set screen [mem8 58673]
    log "$tag pc=$pc sp=$sp p1=$p1 p2=$p2 p3=$p3 p4=$p4 flow=$flow exit=$exit screen=$screen"
}

proc shot {name} {
    if {[catch {screenshot "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_unknown_shot.png"} err]} {
        log "shot_$name ERR $err"
    } else {
        log "shot_$name OK"
    }
}

after time 1.0 {
    state "t1"
}

after time 4.0 {
    state "t4"
    shot "t4"
}

after time 7.0 {
    keymatrixdown 8 1
}

after time 7.2 {
    keymatrixup 8 1
    state "space1"
}

after time 12.0 {
    keymatrixdown 8 1
}

after time 12.2 {
    keymatrixup 8 1
    state "space2"
}

after time 16.0 {
    state "done"
    close $f
    exit
}
