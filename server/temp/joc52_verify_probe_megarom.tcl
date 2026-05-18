set probe_mode "megarom"
set log_path "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_megarom.log"
set shot_dir "C:/Users/salam/Documents/Programacion/Mideas/server/temp/joc52_verify_shots"
set screen_addr 0xDFA4
set player_x_addr 0xDFAE
set player_y_addr 0xDFB0
file mkdir $shot_dir
set f [open $log_path "w"]

proc logline {msg} { global f; puts $f $msg; flush $f; puts $msg }
proc mem8 {addr} { if {[catch {debug read memory $addr} value]} { return -1 }; return $value }
proc mem16 {addr} { set lo [mem8 $addr]; set hi [mem8 [expr {$addr + 1}]]; if {$lo < 0 || $hi < 0} { return -1 }; return [expr {$lo | ($hi << 8)}] }
proc state {tag} {
    global screen_addr player_x_addr player_y_addr
    set pc [reg PC]; set sp [reg SP]
    set primary [mem8 0xFFFF]
    set p1 [mem8 0xC11B]; set p2 [mem8 0xC11C]; set p3 [mem8 0xC11D]
    set flow [mem8 0xC104]; set screen [mem8 $screen_addr]
    set entities [mem8 0xDFAB]
    set spriteslots [mem8 0xDFAC]
    set summary [mem8 0xDFAD]
    set boss_count [mem8 0xC006]
    set boss_active [mem8 0xC015]
    set layout0 [mem8 0xC457]
    set layout1 [mem8 0xC458]
    set layout32 [mem8 0xC477]
    set px [mem16 $player_x_addr]; set py [mem16 $player_y_addr]
    set input [mem8 0xC000]; set buttons [mem8 0xC002]
    logline [format "%s pc=%04X sp=%04X ffff=%02X banks=%02X/%02X/%02X flow=%02X screen=%02X ent=%02X spr=%02X sum=%02X boss=%02X/%02X layout=%02X,%02X,%02X input=%02X buttons=%02X player=%d,%d" $tag $pc $sp $primary $p1 $p2 $p3 $flow $screen $entities $spriteslots $summary $boss_count $boss_active $layout0 $layout1 $layout32 $input $buttons $px $py]
}
proc down {mask} { keymatrixdown 8 $mask }
proc up {mask} { keymatrixup 8 $mask }
proc tap_space {tag} { state ${tag}_before; down 1; after time 0.20 [list state ${tag}_held]; after time 0.28 [list up 1]; after time 0.35 [list state ${tag}_after] }
proc hold_right {tag} { state ${tag}_before; down 128; after time 0.70 [list state ${tag}_held]; after time 0.90 [list up 128]; after time 1.05 [list state ${tag}_after] }
proc shot {name tag} { global shot_dir probe_mode; state $tag; set path "$shot_dir/${probe_mode}_${name}.png"; if {[catch {screenshot $path} err]} { logline "SHOTERR $path $err" } else { logline "SHOTOK $path" } }

after time 2.0  { shot "boot" "boot" }
after time 7.0  { tap_space "space1" }
after time 8.0  { shot "after_space1" "after_space1" }
after time 12.0 { tap_space "space2" }
after time 13.2 { shot "after_space2" "after_space2" }
after time 14.0 { hold_right "right" }
after time 15.3 { shot "after_right" "after_right" }
after time 17.0 { state "final"; close $f; exit }
