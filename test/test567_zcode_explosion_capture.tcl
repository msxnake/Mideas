# ZCode contest entry capture v2: hold fire, watch Alpha's HP (boss_hp EQU
# #D0DA from THIS build), screenshot-storm the death with [list] so paths
# substitute at schedule time (v1 lost t1..t5 to Tcl brace scoping).
set rom_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test567_zcode.rom"
carta $rom_path

after time 5.5 { keymatrixdown 4 0x08 }

set fired 0
proc watch {} {
    global fired
    if {$fired} return
    set hp [debug read memory 0xD0DA]
    if {$hp == 0} {
        set fired 1
        set base "C:/Users/salam/Documents/Programacion/Mideas/server/temp/test567_zcode_kill"
        screenshot "${base}_t0.png"
        after time 0.08 [list screenshot "${base}_t1.png"]
        after time 0.16 [list screenshot "${base}_t2.png"]
        after time 0.24 [list screenshot "${base}_t3.png"]
        after time 0.35 [list screenshot "${base}_t4.png"]
        after time 0.50 [list screenshot "${base}_t5.png"]
        after time 4 [list exit]
    } else {
        after time 0.033 watch
    }
}
after time 6.0 watch
after time 45 { exit }
